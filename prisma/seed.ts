import {
  CommunicationKind,
  CommunicationStatus,
  PrismaClient,
  Priority,
  ReceiptStatus,
  ShiftStatus,
  UserRole,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function main() {
  const initialAdminPassword = process.env.INITIAL_ADMIN_PASSWORD;
  if (process.env.NODE_ENV === 'production' && !initialAdminPassword) {
    throw new Error('INITIAL_ADMIN_PASSWORD is required when seeding production data');
  }
  if (initialAdminPassword && initialAdminPassword.length < 12) {
    throw new Error('INITIAL_ADMIN_PASSWORD must contain at least 12 characters');
  }
  if (!initialAdminPassword) {
    console.warn('Using the local demo password. Set INITIAL_ADMIN_PASSWORD before any non-demo deployment.');
  }
  const adminPassword = await bcrypt.hash(initialAdminPassword || 'ChangeMe123!', 12);
  // I codici restano stabili: il seed non sovrascrive anagrafiche personalizzate.
  const departments = [
    { code: 'ACQ', name: 'Acquisti e Procurement' },
    { code: 'AFC', name: 'Amministrazione, Finanza e Controllo' },
    { code: 'COM', name: 'Commerciale e Vendite' },
    { code: 'CSC', name: 'Customer Service' },
    { code: 'DIR', name: 'Direzione Generale' },
    { code: 'HSE', name: 'Salute, Sicurezza e Ambiente' },
    { code: 'HR', name: 'Risorse Umane' },
    { code: 'IT', name: 'Sistemi Informativi e IT' },
    { code: 'LEG', name: 'Legale, Compliance e Affari Societari' },
    { code: 'LOG', name: 'Logistica e Magazzino' },
    { code: 'MAN', name: 'Manutenzione e Servizi Tecnici' },
    { code: 'MKT', name: 'Marketing e Comunicazione' },
    { code: 'PROD', name: 'Produzione e Operazioni' },
    { code: 'QUA', name: 'Qualità e Miglioramento Continuo' },
    { code: 'RND', name: 'Ricerca e Sviluppo' },
  ];
  const jobProfiles = [
    { code: 'DIR-GEN', title: 'Direttore generale', description: 'Coordina strategia aziendale, funzioni operative e raggiungimento degli obiettivi.' },
    { code: 'DIR-FUN', title: 'Direttivo / Responsabile di funzione', description: 'Guida una funzione aziendale e ne definisce obiettivi, budget e piani di miglioramento.' },
    { code: 'HR-MGR', title: 'Responsabile risorse umane', description: 'Coordina politiche del personale, sviluppo organizzativo e processi HR.' },
    { code: 'HR-EMP', title: 'Impiegato risorse umane', description: 'Gestisce anagrafiche, selezione, formazione, presenze e supporto ai processi HR.' },
    { code: 'IT-MGR', title: 'Responsabile sistemi informativi', description: 'Governa sistemi IT, fornitori tecnologici e sicurezza informatica.' },
    { code: 'IT-EMP', title: 'Impiegato IT / Help desk', description: 'Supporta utenti, dispositivi e applicativi aziendali.' },
    { code: 'AFC-MGR', title: 'Responsabile amministrazione, finanza e controllo', description: 'Coordina amministrazione, pianificazione finanziaria, controllo di gestione e bilancio.' },
    { code: 'AFC-EMP', title: 'Impiegato amministrativo contabile', description: 'Supporta contabilità generale, ciclo attivo/passivo, riconciliazioni e reporting.' },
    { code: 'COM-MGR', title: 'Responsabile commerciale', description: 'Coordina vendite, rete commerciale e risultati di mercato.' },
    { code: 'COM-EMP', title: 'Impiegato commerciale', description: 'Gestisce offerte, ordini clienti e supporto alla rete vendita.' },
    { code: 'ACQ-EMP', title: 'Impiegato acquisti', description: 'Gestisce richieste di acquisto, ordini, fornitori e condizioni di fornitura.' },
    { code: 'CSC-EMP', title: 'Addetto customer service', description: 'Gestisce richieste clienti, assistenza post-vendita, reclami e avanzamento ordini.' },
    { code: 'MKT-SPC', title: 'Specialista marketing e comunicazione', description: 'Gestisce campagne, materiali commerciali e analisi di mercato.' },
    { code: 'HSE-SPC', title: 'Specialista HSE', description: 'Presidia salute, sicurezza, ambiente e formazione obbligatoria.' },
    { code: 'LEG-SPC', title: 'Specialista legale e compliance', description: 'Supporta contratti, privacy, adempimenti societari e conformità interna.' },
    { code: 'PROD-MGR', title: 'Responsabile produzione', description: 'Pianifica capacità produttiva e coordina i reparti operativi.' },
    { code: 'PROD-TEAM', title: 'Capo reparto produzione', description: 'Coordina il team di reparto e presidia avanzamento, qualità e sicurezza.' },
    { code: 'PROD-OP', title: 'Operaio di produzione', description: 'Svolge lavorazioni, assemblaggio, controllo base e attività operative di linea.' },
    { code: 'LOG-MGR', title: 'Responsabile logistica', description: 'Coordina magazzini, flussi inbound/outbound e livelli di servizio.' },
    { code: 'LOG-OP', title: 'Operaio logistico / Magazziniere', description: 'Esegue stoccaggio, picking, movimentazione e inventari di magazzino.' },
    { code: 'REC-OP', title: 'Operatore accettazione merci', description: 'Controlla documenti, quantità e qualità delle merci in ingresso e registra le difformità.' },
    { code: 'QUA-TECH', title: 'Tecnico qualità', description: 'Esegue controlli qualità, gestisce non conformità e supporta il miglioramento continuo.' },
    { code: 'MAN-TECH', title: 'Tecnico manutentore', description: 'Esegue manutenzione preventiva e correttiva di impianti e attrezzature.' },
    { code: 'RND-ENG', title: 'Tecnico ricerca e sviluppo', description: 'Supporta sviluppo prodotto/processo, prove tecniche e documentazione.' },
  ];
  await Promise.all(departments.map((entry) => prisma.department.upsert({ where: { code: entry.code }, update: {}, create: entry })));
  await Promise.all(jobProfiles.map((entry) => prisma.jobProfile.upsert({ where: { code: entry.code }, update: {}, create: entry })));
  const department = await prisma.department.findUniqueOrThrow({ where: { code: 'LOG' } });
  const profile = await prisma.jobProfile.findUniqueOrThrow({ where: { code: 'REC-OP' } });
  const admin = await prisma.user.upsert({ where:{email:'admin@nexus.local'}, update:{}, create:{email:'admin@nexus.local',passwordHash:adminPassword,firstName:'Admin',lastName:'Nexus',role:UserRole.ADMIN} });
  const employee = await prisma.employee.upsert({ where:{userId:admin.id}, update:{}, create:{userId:admin.id,code:'EMP-001',departmentId:department.id,jobProfileId:profile.id,hiredAt:new Date()} });
  const morning = await prisma.shiftTemplate.upsert({ where:{code:'MORNING'},update:{},create:{code:'MORNING',name:'Mattino',startsAt:'06:00',endsAt:'14:00',breakMinutes:30,color:'#0284c7'} });
  const warehouse = await prisma.warehouse.upsert({where:{code:'CENTRALE'},update:{},create:{code:'CENTRALE',name:'Magazzino Centrale'}});
  const location = await prisma.stockLocation.upsert({where:{warehouseId_code:{warehouseId:warehouse.id,code:'RICEVIMENTO'}},update:{},create:{warehouseId:warehouse.id,code:'RICEVIMENTO',description:'Baia accettazione'}});
  const supplier = await prisma.supplier.upsert({where:{code:'SUP-001'},update:{},create:{code:'SUP-001',name:'Fornitore Demo S.r.l.'}});
  const item = await prisma.item.upsert({where:{sku:'SKU-1001'},update:{},create:{sku:'SKU-1001',barcode:'800000000001',name:'Pallet film estensibile',unit:'PZ',minStock:20}});
  const receipt = await prisma.goodsReceipt.upsert({where:{number:'GR-2026-0001'},update:{},create:{number:'GR-2026-0001',supplierId:supplier.id,warehouseId:warehouse.id,expectedAt:new Date(),status:ReceiptStatus.ARRIVED,carrier:'Trasporti Italia',vehiclePlate:'AB123CD',purchaseOrder:'PO-2026-045'}});
  const line = await prisma.receiptLine.findFirst({where:{receiptId:receipt.id,itemId:item.id}});
  if(!line) await prisma.receiptLine.create({data:{receiptId:receipt.id,itemId:item.id,expectedQty:100,locationId:location.id}});
  const itDepartment = await prisma.department.findUniqueOrThrow({ where: { code: 'IT' } });
  const hseDepartment = await prisma.department.findUniqueOrThrow({ where: { code: 'HSE' } });
  await prisma.departmentCommunication.upsert({
    where: { reference: 'COM-DEMO-LOG-IT-001' },
    update: {},
    create: {
      reference: 'COM-DEMO-LOG-IT-001',
      title: 'Verifica postazione accettazione merci',
      content: 'Richiesta verifica del terminale della baia di ricevimento prima del picco inbound di domani mattina.',
      kind: CommunicationKind.REQUEST,
      priority: Priority.HIGH,
      status: CommunicationStatus.IN_PROGRESS,
      senderDepartmentId: department.id,
      recipientDepartmentId: itDepartment.id,
      authorId: admin.id,
    },
  });
  await prisma.departmentCommunication.upsert({
    where: { reference: 'COM-DEMO-LOG-HSE-001' },
    update: {},
    create: {
      reference: 'COM-DEMO-LOG-HSE-001',
      title: 'Aggiornamento procedura DPI area ricevimento',
      content: 'Condividere la versione aggiornata della procedura DPI per l’area di accettazione merci.',
      kind: CommunicationKind.MESSAGE,
      priority: Priority.NORMAL,
      status: CommunicationStatus.OPEN,
      senderDepartmentId: department.id,
      recipientDepartmentId: hseDepartment.id,
      authorId: admin.id,
    },
  });
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  await prisma.shiftAssignment.upsert({where:{employeeId_date:{employeeId:employee.id,date:today}},update:{},create:{employeeId:employee.id,templateId:morning.id,date:today,status:ShiftStatus.PUBLISHED}});
}
main().finally(()=>prisma.$disconnect());
