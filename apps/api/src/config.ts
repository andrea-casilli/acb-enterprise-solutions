import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .refine((value) => value.startsWith('mysql://') || value.startsWith('mysqls://'), {
      message: 'DATABASE_URL must use the mysql protocol',
    }),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must contain at least 32 characters'),
  CORS_ORIGIN: z.string().optional(),
  TRUST_PROXY: z.string().optional(),
});

const parsed = environmentSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid API environment configuration', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid API environment configuration');
}

const env = parsed.data;
const configuredOrigins = env.CORS_ORIGIN?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean) ?? [];

if (env.NODE_ENV === 'production' && configuredOrigins.length === 0) {
  throw new Error('CORS_ORIGIN must be configured in production');
}

const localOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const trustProxy = env.TRUST_PROXY === 'true' || env.TRUST_PROXY === '1' ? 1 : false;

export const config = {
  environment: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',
  port: env.PORT,
  jwtSecret: env.JWT_SECRET,
  corsOrigins: configuredOrigins.length > 0 ? configuredOrigins : env.NODE_ENV === 'production' ? [] : localOrigins,
  trustProxy,
  serviceName: 'nexus-enterprise-solutions-api',
  tokenIssuer: 'nexus-enterprise-solutions',
  tokenAudience: 'nexus-enterprise-portal',
} as const;
