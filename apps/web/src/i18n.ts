import { useCallback, useEffect, useState } from 'react';

export const supportedLanguages = ['it', 'en', 'es', 'de', 'fr', 'pl'] as const;
export type Language = typeof supportedLanguages[number];

const storageKey = 'nexus-language';

export const languageOptions: ReadonlyArray<{ value: Language; label: string }> = [
  { value: 'it', label: 'Italiano' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
  { value: 'pl', label: 'Polski' },
];

const intlLocales: Record<Language, string> = {
  it: 'it-IT', en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', pl: 'pl-PL',
};

function isLanguage(value: string | null): value is Language {
  return Boolean(value && (supportedLanguages as readonly string[]).includes(value));
}

function preferredLanguage(): Language {
  if (typeof window === 'undefined') return 'it';
  const stored = window.localStorage.getItem(storageKey);
  if (isLanguage(stored)) return stored;
  const browser = window.navigator.language?.slice(0, 2).toLowerCase();
  return isLanguage(browser) ? browser : 'it';
}

let activeLanguage: Language = preferredLanguage();

const italian = {
  'language.label': 'Lingua',
  'navigation.label': 'Navigazione',
  'navigation.dashboard': 'Panoramica',
  'navigation.attendance': 'Presenze',
  'navigation.shifts': 'Pianificazione turni',
  'navigation.tasks': 'Mansionario',
  'navigation.receiving': 'Accettazione merci',
  'navigation.communications': 'Comunicazioni',
  'login.environment': 'AMBIENTE DI SVILUPPO',
  'login.restricted': 'ACCESSO RISERVATO',
  'login.description': 'Accedi con le credenziali aziendali per gestire le operazioni autorizzate.',
  'login.corporateEmail': 'Email aziendale',
  'login.password': 'Password',
  'login.show': 'Mostra',
  'login.hide': 'Nascondi',
  'login.verifying': 'Verifica credenziali…',
  'login.signIn': 'Accedi al portale',
  'login.secureConnection': 'Connessione protetta',
  'login.internalUse': 'Uso interno autorizzato',
  'common.systemOperational': 'Sistema operativo',
  'common.loading': 'Caricamento dati…',
  'common.unableToLoad': 'Impossibile caricare i dati',
  'common.retry': 'Riprova',
  'common.noResults': 'Nessun risultato',
  'common.nothingToShow': 'Non ci sono elementi da mostrare in questa vista.',
  'common.refresh': 'Aggiorna',
  'common.cancel': 'Annulla',
  'common.save': 'Salva',
  'common.create': 'Crea',
  'common.confirm': 'Conferma',
  'common.close': 'Chiudi',
  'common.closeWindow': 'Chiudi finestra',
  'common.logout': 'Esci dal portale',
  'common.user': 'Utente',
  'common.notAvailable': 'Non disponibile',
  'common.notAssigned': 'Non assegnato',
  'common.notDetected': 'Non rilevato',
  'common.optional': 'opzionale',
  'common.errorFallback': 'Operazione non riuscita. Riprova tra qualche istante.',
  'common.messageClose': 'Chiudi messaggio',
  'dashboard.eyebrow': 'PANORAMICA OPERATIVA',
  'dashboard.greeting': 'Buongiorno{ name}',
  'dashboard.description': 'Visione sintetica delle attività prioritarie di oggi.',
  'dashboard.exportReport': 'Esporta report',
  'dashboard.refresh': 'Aggiorna cruscotto',
  'dashboard.indicators': 'Indicatori operativi',
  'dashboard.activePersonnel': 'Personale attivo',
  'dashboard.currentDirectory': 'Anagrafica corrente',
  'dashboard.presentToday': 'Presenti oggi',
  'dashboard.confirmedReadings': 'Rilevazioni confermate',
  'dashboard.arrivalsToManage': 'Arrivi da gestire',
  'dashboard.waitingWorkflow': 'In attesa di workflow',
  'dashboard.lowStock': 'Sottoscorte',
  'dashboard.minimumThreshold': 'Soglia minima superata',
  'dashboard.arrivalsAcceptance': 'Arrivi in accettazione',
  'dashboard.case': 'pratica',
  'dashboard.cases': 'pratiche',
  'dashboard.receipt': 'Ricevimento',
  'dashboard.supplier': 'Fornitore',
  'dashboard.carrier': 'Vettore',
  'dashboard.lines': 'Righe',
  'dashboard.status': 'Stato',
  'dashboard.noArrivals': 'Nessun arrivo da gestire',
  'dashboard.noArrivalsText': 'Le nuove consegne compariranno qui non appena registrate.',
  'dashboard.noPurchaseOrder': 'Senza ordine di acquisto',
  'dashboard.reportExported': 'Report degli arrivi esportato in formato CSV.',
  'attendance.eyebrow': 'OPERAZIONI HR',
  'attendance.title': 'Presenze e anagrafica',
  'attendance.description': 'Rilevazioni, struttura aziendale e inquadramento professionale dei collaboratori.',
  'attendance.addCollaborator': 'Aggiungi collaboratore',
  'attendance.dailyRegister': 'Registro giornaliero',
  'attendance.today': 'OGGI',
  'attendance.people': 'persone',
  'attendance.employee': 'Dipendente',
  'attendance.department': 'Reparto',
  'attendance.workedHours': 'Ore lavorate',
  'attendance.action': 'Azione',
  'attendance.noRecords': 'Nessuna presenza registrata',
  'attendance.noRecordsText': 'Le rilevazioni della giornata compariranno in questo registro.',
  'attendance.clockIn': 'Registra ingresso',
  'attendance.clockOut': 'Registra uscita',
  'attendance.clockedIn': 'Ingresso di {name} registrato.',
  'attendance.clockedOut': 'Uscita di {name} registrata.',
  'attendance.departmentUnassigned': 'Reparto da assegnare',
  'attendance.profileUnassigned': 'Qualifica da assegnare',
  'attendance.employeeUnavailable': 'Collaboratore non disponibile',
  'attendance.employeeFallback': 'Collaboratore',
  'shifts.eyebrow': 'PIANIFICAZIONE FORZA LAVORO',
  'shifts.title': 'Pianificazione turni',
  'shifts.description': 'Copertura dei reparti, degli uffici e delle qualifiche professionali nei prossimi sette giorni.',
  'shifts.assign': 'Assegna turno',
  'shifts.refresh': 'Aggiorna turni',
  'shifts.planned': 'Turni programmati',
  'shifts.assignments': 'assegnazioni',
  'shifts.assigned': 'Turno assegnato e pubblicato nel piano.',
  'tasks.eyebrow': 'PROCEDURE OPERATIVE STANDARD',
  'tasks.title': 'Mansionario',
  'tasks.description': 'Responsabilità operative, priorità e completamento delle attività assegnate.',
  'tasks.newTask': 'Nuova mansione',
  'tasks.refresh': 'Aggiorna mansioni',
  'tasks.operationalTasks': 'Attività operative',
  'tasks.open': 'aperte',
  'tasks.completed': 'Completata',
  'tasks.complete': 'Completa',
  'tasks.completedMessage': 'Mansione completata e registrata.',
  'receiving.eyebrow': 'RICEVIMENTO MAGAZZINO',
  'receiving.title': 'Accettazione merci',
  'receiving.description': 'Controllo documentale e avanzamento del workflow di ricevimento.',
  'receiving.arrivalNotice': 'Preavviso arrivo',
  'receiving.refresh': 'Aggiorna ricevimento merci',
  'receiving.receipts': 'Ricevimenti',
  'receiving.open': 'aperti',
  'receiving.document': 'Documento',
  'receiving.expectedArrival': 'Arrivo previsto',
  'receiving.bayCarrier': 'Baia / vettore',
  'receiving.workflow': 'Workflow',
  'receiving.noReceipts': 'Nessun ricevimento presente',
  'receiving.noReceiptsText': 'Registra un preavviso per iniziare a tracciare una nuova consegna.',
  'receiving.carrierUnassigned': 'Vettore non assegnato',
  'receiving.statusUpdated': '{number}: stato aggiornato a “{status}”.',
  'receiving.noticeRegistered': 'Preavviso registrato nel workflow di ricevimento.',
  'communications.eyebrow': 'COMUNICAZIONI AZIENDALI',
  'communications.title': 'Messaggi e richieste',
  'communications.description': 'Messaggi interni e richieste tra reparti, tracciati in un unico spazio.',
  'communications.compose': 'Nuovo messaggio',
  'communications.inbox': 'Posta in arrivo',
  'communications.requests': 'Richieste tra reparti',
  'communications.markRead': 'Segna come letto',
  'role.ADMIN': 'Amministratore',
  'role.HR': 'Risorse umane',
  'role.SUPERVISOR': 'Supervisore',
  'role.WAREHOUSE_OPERATOR': 'Operatore di magazzino',
  'role.RECEIVING_OPERATOR': 'Operatore di ricevimento',
  'role.VIEWER': 'Consultazione',
  'status.DRAFT': 'Bozza',
  'status.PUBLISHED': 'Pubblicato',
  'status.COMPLETED': 'Completato',
  'status.PRESENT': 'Presente',
  'status.ABSENT': 'Assente',
  'status.REMOTE': 'Da remoto',
  'status.LEAVE': 'In ferie',
  'status.SICKNESS': 'Malattia',
  'status.ARRIVED': 'Arrivato',
  'status.CHECKING': 'In controllo',
  'status.ACCEPTED': 'Accettato',
  'status.REJECTED': 'Respinto',
  'status.CLOSED': 'Chiuso',
  'status.NORMAL': 'Normale',
  'status.LOW': 'Bassa',
  'status.HIGH': 'Alta',
  'status.URGENT': 'Urgente',
  'status.ACTIVE': 'Attivo',
  'status.INACTIVE': 'Non attivo',
} as const;

export type TranslationKey = keyof typeof italian;
type TranslationSet = Record<TranslationKey, string>;

const translations: Record<Language, TranslationSet> = {
  it: italian,
  en: {
    'language.label': 'Language', 'navigation.label': 'Navigation', 'navigation.dashboard': 'Overview', 'navigation.attendance': 'Attendance', 'navigation.shifts': 'Shift planning', 'navigation.tasks': 'Job tasks', 'navigation.receiving': 'Goods receiving', 'navigation.communications': 'Communications',
    'login.environment': 'DEVELOPMENT ENVIRONMENT', 'login.restricted': 'RESTRICTED ACCESS', 'login.description': 'Sign in with your corporate credentials to manage authorised operations.', 'login.corporateEmail': 'Corporate email', 'login.password': 'Password', 'login.show': 'Show', 'login.hide': 'Hide', 'login.verifying': 'Verifying credentials…', 'login.signIn': 'Sign in to portal', 'login.secureConnection': 'Secure connection', 'login.internalUse': 'Authorised internal use',
    'common.systemOperational': 'System operational', 'common.loading': 'Loading data…', 'common.unableToLoad': 'Unable to load data', 'common.retry': 'Try again', 'common.noResults': 'No results', 'common.nothingToShow': 'There are no items to show in this view.', 'common.refresh': 'Refresh', 'common.cancel': 'Cancel', 'common.save': 'Save', 'common.create': 'Create', 'common.confirm': 'Confirm', 'common.close': 'Close', 'common.closeWindow': 'Close window', 'common.logout': 'Sign out of portal', 'common.user': 'User', 'common.notAvailable': 'Not available', 'common.notAssigned': 'Unassigned', 'common.notDetected': 'Not recorded', 'common.optional': 'optional', 'common.errorFallback': 'The operation could not be completed. Please try again shortly.', 'common.messageClose': 'Close message',
    'dashboard.eyebrow': 'OPERATIONS OVERVIEW', 'dashboard.greeting': 'Good morning{ name}', 'dashboard.description': 'A concise view of today’s priority activities.', 'dashboard.exportReport': 'Export report', 'dashboard.refresh': 'Refresh dashboard', 'dashboard.indicators': 'Operational indicators', 'dashboard.activePersonnel': 'Active personnel', 'dashboard.currentDirectory': 'Current directory', 'dashboard.presentToday': 'Present today', 'dashboard.confirmedReadings': 'Confirmed records', 'dashboard.arrivalsToManage': 'Arrivals to manage', 'dashboard.waitingWorkflow': 'Awaiting workflow', 'dashboard.lowStock': 'Low stock', 'dashboard.minimumThreshold': 'Minimum threshold exceeded', 'dashboard.arrivalsAcceptance': 'Incoming arrivals', 'dashboard.case': 'case', 'dashboard.cases': 'cases', 'dashboard.receipt': 'Receipt', 'dashboard.supplier': 'Supplier', 'dashboard.carrier': 'Carrier', 'dashboard.lines': 'Lines', 'dashboard.status': 'Status', 'dashboard.noArrivals': 'No arrivals to manage', 'dashboard.noArrivalsText': 'New deliveries will appear here once they are registered.', 'dashboard.noPurchaseOrder': 'No purchase order', 'dashboard.reportExported': 'Arrival report exported as CSV.',
    'attendance.eyebrow': 'HR OPERATIONS', 'attendance.title': 'Attendance and directory', 'attendance.description': 'Attendance records, organisational structure and employee job classifications.', 'attendance.addCollaborator': 'Add employee', 'attendance.dailyRegister': 'Daily register', 'attendance.today': 'TODAY', 'attendance.people': 'people', 'attendance.employee': 'Employee', 'attendance.department': 'Department', 'attendance.workedHours': 'Hours worked', 'attendance.action': 'Action', 'attendance.noRecords': 'No attendance recorded', 'attendance.noRecordsText': 'Today’s attendance records will appear in this register.', 'attendance.clockIn': 'Record check-in', 'attendance.clockOut': 'Record check-out', 'attendance.clockedIn': '{name} checked in.', 'attendance.clockedOut': '{name} checked out.', 'attendance.departmentUnassigned': 'Department to assign', 'attendance.profileUnassigned': 'Job profile to assign', 'attendance.employeeUnavailable': 'Employee unavailable', 'attendance.employeeFallback': 'Employee',
    'shifts.eyebrow': 'WORKFORCE PLANNING', 'shifts.title': 'Shift planning', 'shifts.description': 'Coverage for departments, offices and job profiles over the next seven days.', 'shifts.assign': 'Assign shift', 'shifts.refresh': 'Refresh shifts', 'shifts.planned': 'Scheduled shifts', 'shifts.assignments': 'assignments', 'shifts.assigned': 'Shift assigned and published in the plan.',
    'tasks.eyebrow': 'STANDARD OPERATING PROCEDURES', 'tasks.title': 'Job tasks', 'tasks.description': 'Operational responsibilities, priorities and completion of assigned tasks.', 'tasks.newTask': 'New task', 'tasks.refresh': 'Refresh tasks', 'tasks.operationalTasks': 'Operational tasks', 'tasks.open': 'open', 'tasks.completed': 'Completed', 'tasks.complete': 'Complete', 'tasks.completedMessage': 'Task completed and recorded.',
    'receiving.eyebrow': 'WAREHOUSE INBOUND', 'receiving.title': 'Goods receiving', 'receiving.description': 'Document checks and progress of the receiving workflow.', 'receiving.arrivalNotice': 'Arrival notice', 'receiving.refresh': 'Refresh goods receiving', 'receiving.receipts': 'Receipts', 'receiving.open': 'open', 'receiving.document': 'Document', 'receiving.expectedArrival': 'Expected arrival', 'receiving.bayCarrier': 'Bay / carrier', 'receiving.workflow': 'Workflow', 'receiving.noReceipts': 'No receipts found', 'receiving.noReceiptsText': 'Register an arrival notice to start tracking a new delivery.', 'receiving.carrierUnassigned': 'Carrier unassigned', 'receiving.statusUpdated': '{number}: status updated to “{status}”.', 'receiving.noticeRegistered': 'Arrival notice registered in the receiving workflow.',
    'communications.eyebrow': 'CORPORATE COMMUNICATIONS', 'communications.title': 'Messages and requests', 'communications.description': 'Internal messages and interdepartmental requests, tracked in one place.', 'communications.compose': 'New message', 'communications.inbox': 'Inbox', 'communications.requests': 'Interdepartmental requests', 'communications.markRead': 'Mark as read',
    'role.ADMIN': 'Administrator', 'role.HR': 'Human resources', 'role.SUPERVISOR': 'Supervisor', 'role.WAREHOUSE_OPERATOR': 'Warehouse operator', 'role.RECEIVING_OPERATOR': 'Receiving operator', 'role.VIEWER': 'View only',
    'status.DRAFT': 'Draft', 'status.PUBLISHED': 'Published', 'status.COMPLETED': 'Completed', 'status.PRESENT': 'Present', 'status.ABSENT': 'Absent', 'status.REMOTE': 'Remote', 'status.LEAVE': 'On leave', 'status.SICKNESS': 'Sick leave', 'status.ARRIVED': 'Arrived', 'status.CHECKING': 'Under review', 'status.ACCEPTED': 'Accepted', 'status.REJECTED': 'Rejected', 'status.CLOSED': 'Closed', 'status.NORMAL': 'Normal', 'status.LOW': 'Low', 'status.HIGH': 'High', 'status.URGENT': 'Urgent', 'status.ACTIVE': 'Active', 'status.INACTIVE': 'Inactive',
  },
  es: {
    'language.label': 'Idioma', 'navigation.label': 'Navegación', 'navigation.dashboard': 'Resumen', 'navigation.attendance': 'Asistencia', 'navigation.shifts': 'Planificación de turnos', 'navigation.tasks': 'Puestos y tareas', 'navigation.receiving': 'Recepción de mercancías', 'navigation.communications': 'Comunicaciones',
    'login.environment': 'ENTORNO DE DESARROLLO', 'login.restricted': 'ACCESO RESTRINGIDO', 'login.description': 'Accede con tus credenciales corporativas para gestionar las operaciones autorizadas.', 'login.corporateEmail': 'Correo corporativo', 'login.password': 'Contraseña', 'login.show': 'Mostrar', 'login.hide': 'Ocultar', 'login.verifying': 'Verificando credenciales…', 'login.signIn': 'Acceder al portal', 'login.secureConnection': 'Conexión segura', 'login.internalUse': 'Uso interno autorizado',
    'common.systemOperational': 'Sistema operativo', 'common.loading': 'Cargando datos…', 'common.unableToLoad': 'No se pueden cargar los datos', 'common.retry': 'Reintentar', 'common.noResults': 'Sin resultados', 'common.nothingToShow': 'No hay elementos que mostrar en esta vista.', 'common.refresh': 'Actualizar', 'common.cancel': 'Cancelar', 'common.save': 'Guardar', 'common.create': 'Crear', 'common.confirm': 'Confirmar', 'common.close': 'Cerrar', 'common.closeWindow': 'Cerrar ventana', 'common.logout': 'Salir del portal', 'common.user': 'Usuario', 'common.notAvailable': 'No disponible', 'common.notAssigned': 'Sin asignar', 'common.notDetected': 'No registrado', 'common.optional': 'opcional', 'common.errorFallback': 'No se ha podido completar la operación. Vuelve a intentarlo en unos instantes.', 'common.messageClose': 'Cerrar mensaje',
    'dashboard.eyebrow': 'RESUMEN OPERATIVO', 'dashboard.greeting': 'Buenos días{ name}', 'dashboard.description': 'Visión sintética de las actividades prioritarias de hoy.', 'dashboard.exportReport': 'Exportar informe', 'dashboard.refresh': 'Actualizar panel', 'dashboard.indicators': 'Indicadores operativos', 'dashboard.activePersonnel': 'Personal activo', 'dashboard.currentDirectory': 'Directorio actual', 'dashboard.presentToday': 'Presentes hoy', 'dashboard.confirmedReadings': 'Registros confirmados', 'dashboard.arrivalsToManage': 'Llegadas por gestionar', 'dashboard.waitingWorkflow': 'Pendientes de flujo', 'dashboard.lowStock': 'Stock bajo', 'dashboard.minimumThreshold': 'Umbral mínimo superado', 'dashboard.arrivalsAcceptance': 'Llegadas en recepción', 'dashboard.case': 'expediente', 'dashboard.cases': 'expedientes', 'dashboard.receipt': 'Recepción', 'dashboard.supplier': 'Proveedor', 'dashboard.carrier': 'Transportista', 'dashboard.lines': 'Líneas', 'dashboard.status': 'Estado', 'dashboard.noArrivals': 'No hay llegadas por gestionar', 'dashboard.noArrivalsText': 'Las nuevas entregas aparecerán aquí cuando se registren.', 'dashboard.noPurchaseOrder': 'Sin orden de compra', 'dashboard.reportExported': 'Informe de llegadas exportado en CSV.',
    'attendance.eyebrow': 'OPERACIONES DE RR. HH.', 'attendance.title': 'Asistencia y directorio', 'attendance.description': 'Registros de asistencia, estructura organizativa y clasificación profesional de los colaboradores.', 'attendance.addCollaborator': 'Añadir colaborador', 'attendance.dailyRegister': 'Registro diario', 'attendance.today': 'HOY', 'attendance.people': 'personas', 'attendance.employee': 'Empleado', 'attendance.department': 'Departamento', 'attendance.workedHours': 'Horas trabajadas', 'attendance.action': 'Acción', 'attendance.noRecords': 'No hay asistencias registradas', 'attendance.noRecordsText': 'Los registros de asistencia del día aparecerán en este panel.', 'attendance.clockIn': 'Registrar entrada', 'attendance.clockOut': 'Registrar salida', 'attendance.clockedIn': 'Entrada de {name} registrada.', 'attendance.clockedOut': 'Salida de {name} registrada.', 'attendance.departmentUnassigned': 'Departamento por asignar', 'attendance.profileUnassigned': 'Puesto por asignar', 'attendance.employeeUnavailable': 'Colaborador no disponible', 'attendance.employeeFallback': 'Colaborador',
    'shifts.eyebrow': 'PLANIFICACIÓN DE PERSONAL', 'shifts.title': 'Planificación de turnos', 'shifts.description': 'Cobertura de departamentos, oficinas y perfiles profesionales durante los próximos siete días.', 'shifts.assign': 'Asignar turno', 'shifts.refresh': 'Actualizar turnos', 'shifts.planned': 'Turnos programados', 'shifts.assignments': 'asignaciones', 'shifts.assigned': 'Turno asignado y publicado en el plan.',
    'tasks.eyebrow': 'PROCEDIMIENTOS OPERATIVOS ESTÁNDAR', 'tasks.title': 'Puestos y tareas', 'tasks.description': 'Responsabilidades operativas, prioridades y finalización de tareas asignadas.', 'tasks.newTask': 'Nueva tarea', 'tasks.refresh': 'Actualizar tareas', 'tasks.operationalTasks': 'Tareas operativas', 'tasks.open': 'abiertas', 'tasks.completed': 'Completada', 'tasks.complete': 'Completar', 'tasks.completedMessage': 'Tarea completada y registrada.',
    'receiving.eyebrow': 'ENTRADAS DE ALMACÉN', 'receiving.title': 'Recepción de mercancías', 'receiving.description': 'Control documental y avance del flujo de recepción.', 'receiving.arrivalNotice': 'Aviso de llegada', 'receiving.refresh': 'Actualizar recepción', 'receiving.receipts': 'Recepciones', 'receiving.open': 'abiertas', 'receiving.document': 'Documento', 'receiving.expectedArrival': 'Llegada prevista', 'receiving.bayCarrier': 'Muelle / transportista', 'receiving.workflow': 'Flujo', 'receiving.noReceipts': 'No hay recepciones', 'receiving.noReceiptsText': 'Registra un aviso de llegada para comenzar a seguir una nueva entrega.', 'receiving.carrierUnassigned': 'Transportista sin asignar', 'receiving.statusUpdated': '{number}: estado actualizado a “{status}”.', 'receiving.noticeRegistered': 'Aviso de llegada registrado en el flujo de recepción.',
    'communications.eyebrow': 'COMUNICACIONES CORPORATIVAS', 'communications.title': 'Mensajes y solicitudes', 'communications.description': 'Mensajes internos y solicitudes entre departamentos, en un único espacio.', 'communications.compose': 'Nuevo mensaje', 'communications.inbox': 'Bandeja de entrada', 'communications.requests': 'Solicitudes entre departamentos', 'communications.markRead': 'Marcar como leído',
    'role.ADMIN': 'Administrador', 'role.HR': 'Recursos humanos', 'role.SUPERVISOR': 'Supervisor', 'role.WAREHOUSE_OPERATOR': 'Operario de almacén', 'role.RECEIVING_OPERATOR': 'Operario de recepción', 'role.VIEWER': 'Solo consulta',
    'status.DRAFT': 'Borrador', 'status.PUBLISHED': 'Publicado', 'status.COMPLETED': 'Completado', 'status.PRESENT': 'Presente', 'status.ABSENT': 'Ausente', 'status.REMOTE': 'Remoto', 'status.LEAVE': 'De permiso', 'status.SICKNESS': 'Baja médica', 'status.ARRIVED': 'Llegado', 'status.CHECKING': 'En revisión', 'status.ACCEPTED': 'Aceptado', 'status.REJECTED': 'Rechazado', 'status.CLOSED': 'Cerrado', 'status.NORMAL': 'Normal', 'status.LOW': 'Baja', 'status.HIGH': 'Alta', 'status.URGENT': 'Urgente', 'status.ACTIVE': 'Activo', 'status.INACTIVE': 'Inactivo',
  },
  de: {
    'language.label': 'Sprache', 'navigation.label': 'Navigation', 'navigation.dashboard': 'Übersicht', 'navigation.attendance': 'Anwesenheit', 'navigation.shifts': 'Schichtplanung', 'navigation.tasks': 'Aufgabenbereiche', 'navigation.receiving': 'Wareneingang', 'navigation.communications': 'Kommunikation',
    'login.environment': 'ENTWICKLUNGSUMGEBUNG', 'login.restricted': 'EINGESCHRÄNKTER ZUGANG', 'login.description': 'Melden Sie sich mit Ihren Unternehmenszugangsdaten an, um autorisierte Vorgänge zu verwalten.', 'login.corporateEmail': 'Unternehmens-E-Mail', 'login.password': 'Passwort', 'login.show': 'Anzeigen', 'login.hide': 'Ausblenden', 'login.verifying': 'Zugangsdaten werden geprüft…', 'login.signIn': 'Am Portal anmelden', 'login.secureConnection': 'Sichere Verbindung', 'login.internalUse': 'Autorisierte interne Nutzung',
    'common.systemOperational': 'System betriebsbereit', 'common.loading': 'Daten werden geladen…', 'common.unableToLoad': 'Daten können nicht geladen werden', 'common.retry': 'Erneut versuchen', 'common.noResults': 'Keine Ergebnisse', 'common.nothingToShow': 'In dieser Ansicht gibt es keine Elemente anzuzeigen.', 'common.refresh': 'Aktualisieren', 'common.cancel': 'Abbrechen', 'common.save': 'Speichern', 'common.create': 'Erstellen', 'common.confirm': 'Bestätigen', 'common.close': 'Schließen', 'common.closeWindow': 'Fenster schließen', 'common.logout': 'Vom Portal abmelden', 'common.user': 'Benutzer', 'common.notAvailable': 'Nicht verfügbar', 'common.notAssigned': 'Nicht zugewiesen', 'common.notDetected': 'Nicht erfasst', 'common.optional': 'optional', 'common.errorFallback': 'Der Vorgang konnte nicht abgeschlossen werden. Bitte versuchen Sie es in Kürze erneut.', 'common.messageClose': 'Meldung schließen',
    'dashboard.eyebrow': 'BETRIEBSÜBERSICHT', 'dashboard.greeting': 'Guten Morgen{ name}', 'dashboard.description': 'Kompakte Übersicht der heutigen prioritären Aktivitäten.', 'dashboard.exportReport': 'Bericht exportieren', 'dashboard.refresh': 'Dashboard aktualisieren', 'dashboard.indicators': 'Betriebskennzahlen', 'dashboard.activePersonnel': 'Aktives Personal', 'dashboard.currentDirectory': 'Aktuelles Verzeichnis', 'dashboard.presentToday': 'Heute anwesend', 'dashboard.confirmedReadings': 'Bestätigte Erfassungen', 'dashboard.arrivalsToManage': 'Zu bearbeitende Ankünfte', 'dashboard.waitingWorkflow': 'Warten auf Workflow', 'dashboard.lowStock': 'Niedriger Bestand', 'dashboard.minimumThreshold': 'Mindestschwelle unterschritten', 'dashboard.arrivalsAcceptance': 'Ankünfte im Wareneingang', 'dashboard.case': 'Vorgang', 'dashboard.cases': 'Vorgänge', 'dashboard.receipt': 'Wareneingang', 'dashboard.supplier': 'Lieferant', 'dashboard.carrier': 'Frachtführer', 'dashboard.lines': 'Positionen', 'dashboard.status': 'Status', 'dashboard.noArrivals': 'Keine Ankünfte zu bearbeiten', 'dashboard.noArrivalsText': 'Neue Lieferungen erscheinen hier, sobald sie erfasst wurden.', 'dashboard.noPurchaseOrder': 'Ohne Bestellung', 'dashboard.reportExported': 'Ankunftsbericht als CSV exportiert.',
    'attendance.eyebrow': 'HR-OPERATIONS', 'attendance.title': 'Anwesenheit und Verzeichnis', 'attendance.description': 'Anwesenheitserfassung, Unternehmensstruktur und berufliche Einordnung der Mitarbeitenden.', 'attendance.addCollaborator': 'Mitarbeiter hinzufügen', 'attendance.dailyRegister': 'Tagesregister', 'attendance.today': 'HEUTE', 'attendance.people': 'Personen', 'attendance.employee': 'Mitarbeiter', 'attendance.department': 'Abteilung', 'attendance.workedHours': 'Arbeitsstunden', 'attendance.action': 'Aktion', 'attendance.noRecords': 'Keine Anwesenheit erfasst', 'attendance.noRecordsText': 'Die heutigen Anwesenheitserfassungen erscheinen in diesem Register.', 'attendance.clockIn': 'Einstempeln', 'attendance.clockOut': 'Ausstempeln', 'attendance.clockedIn': '{name} wurde eingestempelt.', 'attendance.clockedOut': '{name} wurde ausgestempelt.', 'attendance.departmentUnassigned': 'Abteilung zuzuweisen', 'attendance.profileUnassigned': 'Berufsprofil zuzuweisen', 'attendance.employeeUnavailable': 'Mitarbeiter nicht verfügbar', 'attendance.employeeFallback': 'Mitarbeiter',
    'shifts.eyebrow': 'PERSONALPLANUNG', 'shifts.title': 'Schichtplanung', 'shifts.description': 'Abdeckung von Abteilungen, Büros und Berufsprofilen in den nächsten sieben Tagen.', 'shifts.assign': 'Schicht zuweisen', 'shifts.refresh': 'Schichten aktualisieren', 'shifts.planned': 'Geplante Schichten', 'shifts.assignments': 'Zuweisungen', 'shifts.assigned': 'Schicht zugewiesen und im Plan veröffentlicht.',
    'tasks.eyebrow': 'STANDARDARBEITSANWEISUNGEN', 'tasks.title': 'Aufgabenbereiche', 'tasks.description': 'Operative Verantwortlichkeiten, Prioritäten und Abschluss zugewiesener Aufgaben.', 'tasks.newTask': 'Neue Aufgabe', 'tasks.refresh': 'Aufgaben aktualisieren', 'tasks.operationalTasks': 'Operative Aufgaben', 'tasks.open': 'offen', 'tasks.completed': 'Abgeschlossen', 'tasks.complete': 'Abschließen', 'tasks.completedMessage': 'Aufgabe abgeschlossen und erfasst.',
    'receiving.eyebrow': 'WARENEINGANG', 'receiving.title': 'Wareneingang', 'receiving.description': 'Dokumentenprüfung und Fortschritt des Wareneingangs-Workflows.', 'receiving.arrivalNotice': 'Ankunftsvorankündigung', 'receiving.refresh': 'Wareneingang aktualisieren', 'receiving.receipts': 'Wareneingänge', 'receiving.open': 'offen', 'receiving.document': 'Dokument', 'receiving.expectedArrival': 'Voraussichtliche Ankunft', 'receiving.bayCarrier': 'Rampe / Frachtführer', 'receiving.workflow': 'Workflow', 'receiving.noReceipts': 'Keine Wareneingänge vorhanden', 'receiving.noReceiptsText': 'Erfassen Sie eine Ankunftsvorankündigung, um eine neue Lieferung zu verfolgen.', 'receiving.carrierUnassigned': 'Frachtführer nicht zugewiesen', 'receiving.statusUpdated': '{number}: Status auf „{status}“ aktualisiert.', 'receiving.noticeRegistered': 'Ankunftsvorankündigung im Wareneingangs-Workflow erfasst.',
    'communications.eyebrow': 'UNTERNEHMENSKOMMUNIKATION', 'communications.title': 'Nachrichten und Anfragen', 'communications.description': 'Interne Nachrichten und abteilungsübergreifende Anfragen in einem gemeinsamen Bereich.', 'communications.compose': 'Neue Nachricht', 'communications.inbox': 'Posteingang', 'communications.requests': 'Abteilungsübergreifende Anfragen', 'communications.markRead': 'Als gelesen markieren',
    'role.ADMIN': 'Administrator', 'role.HR': 'Personalwesen', 'role.SUPERVISOR': 'Supervisor', 'role.WAREHOUSE_OPERATOR': 'Lagerist', 'role.RECEIVING_OPERATOR': 'Wareneingangsmitarbeiter', 'role.VIEWER': 'Nur anzeigen',
    'status.DRAFT': 'Entwurf', 'status.PUBLISHED': 'Veröffentlicht', 'status.COMPLETED': 'Abgeschlossen', 'status.PRESENT': 'Anwesend', 'status.ABSENT': 'Abwesend', 'status.REMOTE': 'Remote', 'status.LEAVE': 'Urlaub', 'status.SICKNESS': 'Krankheit', 'status.ARRIVED': 'Eingetroffen', 'status.CHECKING': 'In Prüfung', 'status.ACCEPTED': 'Akzeptiert', 'status.REJECTED': 'Abgelehnt', 'status.CLOSED': 'Geschlossen', 'status.NORMAL': 'Normal', 'status.LOW': 'Niedrig', 'status.HIGH': 'Hoch', 'status.URGENT': 'Dringend', 'status.ACTIVE': 'Aktiv', 'status.INACTIVE': 'Inaktiv',
  },
  fr: {
    'language.label': 'Langue', 'navigation.label': 'Navigation', 'navigation.dashboard': 'Vue d’ensemble', 'navigation.attendance': 'Présences', 'navigation.shifts': 'Planification des équipes', 'navigation.tasks': 'Fiches de poste', 'navigation.receiving': 'Réception des marchandises', 'navigation.communications': 'Communications',
    'login.environment': 'ENVIRONNEMENT DE DÉVELOPPEMENT', 'login.restricted': 'ACCÈS RESTREINT', 'login.description': 'Connectez-vous avec vos identifiants professionnels pour gérer les opérations autorisées.', 'login.corporateEmail': 'E-mail professionnel', 'login.password': 'Mot de passe', 'login.show': 'Afficher', 'login.hide': 'Masquer', 'login.verifying': 'Vérification des identifiants…', 'login.signIn': 'Accéder au portail', 'login.secureConnection': 'Connexion sécurisée', 'login.internalUse': 'Usage interne autorisé',
    'common.systemOperational': 'Système opérationnel', 'common.loading': 'Chargement des données…', 'common.unableToLoad': 'Impossible de charger les données', 'common.retry': 'Réessayer', 'common.noResults': 'Aucun résultat', 'common.nothingToShow': 'Aucun élément à afficher dans cette vue.', 'common.refresh': 'Actualiser', 'common.cancel': 'Annuler', 'common.save': 'Enregistrer', 'common.create': 'Créer', 'common.confirm': 'Confirmer', 'common.close': 'Fermer', 'common.closeWindow': 'Fermer la fenêtre', 'common.logout': 'Se déconnecter du portail', 'common.user': 'Utilisateur', 'common.notAvailable': 'Non disponible', 'common.notAssigned': 'Non attribué', 'common.notDetected': 'Non enregistré', 'common.optional': 'facultatif', 'common.errorFallback': 'L’opération n’a pas pu être effectuée. Veuillez réessayer dans quelques instants.', 'common.messageClose': 'Fermer le message',
    'dashboard.eyebrow': 'VUE D’ENSEMBLE OPÉRATIONNELLE', 'dashboard.greeting': 'Bonjour{ name}', 'dashboard.description': 'Vue synthétique des activités prioritaires du jour.', 'dashboard.exportReport': 'Exporter le rapport', 'dashboard.refresh': 'Actualiser le tableau de bord', 'dashboard.indicators': 'Indicateurs opérationnels', 'dashboard.activePersonnel': 'Personnel actif', 'dashboard.currentDirectory': 'Annuaire actuel', 'dashboard.presentToday': 'Présents aujourd’hui', 'dashboard.confirmedReadings': 'Pointages confirmés', 'dashboard.arrivalsToManage': 'Arrivages à traiter', 'dashboard.waitingWorkflow': 'En attente de flux', 'dashboard.lowStock': 'Stock faible', 'dashboard.minimumThreshold': 'Seuil minimum dépassé', 'dashboard.arrivalsAcceptance': 'Arrivages en réception', 'dashboard.case': 'dossier', 'dashboard.cases': 'dossiers', 'dashboard.receipt': 'Réception', 'dashboard.supplier': 'Fournisseur', 'dashboard.carrier': 'Transporteur', 'dashboard.lines': 'Lignes', 'dashboard.status': 'Statut', 'dashboard.noArrivals': 'Aucun arrivage à traiter', 'dashboard.noArrivalsText': 'Les nouvelles livraisons apparaîtront ici dès leur enregistrement.', 'dashboard.noPurchaseOrder': 'Sans commande d’achat', 'dashboard.reportExported': 'Rapport des arrivages exporté au format CSV.',
    'attendance.eyebrow': 'OPÉRATIONS RH', 'attendance.title': 'Présences et annuaire', 'attendance.description': 'Pointages, structure organisationnelle et classification professionnelle des collaborateurs.', 'attendance.addCollaborator': 'Ajouter un collaborateur', 'attendance.dailyRegister': 'Registre quotidien', 'attendance.today': 'AUJOURD’HUI', 'attendance.people': 'personnes', 'attendance.employee': 'Employé', 'attendance.department': 'Service', 'attendance.workedHours': 'Heures travaillées', 'attendance.action': 'Action', 'attendance.noRecords': 'Aucune présence enregistrée', 'attendance.noRecordsText': 'Les pointages du jour apparaîtront dans ce registre.', 'attendance.clockIn': 'Enregistrer l’arrivée', 'attendance.clockOut': 'Enregistrer le départ', 'attendance.clockedIn': 'Arrivée de {name} enregistrée.', 'attendance.clockedOut': 'Départ de {name} enregistré.', 'attendance.departmentUnassigned': 'Service à attribuer', 'attendance.profileUnassigned': 'Profil à attribuer', 'attendance.employeeUnavailable': 'Collaborateur indisponible', 'attendance.employeeFallback': 'Collaborateur',
    'shifts.eyebrow': 'PLANIFICATION DES EFFECTIFS', 'shifts.title': 'Planification des équipes', 'shifts.description': 'Couverture des services, bureaux et profils professionnels pour les sept prochains jours.', 'shifts.assign': 'Attribuer une équipe', 'shifts.refresh': 'Actualiser les équipes', 'shifts.planned': 'Équipes planifiées', 'shifts.assignments': 'attributions', 'shifts.assigned': 'Équipe attribuée et publiée dans le planning.',
    'tasks.eyebrow': 'PROCÉDURES OPÉRATIONNELLES STANDARD', 'tasks.title': 'Fiches de poste', 'tasks.description': 'Responsabilités opérationnelles, priorités et achèvement des tâches attribuées.', 'tasks.newTask': 'Nouvelle tâche', 'tasks.refresh': 'Actualiser les tâches', 'tasks.operationalTasks': 'Tâches opérationnelles', 'tasks.open': 'ouvertes', 'tasks.completed': 'Terminée', 'tasks.complete': 'Terminer', 'tasks.completedMessage': 'Tâche terminée et enregistrée.',
    'receiving.eyebrow': 'RÉCEPTION ENTREPÔT', 'receiving.title': 'Réception des marchandises', 'receiving.description': 'Contrôle documentaire et avancement du flux de réception.', 'receiving.arrivalNotice': 'Avis d’arrivée', 'receiving.refresh': 'Actualiser la réception', 'receiving.receipts': 'Réceptions', 'receiving.open': 'ouvertes', 'receiving.document': 'Document', 'receiving.expectedArrival': 'Arrivée prévue', 'receiving.bayCarrier': 'Quai / transporteur', 'receiving.workflow': 'Flux', 'receiving.noReceipts': 'Aucune réception', 'receiving.noReceiptsText': 'Enregistrez un avis d’arrivée pour commencer le suivi d’une nouvelle livraison.', 'receiving.carrierUnassigned': 'Transporteur non attribué', 'receiving.statusUpdated': '{number} : statut mis à jour sur « {status} ».', 'receiving.noticeRegistered': 'Avis d’arrivée enregistré dans le flux de réception.',
    'communications.eyebrow': 'COMMUNICATIONS D’ENTREPRISE', 'communications.title': 'Messages et demandes', 'communications.description': 'Messages internes et demandes entre services, centralisés dans un seul espace.', 'communications.compose': 'Nouveau message', 'communications.inbox': 'Boîte de réception', 'communications.requests': 'Demandes interservices', 'communications.markRead': 'Marquer comme lu',
    'role.ADMIN': 'Administrateur', 'role.HR': 'Ressources humaines', 'role.SUPERVISOR': 'Superviseur', 'role.WAREHOUSE_OPERATOR': 'Opérateur d’entrepôt', 'role.RECEIVING_OPERATOR': 'Opérateur de réception', 'role.VIEWER': 'Consultation seule',
    'status.DRAFT': 'Brouillon', 'status.PUBLISHED': 'Publié', 'status.COMPLETED': 'Terminé', 'status.PRESENT': 'Présent', 'status.ABSENT': 'Absent', 'status.REMOTE': 'À distance', 'status.LEAVE': 'En congé', 'status.SICKNESS': 'Maladie', 'status.ARRIVED': 'Arrivé', 'status.CHECKING': 'En contrôle', 'status.ACCEPTED': 'Accepté', 'status.REJECTED': 'Refusé', 'status.CLOSED': 'Fermé', 'status.NORMAL': 'Normale', 'status.LOW': 'Basse', 'status.HIGH': 'Haute', 'status.URGENT': 'Urgente', 'status.ACTIVE': 'Actif', 'status.INACTIVE': 'Inactif',
  },
  pl: {
    'language.label': 'Język', 'navigation.label': 'Nawigacja', 'navigation.dashboard': 'Przegląd', 'navigation.attendance': 'Obecność', 'navigation.shifts': 'Planowanie zmian', 'navigation.tasks': 'Zakres obowiązków', 'navigation.receiving': 'Przyjęcie towarów', 'navigation.communications': 'Komunikacja',
    'login.environment': 'ŚRODOWISKO PROGRAMISTYCZNE', 'login.restricted': 'DOSTĘP OGRANICZONY', 'login.description': 'Zaloguj się za pomocą danych firmowych, aby zarządzać autoryzowanymi operacjami.', 'login.corporateEmail': 'E-mail firmowy', 'login.password': 'Hasło', 'login.show': 'Pokaż', 'login.hide': 'Ukryj', 'login.verifying': 'Weryfikowanie danych…', 'login.signIn': 'Zaloguj się do portalu', 'login.secureConnection': 'Bezpieczne połączenie', 'login.internalUse': 'Autoryzowany użytek wewnętrzny',
    'common.systemOperational': 'System działa', 'common.loading': 'Wczytywanie danych…', 'common.unableToLoad': 'Nie można wczytać danych', 'common.retry': 'Spróbuj ponownie', 'common.noResults': 'Brak wyników', 'common.nothingToShow': 'W tym widoku nie ma elementów do wyświetlenia.', 'common.refresh': 'Odśwież', 'common.cancel': 'Anuluj', 'common.save': 'Zapisz', 'common.create': 'Utwórz', 'common.confirm': 'Potwierdź', 'common.close': 'Zamknij', 'common.closeWindow': 'Zamknij okno', 'common.logout': 'Wyloguj z portalu', 'common.user': 'Użytkownik', 'common.notAvailable': 'Niedostępne', 'common.notAssigned': 'Nieprzypisane', 'common.notDetected': 'Nie zarejestrowano', 'common.optional': 'opcjonalne', 'common.errorFallback': 'Nie udało się wykonać operacji. Spróbuj ponownie za chwilę.', 'common.messageClose': 'Zamknij komunikat',
    'dashboard.eyebrow': 'PRZEGLĄD OPERACYJNY', 'dashboard.greeting': 'Dzień dobry{ name}', 'dashboard.description': 'Zwięzły widok priorytetowych działań na dziś.', 'dashboard.exportReport': 'Eksportuj raport', 'dashboard.refresh': 'Odśwież pulpit', 'dashboard.indicators': 'Wskaźniki operacyjne', 'dashboard.activePersonnel': 'Aktywny personel', 'dashboard.currentDirectory': 'Aktualny rejestr', 'dashboard.presentToday': 'Obecni dzisiaj', 'dashboard.confirmedReadings': 'Potwierdzone rejestracje', 'dashboard.arrivalsToManage': 'Dostawy do obsługi', 'dashboard.waitingWorkflow': 'Oczekują na proces', 'dashboard.lowStock': 'Niski stan', 'dashboard.minimumThreshold': 'Przekroczono próg minimalny', 'dashboard.arrivalsAcceptance': 'Dostawy w przyjęciu', 'dashboard.case': 'sprawa', 'dashboard.cases': 'sprawy', 'dashboard.receipt': 'Przyjęcie', 'dashboard.supplier': 'Dostawca', 'dashboard.carrier': 'Przewoźnik', 'dashboard.lines': 'Pozycje', 'dashboard.status': 'Status', 'dashboard.noArrivals': 'Brak dostaw do obsługi', 'dashboard.noArrivalsText': 'Nowe dostawy pojawią się tutaj po ich zarejestrowaniu.', 'dashboard.noPurchaseOrder': 'Bez zamówienia zakupu', 'dashboard.reportExported': 'Raport dostaw wyeksportowany do CSV.',
    'attendance.eyebrow': 'OPERACJE HR', 'attendance.title': 'Obecność i kartoteka', 'attendance.description': 'Rejestry obecności, struktura organizacyjna i klasyfikacja zawodowa współpracowników.', 'attendance.addCollaborator': 'Dodaj pracownika', 'attendance.dailyRegister': 'Rejestr dzienny', 'attendance.today': 'DZISIAJ', 'attendance.people': 'osób', 'attendance.employee': 'Pracownik', 'attendance.department': 'Dział', 'attendance.workedHours': 'Godziny pracy', 'attendance.action': 'Działanie', 'attendance.noRecords': 'Brak zarejestrowanej obecności', 'attendance.noRecordsText': 'Dzisiejsze rejestry obecności pojawią się w tym zestawieniu.', 'attendance.clockIn': 'Zarejestruj wejście', 'attendance.clockOut': 'Zarejestruj wyjście', 'attendance.clockedIn': 'Wejście {name} zarejestrowane.', 'attendance.clockedOut': 'Wyjście {name} zarejestrowane.', 'attendance.departmentUnassigned': 'Dział do przypisania', 'attendance.profileUnassigned': 'Stanowisko do przypisania', 'attendance.employeeUnavailable': 'Pracownik niedostępny', 'attendance.employeeFallback': 'Pracownik',
    'shifts.eyebrow': 'PLANOWANIE ZESPOŁU', 'shifts.title': 'Planowanie zmian', 'shifts.description': 'Obsada działów, biur i profili zawodowych w ciągu najbliższych siedmiu dni.', 'shifts.assign': 'Przypisz zmianę', 'shifts.refresh': 'Odśwież zmiany', 'shifts.planned': 'Zaplanowane zmiany', 'shifts.assignments': 'przypisania', 'shifts.assigned': 'Zmiana przypisana i opublikowana w planie.',
    'tasks.eyebrow': 'STANDARDOWE PROCEDURY OPERACYJNE', 'tasks.title': 'Zakres obowiązków', 'tasks.description': 'Obowiązki operacyjne, priorytety i realizacja przypisanych zadań.', 'tasks.newTask': 'Nowe zadanie', 'tasks.refresh': 'Odśwież zadania', 'tasks.operationalTasks': 'Zadania operacyjne', 'tasks.open': 'otwarte', 'tasks.completed': 'Ukończono', 'tasks.complete': 'Zakończ', 'tasks.completedMessage': 'Zadanie ukończone i zarejestrowane.',
    'receiving.eyebrow': 'PRZYJĘCIE MAGAZYNOWE', 'receiving.title': 'Przyjęcie towarów', 'receiving.description': 'Kontrola dokumentów i postęp procesu przyjęcia.', 'receiving.arrivalNotice': 'Awizo dostawy', 'receiving.refresh': 'Odśwież przyjęcie', 'receiving.receipts': 'Przyjęcia', 'receiving.open': 'otwarte', 'receiving.document': 'Dokument', 'receiving.expectedArrival': 'Planowane przybycie', 'receiving.bayCarrier': 'Rampa / przewoźnik', 'receiving.workflow': 'Proces', 'receiving.noReceipts': 'Brak przyjęć', 'receiving.noReceiptsText': 'Zarejestruj awizo dostawy, aby rozpocząć śledzenie nowej dostawy.', 'receiving.carrierUnassigned': 'Przewoźnik nieprzypisany', 'receiving.statusUpdated': '{number}: status zaktualizowany na „{status}”.', 'receiving.noticeRegistered': 'Awizo dostawy zarejestrowane w procesie przyjęcia.',
    'communications.eyebrow': 'KOMUNIKACJA FIRMOWA', 'communications.title': 'Wiadomości i zgłoszenia', 'communications.description': 'Wiadomości wewnętrzne i zgłoszenia między działami w jednym miejscu.', 'communications.compose': 'Nowa wiadomość', 'communications.inbox': 'Skrzynka odbiorcza', 'communications.requests': 'Zgłoszenia między działami', 'communications.markRead': 'Oznacz jako przeczytane',
    'role.ADMIN': 'Administrator', 'role.HR': 'Dział kadr', 'role.SUPERVISOR': 'Nadzorca', 'role.WAREHOUSE_OPERATOR': 'Magazynier', 'role.RECEIVING_OPERATOR': 'Operator przyjęcia', 'role.VIEWER': 'Tylko podgląd',
    'status.DRAFT': 'Szkic', 'status.PUBLISHED': 'Opublikowano', 'status.COMPLETED': 'Ukończono', 'status.PRESENT': 'Obecny', 'status.ABSENT': 'Nieobecny', 'status.REMOTE': 'Zdalnie', 'status.LEAVE': 'Urlop', 'status.SICKNESS': 'Zwolnienie chorobowe', 'status.ARRIVED': 'Przybyło', 'status.CHECKING': 'W kontroli', 'status.ACCEPTED': 'Zaakceptowano', 'status.REJECTED': 'Odrzucono', 'status.CLOSED': 'Zamknięto', 'status.NORMAL': 'Normalny', 'status.LOW': 'Niski', 'status.HIGH': 'Wysoki', 'status.URGENT': 'Pilne', 'status.ACTIVE': 'Aktywny', 'status.INACTIVE': 'Nieaktywny',
  },
};

export function getLanguage(): Language { return activeLanguage; }
export function getIntlLocale(): string { return intlLocales[activeLanguage]; }

export function setLanguage(language: Language) {
  activeLanguage = language;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(storageKey, language);
    window.document.documentElement.lang = language;
  }
}

export function translate(key: TranslationKey, values: Record<string, string | number | undefined> = {}): string {
  const phrase = translations[activeLanguage][key] || italian[key];
  return phrase.replace(/\{\s*(\w+)\s*\}/g, (_, token: string) => values[token] === undefined ? '' : String(values[token]));
}

export function translateStatus(value?: string): string {
  if (!value) return translate('common.notDetected');
  const key = `status.${value}` as TranslationKey;
  return key in italian ? translate(key) : value.replace(/_/g, ' ');
}

export function translateRole(value?: string): string {
  if (!value) return '';
  const key = `role.${value}` as TranslationKey;
  return key in italian ? translate(key) : value.replace(/_/g, ' ');
}

export function useLanguage() {
  const [language, setSelectedLanguage] = useState<Language>(() => getLanguage());
  useEffect(() => { setLanguage(language); }, [language]);
  const changeLanguage = useCallback((nextLanguage: Language) => {
    setLanguage(nextLanguage);
    setSelectedLanguage(nextLanguage);
  }, []);
  return { language, setLanguage: changeLanguage };
}
