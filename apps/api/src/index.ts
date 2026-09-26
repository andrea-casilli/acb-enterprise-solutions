import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import express, { type NextFunction, type Request, type RequestHandler, type Response } from 'express';
import {
  AttendanceStatus,
  CommunicationKind,
  CommunicationStatus,
  Prisma,
  Priority,
  ReceiptStatus,
  ShiftStatus,
  UserRole,
} from '@prisma/client';
import { z } from 'zod';
import { allow, type AuthUser, requireAuth, signToken } from './auth.js';
import { config } from './config.js';
import { prisma, verifyDatabaseConnection } from './db.js';
import { ApiError, errorHandler, notFound } from './errors.js';
import { noStore, rateLimit, requestContext } from './middleware.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', config.trustProxy);

const asyncRoute = (
  handler: (request: Request, response: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler => (request, response, next) => {
  void handler(request, response, next).catch(next);
};

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Usa il formato YYYY-MM-DD').refine(
  (value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  },
  'Data non valida',
);
const resourceIdSchema = z.string().cuid('Identificativo non valido');
const optionalText = (max: number) => z.string().trim().max(max).optional().transform((value) => value || undefined);
const dateTimeSchema = z.string().trim().max(40).refine(
  (value) => !Number.isNaN(Date.parse(value)),
  'Data e ora non valide',
);
const securePasswordSchema = z.string().min(12).max(128)
  .refine((value) => /[a-z]/.test(value), 'La password deve contenere una minuscola')
  .refine((value) => /[A-Z]/.test(value), 'La password deve contenere una maiuscola')
  .refine((value) => /\d/.test(value), 'La password deve contenere un numero')
  .refine((value) => /[^A-Za-z0-9]/.test(value), 'La password deve contenere un carattere speciale');

const employeeCodeSchema = z.string().trim().min(2).max(32)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/, 'Il codice può contenere solo lettere, numeri, punti, trattini, underscore e slash')
  .transform((value) => value.toUpperCase());

const createEmployeeSchema = z.object({
  code: employeeCodeSchema,
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  role: z.nativeEnum(UserRole).default(UserRole.VIEWER),
  departmentId: resourceIdSchema,
  jobProfileId: resourceIdSchema.optional(),
  hiredAt: isoDateSchema,
  temporaryPassword: securePasswordSchema,
}).strict();

const communicationTextSchema = z.string().trim().min(1, 'Il messaggio non può essere vuoto').max(5_000);

const createCommunicationSchema = z.object({
  title: z.string().trim().min(3).max(180),
  message: communicationTextSchema.optional(),
  // `content` is accepted for clients that use the database terminology.
  content: communicationTextSchema.optional(),
  recipientDepartmentId: resourceIdSchema,
  senderDepartmentId: resourceIdSchema.optional(),
  priority: z.nativeEnum(Priority).default(Priority.NORMAL),
  kind: z.nativeEnum(CommunicationKind).default(CommunicationKind.REQUEST),
}).strict().superRefine((value, context) => {
  if (!value.message && !value.content) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Inserisci il testo della comunicazione', path: ['message'] });
  }
  if (value.message && value.content && value.message !== value.content) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'message e content devono coincidere', path: ['content'] });
  }
}).transform(({ message, content, ...value }) => ({ ...value, content: message ?? content! }));

const createCommunicationMessageSchema = z.object({
  message: communicationTextSchema.optional(),
  content: communicationTextSchema.optional(),
}).strict().superRefine((value, context) => {
  if (!value.message && !value.content) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Inserisci il testo del messaggio', path: ['message'] });
  }
  if (value.message && value.content && value.message !== value.content) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'message e content devono coincidere', path: ['content'] });
  }
}).transform(({ message, content }) => ({ content: message ?? content! }));

const listCommunicationsQuerySchema = z.object({
  departmentId: resourceIdSchema.optional(),
  status: z.nativeEnum(CommunicationStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  kind: z.nativeEnum(CommunicationKind).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const updateCommunicationStatusSchema = z.object({
  status: z.nativeEnum(CommunicationStatus),
}).strict();

const employeeInclude = {
  user: { select: { id: true, email: true, firstName: true, lastName: true, role: true, active: true } },
  department: true,
  jobProfile: true,
} satisfies Prisma.EmployeeInclude;

const allRoles: UserRole[] = Object.values(UserRole);
const workforceManagers: UserRole[] = [UserRole.ADMIN, UserRole.HR, UserRole.SUPERVISOR];
const logisticsOperators: UserRole[] = [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.WAREHOUSE_OPERATOR, UserRole.RECEIVING_OPERATOR];
const communicationManagers: UserRole[] = [UserRole.ADMIN, UserRole.HR, UserRole.SUPERVISOR];
const receiptTransitions: Record<ReceiptStatus, ReceiptStatus[]> = {
  [ReceiptStatus.DRAFT]: [ReceiptStatus.ARRIVED],
  [ReceiptStatus.ARRIVED]: [ReceiptStatus.CHECKING, ReceiptStatus.REJECTED],
  [ReceiptStatus.CHECKING]: [ReceiptStatus.ACCEPTED, ReceiptStatus.REJECTED],
  [ReceiptStatus.ACCEPTED]: [ReceiptStatus.CLOSED],
  [ReceiptStatus.REJECTED]: [ReceiptStatus.CLOSED],
  [ReceiptStatus.CLOSED]: [],
};
const communicationTransitions: Record<CommunicationStatus, CommunicationStatus[]> = {
  [CommunicationStatus.OPEN]: [CommunicationStatus.IN_PROGRESS, CommunicationStatus.RESOLVED, CommunicationStatus.CLOSED],
  [CommunicationStatus.IN_PROGRESS]: [CommunicationStatus.OPEN, CommunicationStatus.RESOLVED, CommunicationStatus.CLOSED],
  [CommunicationStatus.RESOLVED]: [CommunicationStatus.IN_PROGRESS, CommunicationStatus.CLOSED],
  [CommunicationStatus.CLOSED]: [],
};

const communicationDepartmentSelect = {
  id: true,
  code: true,
  name: true,
} satisfies Prisma.DepartmentSelect;

const communicationAuthorSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
} satisfies Prisma.UserSelect;

const communicationListInclude = {
  senderDepartment: { select: communicationDepartmentSelect },
  recipientDepartment: { select: communicationDepartmentSelect },
  author: { select: communicationAuthorSelect },
  _count: { select: { messages: true } },
} satisfies Prisma.DepartmentCommunicationInclude;

const communicationDetailInclude = {
  ...communicationListInclude,
  messages: {
    include: { author: { select: communicationAuthorSelect } },
    orderBy: { createdAt: 'asc' },
    take: 500,
  },
} satisfies Prisma.DepartmentCommunicationInclude;

function utcDate(value = new Date().toISOString().slice(0, 10)) {
  return new Date(`${isoDateSchema.parse(value)}T00:00:00.000Z`);
}

function parseId(value: unknown) {
  return resourceIdSchema.parse(value);
}

function parseDate(value: unknown) {
  return utcDate(isoDateSchema.parse(value));
}

function assertDateRange(from: Date, to: Date) {
  const rangeDays = (to.getTime() - from.getTime()) / 86_400_000;
  if (rangeDays < 0 || rangeDays > 93) {
    throw new ApiError(422, 'L’intervallo deve essere compreso tra 0 e 93 giorni', 'INVALID_DATE_RANGE');
  }
}

async function assertReferenceData(input: {
  supplierId?: string;
  warehouseId?: string;
  departmentId?: string;
  jobProfileId?: string;
  employeeId?: string;
  templateId?: string;
}) {
  const [supplier, warehouse, department, profile, employee, template] = await Promise.all([
    input.supplierId ? prisma.supplier.findUnique({ where: { id: input.supplierId }, select: { id: true } }) : undefined,
    input.warehouseId ? prisma.warehouse.findUnique({ where: { id: input.warehouseId }, select: { id: true } }) : undefined,
    input.departmentId ? prisma.department.findUnique({ where: { id: input.departmentId }, select: { id: true } }) : undefined,
    input.jobProfileId ? prisma.jobProfile.findUnique({ where: { id: input.jobProfileId }, select: { id: true } }) : undefined,
    input.employeeId ? prisma.employee.findUnique({ where: { id: input.employeeId }, select: { id: true } }) : undefined,
    input.templateId ? prisma.shiftTemplate.findUnique({ where: { id: input.templateId }, select: { id: true } }) : undefined,
  ]);

  if (input.supplierId && !supplier) throw notFound('Fornitore');
  if (input.warehouseId && !warehouse) throw notFound('Magazzino');
  if (input.departmentId && !department) throw notFound('Reparto');
  if (input.jobProfileId && !profile) throw notFound('Profilo professionale');
  if (input.employeeId && !employee) throw notFound('Dipendente');
  if (input.templateId && !template) throw notFound('Turno');
}

type CommunicationScope = {
  canManage: boolean;
  departmentId?: string;
};

type CommunicationSummary = {
  id: string;
  reference: string;
  title: string;
  content: string;
  kind: CommunicationKind;
  priority: Priority;
  status: CommunicationStatus;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
  senderDepartment: { id: string; code: string; name: string };
  recipientDepartment: { id: string; code: string; name: string };
  author: { id: string; email: string; firstName: string; lastName: string; role: UserRole };
  _count: { messages: number };
};

type CommunicationThreadMessage = {
  id: string;
  content: string;
  createdAt: Date;
  author: { id: string; email: string; firstName: string; lastName: string; role: UserRole };
};

function userDisplayName(user: { firstName: string; lastName: string }) {
  return `${user.firstName} ${user.lastName}`.trim();
}

function serializeCommunicationMessage(message: CommunicationThreadMessage) {
  const createdBy = userDisplayName(message.author);
  return {
    id: message.id,
    message: message.content,
    content: message.content,
    createdAt: message.createdAt,
    createdBy,
    author: { ...message.author, name: createdBy },
  };
}

function serializeCommunication(communication: CommunicationSummary) {
  const createdBy = userDisplayName(communication.author);
  return {
    id: communication.id,
    reference: communication.reference,
    title: communication.title,
    // `message` is retained for the portal; `content` is available to API clients.
    message: communication.content,
    content: communication.content,
    kind: communication.kind,
    priority: communication.priority,
    status: communication.status,
    createdAt: communication.createdAt,
    updatedAt: communication.updatedAt,
    closedAt: communication.closedAt,
    fromDepartment: communication.senderDepartment.name,
    toDepartment: communication.recipientDepartment.name,
    senderDepartment: communication.senderDepartment,
    recipientDepartment: communication.recipientDepartment,
    createdBy,
    author: { ...communication.author, name: createdBy },
    threadMessageCount: communication._count.messages,
  };
}

function createCommunicationReference() {
  const timestamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  return `COM-${timestamp}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

async function getCommunicationScope(auth: AuthUser): Promise<CommunicationScope> {
  if (communicationManagers.includes(auth.role)) return { canManage: true };

  const employee = await prisma.employee.findUnique({
    where: { userId: auth.id },
    select: { departmentId: true },
  });
  if (!employee) {
    throw new ApiError(
      403,
      'Per usare il centro comunicazioni l’account deve essere associato a un reparto',
      'COMMUNICATION_DEPARTMENT_REQUIRED',
    );
  }
  return { canManage: false, departmentId: employee.departmentId };
}

function communicationScopeWhere(
  scope: CommunicationScope,
  filters: Prisma.DepartmentCommunicationWhereInput = {},
): Prisma.DepartmentCommunicationWhereInput {
  if (scope.canManage) return filters;
  return {
    AND: [
      filters,
      {
        OR: [
          { senderDepartmentId: scope.departmentId! },
          { recipientDepartmentId: scope.departmentId! },
        ],
      },
    ],
  };
}

app.use(requestContext);
app.use(cors({
  origin(origin, callback) {
    if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
    return callback(new ApiError(403, 'Origine non autorizzata', 'CORS_ORIGIN_DENIED'));
  },
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-ID'],
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset', 'X-Request-ID'],
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  maxAge: 86_400,
  optionsSuccessStatus: 204,
}));
app.use(express.json({ limit: '100kb', strict: true }));

app.get('/health', (_request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  response.json({
    status: 'ok',
    service: config.serviceName,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

app.get('/ready', asyncRoute(async (_request, response) => {
  try {
    await verifyDatabaseConnection();
    response.setHeader('Cache-Control', 'no-store');
    response.json({
      status: 'ready',
      service: config.serviceName,
      checks: { database: 'ok' },
      timestamp: new Date().toISOString(),
    });
  } catch {
    throw new ApiError(503, 'Il servizio dati non è momentaneamente disponibile', 'DATABASE_UNAVAILABLE');
  }
}));

const loginRateLimit = rateLimit({ key: 'login', maxRequests: 10, windowMs: 15 * 60_000 });
const apiRateLimit = rateLimit({ key: 'api', maxRequests: 300, windowMs: 15 * 60_000 });

app.post('/api/auth/login', loginRateLimit, asyncRoute(async (request, response) => {
  const input = z.object({
    email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
    password: z.string().min(1).max(128),
  }).parse(request.body);

  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const passwordMatches = user ? await bcrypt.compare(input.password, user.passwordHash) : false;

  if (!user || !user.active || !passwordMatches) {
    throw new ApiError(401, 'Credenziali non valide', 'INVALID_CREDENTIALS');
  }

  const authUser: AuthUser = { id: user.id, email: user.email, role: user.role };
  response.json({
    token: signToken(authUser),
    user: { id: user.id, email: user.email, name: `${user.firstName} ${user.lastName}`, role: user.role },
  });
}));

app.use('/api', noStore, apiRateLimit, requireAuth);

app.get('/api/dashboard', asyncRoute(async (_request, response) => {
  const today = utcDate();
  const [employees, present, openReceipts, stockRows, arrivals] = await Promise.all([
    prisma.employee.count(),
    prisma.attendanceDay.count({ where: { date: today, status: AttendanceStatus.PRESENT } }),
    prisma.goodsReceipt.count({ where: { status: { in: [ReceiptStatus.ARRIVED, ReceiptStatus.CHECKING] } } }),
    prisma.inventoryStock.findMany({ include: { item: { select: { minStock: true } } }, take: 1000 }),
    prisma.goodsReceipt.findMany({
      where: { status: { in: [ReceiptStatus.ARRIVED, ReceiptStatus.CHECKING] } },
      include: { supplier: true, lines: { include: { item: true } } },
      orderBy: { expectedAt: 'asc' },
      take: 6,
    }),
  ]);

  response.json({
    kpis: {
      employees,
      present,
      openReceipts,
      lowStock: stockRows.filter((stock) => Number(stock.quantity) < Number(stock.item.minStock)).length,
    },
    arrivals,
  });
}));

app.get('/api/employees', allow(...workforceManagers), asyncRoute(async (_request, response) => {
  const employees = await prisma.employee.findMany({
    include: employeeInclude,
    orderBy: { code: 'asc' },
  });
  response.json(employees);
}));

app.post('/api/employees', allow(UserRole.ADMIN, UserRole.HR), asyncRoute(async (request, response) => {
  const { temporaryPassword, ...input } = createEmployeeSchema.parse(request.body);

  if (request.auth?.role !== UserRole.ADMIN && input.role === UserRole.ADMIN) {
    throw new ApiError(403, 'Solo un amministratore può creare un altro amministratore', 'FORBIDDEN');
  }

  await assertReferenceData({ departmentId: input.departmentId, jobProfileId: input.jobProfileId });
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);

  try {
    const employee = await prisma.employee.create({
      data: {
        code: input.code,
        hiredAt: utcDate(input.hiredAt),
        department: { connect: { id: input.departmentId } },
        ...(input.jobProfileId ? { jobProfile: { connect: { id: input.jobProfileId } } } : {}),
        user: {
          create: {
            email: input.email,
            firstName: input.firstName,
            lastName: input.lastName,
            role: input.role,
            passwordHash,
          },
        },
      },
      include: employeeInclude,
    });

    response.status(201).json(employee);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ApiError(409, 'Il codice collaboratore o l’indirizzo e-mail è già in uso', 'EMPLOYEE_ALREADY_EXISTS');
    }
    throw error;
  }
}));

app.get('/api/attendance', allow(...workforceManagers), asyncRoute(async (request, response) => {
  const date = parseDate(request.query.date ?? new Date().toISOString().slice(0, 10));
  const [employees, attendance] = await Promise.all([
    prisma.employee.findMany({
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, role: true, active: true } },
        department: true,
      },
      orderBy: { code: 'asc' },
    }),
    prisma.attendanceDay.findMany({ where: { date } }),
  ]);
  const byEmployee = new Map(attendance.map((row) => [row.employeeId, row]));
  response.json(employees.map((employee) => ({ ...employee, attendance: byEmployee.get(employee.id) ?? null })));
}));

app.post('/api/attendance/clock', allow(...workforceManagers), asyncRoute(async (request, response) => {
  const input = z.object({
    employeeId: resourceIdSchema,
    type: z.enum(['IN', 'OUT']),
    note: optionalText(500),
  }).parse(request.body);

  await assertReferenceData({ employeeId: input.employeeId });
  const event = await prisma.$transaction(async (transaction) => {
    const created = await transaction.clockEvent.create({
      data: { employeeId: input.employeeId, type: input.type, note: input.note, source: 'PORTAL' },
    });
    const date = utcDate(created.occurredAt.toISOString().slice(0, 10));
    let workedMinutes: number | undefined;

    if (input.type === 'OUT') {
      const latestClockIn = await transaction.clockEvent.findFirst({
        where: { employeeId: input.employeeId, type: 'IN', occurredAt: { gte: date, lt: created.occurredAt } },
        orderBy: { occurredAt: 'desc' },
      });
      if (latestClockIn) {
        workedMinutes = Math.max(0, Math.round((created.occurredAt.getTime() - latestClockIn.occurredAt.getTime()) / 60_000));
      }
    }

    await transaction.attendanceDay.upsert({
      where: { employeeId_date: { employeeId: input.employeeId, date } },
      update: { status: AttendanceStatus.PRESENT, ...(workedMinutes !== undefined ? { workedMinutes } : {}) },
      create: { employeeId: input.employeeId, date, status: AttendanceStatus.PRESENT, workedMinutes: workedMinutes ?? 0 },
    });
    return created;
  });
  response.status(201).json(event);
}));

app.get('/api/shifts', allow(...workforceManagers), asyncRoute(async (request, response) => {
  const from = parseDate(request.query.from ?? new Date().toISOString().slice(0, 10));
  const to = parseDate(request.query.to ?? new Date(Date.now() + 6 * 86_400_000).toISOString().slice(0, 10));
  assertDateRange(from, to);
  const shifts = await prisma.shiftAssignment.findMany({
    where: { date: { gte: from, lte: to } },
    include: {
      employee: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true, role: true } },
          department: true,
          jobProfile: true,
        },
      },
      template: true,
    },
    orderBy: { date: 'asc' },
  });
  response.json(shifts);
}));

app.post('/api/shifts', allow(...workforceManagers), asyncRoute(async (request, response) => {
  const input = z.object({
    employeeId: resourceIdSchema,
    templateId: resourceIdSchema,
    date: isoDateSchema,
    status: z.nativeEnum(ShiftStatus).default(ShiftStatus.DRAFT),
  }).parse(request.body);
  const date = utcDate(input.date);
  await assertReferenceData({ employeeId: input.employeeId, templateId: input.templateId });
  const assignment = await prisma.shiftAssignment.upsert({
    where: { employeeId_date: { employeeId: input.employeeId, date } },
    update: { templateId: input.templateId, status: input.status },
    create: { employeeId: input.employeeId, templateId: input.templateId, date, status: input.status },
  });
  response.status(201).json(assignment);
}));

app.get('/api/shift-templates', allow(...workforceManagers), asyncRoute(async (_request, response) => {
  response.json(await prisma.shiftTemplate.findMany({ orderBy: { code: 'asc' } }));
}));

app.get('/api/tasks', asyncRoute(async (_request, response) => {
  const tasks = await prisma.workTask.findMany({
    include: {
      employee: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
      jobProfile: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  response.json(tasks);
}));

app.post('/api/tasks', allow(...workforceManagers), asyncRoute(async (request, response) => {
  const input = z.object({
    title: z.string().trim().min(3).max(180),
    description: optionalText(5_000),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
    employeeId: resourceIdSchema.optional(),
    jobProfileId: resourceIdSchema.optional(),
    dueAt: dateTimeSchema.optional(),
  }).refine((value) => value.employeeId || value.jobProfileId, {
    message: 'Assegna la mansione a un dipendente o a un profilo professionale',
    path: ['employeeId'],
  }).parse(request.body);
  await assertReferenceData({ employeeId: input.employeeId, jobProfileId: input.jobProfileId });
  const task = await prisma.workTask.create({
    data: { ...input, dueAt: input.dueAt ? new Date(input.dueAt) : undefined },
  });
  response.status(201).json(task);
}));

app.patch('/api/tasks/:id/complete', allow(...logisticsOperators, UserRole.HR), asyncRoute(async (request, response) => {
  const id = parseId(request.params.id);
  const task = await prisma.workTask.findUnique({ where: { id }, select: { id: true, employeeId: true, completedAt: true } });
  if (!task) throw notFound('Mansione');
  if (task.completedAt) throw new ApiError(409, 'La mansione è già completata', 'TASK_ALREADY_COMPLETED');

  if (!workforceManagers.includes(request.auth!.role)) {
    const employee = await prisma.employee.findUnique({ where: { userId: request.auth!.id }, select: { id: true } });
    if (!employee || task.employeeId !== employee.id) {
      throw new ApiError(403, 'Puoi completare solo le mansioni assegnate a te', 'FORBIDDEN');
    }
  }
  response.json(await prisma.workTask.update({ where: { id }, data: { completedAt: new Date() } }));
}));

// Centro comunicazioni interno: nessun endpoint invia e-mail o contatta servizi esterni.
app.get('/api/communications', allow(...allRoles), asyncRoute(async (request, response) => {
  const query = listCommunicationsQuerySchema.parse(request.query);
  const scope = await getCommunicationScope(request.auth!);

  if (query.departmentId && !scope.canManage && query.departmentId !== scope.departmentId) {
    throw new ApiError(403, 'Puoi consultare solo le comunicazioni del tuo reparto', 'FORBIDDEN');
  }

  const departmentFilter = query.departmentId
    ? {
        OR: [
          { senderDepartmentId: query.departmentId },
          { recipientDepartmentId: query.departmentId },
        ],
      }
    : {};
  const communications = await prisma.departmentCommunication.findMany({
    where: communicationScopeWhere(scope, {
      ...departmentFilter,
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.kind ? { kind: query.kind } : {}),
    }),
    include: communicationListInclude,
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    take: query.limit,
  });

  response.json(communications.map(serializeCommunication));
}));

app.get('/api/communications/:id', allow(...allRoles), asyncRoute(async (request, response) => {
  const id = parseId(request.params.id);
  const scope = await getCommunicationScope(request.auth!);
  const communication = await prisma.departmentCommunication.findFirst({
    where: communicationScopeWhere(scope, { id }),
    include: communicationDetailInclude,
  });
  if (!communication) throw notFound('Comunicazione');

  response.json({
    ...serializeCommunication(communication),
    messages: communication.messages.map(serializeCommunicationMessage),
  });
}));

app.post('/api/communications', allow(...allRoles), asyncRoute(async (request, response) => {
  const input = createCommunicationSchema.parse(request.body);
  const scope = await getCommunicationScope(request.auth!);

  if (!scope.canManage && input.senderDepartmentId && input.senderDepartmentId !== scope.departmentId) {
    throw new ApiError(403, 'Non puoi inviare comunicazioni a nome di un altro reparto', 'FORBIDDEN');
  }

  const senderDepartmentId = input.senderDepartmentId ?? scope.departmentId;
  if (!senderDepartmentId) {
    throw new ApiError(
      422,
      'Seleziona il reparto mittente',
      'SENDER_DEPARTMENT_REQUIRED',
    );
  }

  const [senderDepartment, recipientDepartment] = await Promise.all([
    prisma.department.findUnique({ where: { id: senderDepartmentId }, select: { id: true } }),
    prisma.department.findUnique({ where: { id: input.recipientDepartmentId }, select: { id: true } }),
  ]);
  if (!senderDepartment) throw notFound('Reparto mittente');
  if (!recipientDepartment) throw notFound('Reparto destinatario');

  const communication = await prisma.departmentCommunication.create({
    data: {
      reference: createCommunicationReference(),
      title: input.title,
      content: input.content,
      kind: input.kind,
      priority: input.priority,
      senderDepartmentId,
      recipientDepartmentId: input.recipientDepartmentId,
      authorId: request.auth!.id,
    },
    include: communicationListInclude,
  });

  response.status(201).json(serializeCommunication(communication));
}));

app.post('/api/communications/:id/messages', allow(...allRoles), asyncRoute(async (request, response) => {
  const id = parseId(request.params.id);
  const input = createCommunicationMessageSchema.parse(request.body);
  const scope = await getCommunicationScope(request.auth!);
  const communication = await prisma.departmentCommunication.findFirst({
    where: communicationScopeWhere(scope, { id }),
    select: { id: true, status: true },
  });
  if (!communication) throw notFound('Comunicazione');
  if (communication.status === CommunicationStatus.CLOSED) {
    throw new ApiError(409, 'La comunicazione è chiusa e non accetta nuovi messaggi', 'COMMUNICATION_CLOSED');
  }

  const message = await prisma.$transaction(async (transaction) => {
    const created = await transaction.communicationMessage.create({
      data: { communicationId: communication.id, authorId: request.auth!.id, content: input.content },
      include: { author: { select: communicationAuthorSelect } },
    });
    // Una risposta deve far risalire il thread in cima alla lista.
    await transaction.departmentCommunication.update({
      where: { id: communication.id },
      data: { updatedAt: new Date() },
    });
    return created;
  });

  response.status(201).json(serializeCommunicationMessage(message));
}));

app.patch('/api/communications/:id/status', allow(...allRoles), asyncRoute(async (request, response) => {
  const id = parseId(request.params.id);
  const input = updateCommunicationStatusSchema.parse(request.body);
  const scope = await getCommunicationScope(request.auth!);
  const communication = await prisma.departmentCommunication.findFirst({
    where: communicationScopeWhere(scope, { id }),
    select: { id: true, status: true },
  });
  if (!communication) throw notFound('Comunicazione');

  if (!communicationTransitions[communication.status].includes(input.status)) {
    throw new ApiError(
      409,
      `Transizione da ${communication.status} a ${input.status} non consentita`,
      'INVALID_COMMUNICATION_TRANSITION',
    );
  }

  const updated = await prisma.departmentCommunication.update({
    where: { id: communication.id },
    data: {
      status: input.status,
      ...(input.status === CommunicationStatus.CLOSED ? { closedAt: new Date() } : { closedAt: null }),
    },
    include: communicationListInclude,
  });
  response.json(serializeCommunication(updated));
}));

app.get('/api/receipts', allow(...allRoles), asyncRoute(async (_request, response) => {
  const receipts = await prisma.goodsReceipt.findMany({
    include: { supplier: true, warehouse: true, lines: { include: { item: true } } },
    orderBy: { createdAt: 'desc' },
  });
  response.json(receipts);
}));

app.post('/api/receipts', allow(...logisticsOperators), asyncRoute(async (request, response) => {
  const input = z.object({
    number: z.string().trim().min(3).max(64).transform((value) => value.toUpperCase()),
    supplierId: resourceIdSchema,
    warehouseId: resourceIdSchema,
    expectedAt: dateTimeSchema.optional(),
    carrier: optionalText(120),
    vehiclePlate: optionalText(32),
    purchaseOrder: optionalText(64),
    notes: optionalText(5_000),
    lines: z.array(z.object({
      itemId: resourceIdSchema,
      expectedQty: z.coerce.number().finite().positive().max(1_000_000),
      locationId: resourceIdSchema.optional(),
    })).min(1).max(500),
  }).parse(request.body);

  const duplicateItems = new Set<string>();
  for (const line of input.lines) {
    if (duplicateItems.has(line.itemId)) throw new ApiError(422, 'Un articolo può comparire una sola volta nel ricevimento', 'DUPLICATE_RECEIPT_LINE');
    duplicateItems.add(line.itemId);
  }

  const [supplier, warehouse, items, locations] = await Promise.all([
    prisma.supplier.findUnique({ where: { id: input.supplierId }, select: { id: true } }),
    prisma.warehouse.findUnique({ where: { id: input.warehouseId }, select: { id: true } }),
    prisma.item.findMany({ where: { id: { in: input.lines.map((line) => line.itemId) } }, select: { id: true } }),
    prisma.stockLocation.findMany({ where: { id: { in: input.lines.flatMap((line) => line.locationId ? [line.locationId] : []) } }, select: { id: true, warehouseId: true } }),
  ]);
  if (!supplier) throw notFound('Fornitore');
  if (!warehouse) throw notFound('Magazzino');
  if (items.length !== duplicateItems.size) throw notFound('Articolo');
  if (locations.length !== input.lines.filter((line) => line.locationId).length || locations.some((location) => location.warehouseId !== input.warehouseId)) {
    throw new ApiError(422, 'La posizione di stoccaggio non appartiene al magazzino selezionato', 'INVALID_STOCK_LOCATION');
  }

  const { lines, ...head } = input;
  const receipt = await prisma.goodsReceipt.create({
    data: {
      ...head,
      expectedAt: head.expectedAt ? new Date(head.expectedAt) : undefined,
      lines: { create: lines },
    },
    include: { supplier: true, warehouse: true, lines: { include: { item: true } } },
  });
  response.status(201).json(receipt);
}));

app.patch('/api/receipts/:id/status', allow(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.RECEIVING_OPERATOR), asyncRoute(async (request, response) => {
  const id = parseId(request.params.id);
  const input = z.object({ status: z.nativeEnum(ReceiptStatus) }).parse(request.body);
  const receipt = await prisma.goodsReceipt.findUnique({ where: { id }, select: { id: true, status: true, arrivedAt: true } });
  if (!receipt) throw notFound('Ricevimento');
  if (!receiptTransitions[receipt.status].includes(input.status)) {
    throw new ApiError(409, `Transizione da ${receipt.status} a ${input.status} non consentita`, 'INVALID_RECEIPT_TRANSITION');
  }
  const updated = await prisma.goodsReceipt.update({
    where: { id },
    data: { status: input.status, ...(input.status === ReceiptStatus.ARRIVED && !receipt.arrivedAt ? { arrivedAt: new Date() } : {}) },
  });
  response.json(updated);
}));

app.get('/api/master-data', allow(...allRoles), asyncRoute(async (_request, response) => {
  const [suppliers, warehouses, items, locations, departments, profiles] = await Promise.all([
    prisma.supplier.findMany({ orderBy: { code: 'asc' } }),
    prisma.warehouse.findMany({ orderBy: { code: 'asc' } }),
    prisma.item.findMany({ orderBy: { sku: 'asc' } }),
    prisma.stockLocation.findMany({ orderBy: { code: 'asc' } }),
    prisma.department.findMany({ orderBy: { name: 'asc' } }),
    prisma.jobProfile.findMany({ orderBy: { title: 'asc' } }),
  ]);
  response.json({ suppliers, warehouses, items, locations, departments, profiles });
}));

app.use('/api', (_request, _response, next) => next(new ApiError(404, 'Endpoint API non trovato', 'ENDPOINT_NOT_FOUND')));
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`${config.serviceName} pronta sulla porta ${config.port}`);
});
