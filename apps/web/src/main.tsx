import { StrictMode, useCallback, useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type FormEvent, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { auth, login, request } from './api';
import Communications from './components/Communications';
import { getIntlLocale, languageOptions, translate as t, translateRole, translateStatus, type Language, type TranslationKey, useLanguage } from './i18n';
import './styles.css';

type Page = 'dashboard' | 'presenze' | 'turni' | 'mansionario' | 'ricevimento' | 'comunicazioni';
type NoticeType = 'success' | 'error';
type Notify = (message: string, type?: NoticeType) => void;
type MasterData = { suppliers: any[]; warehouses: any[]; items: any[]; locations: any[]; departments: any[]; profiles: any[] };

const pages: Array<{ id: Page; labelKey: TranslationKey; icon: IconName }> = [
  { id: 'dashboard', labelKey: 'navigation.dashboard', icon: 'grid' },
  { id: 'presenze', labelKey: 'navigation.attendance', icon: 'users' },
  { id: 'turni', labelKey: 'navigation.shifts', icon: 'calendar' },
  { id: 'mansionario', labelKey: 'navigation.tasks', icon: 'clipboard' },
  { id: 'ricevimento', labelKey: 'navigation.receiving', icon: 'truck' },
  { id: 'comunicazioni', labelKey: 'navigation.communications', icon: 'mail' },
];

function errorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : t('common.errorFallback');
}
function localDate(value = new Date()) {
  return new Date(value.getTime() - value.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}
function formatDate(value?: string, withWeekday = false) {
  if (!value) return '—';
  return new Intl.DateTimeFormat(getIntlLocale(), { weekday: withWeekday ? 'short' : undefined, day: '2-digit', month: 'short', year: withWeekday ? undefined : 'numeric' }).format(new Date(value));
}
function formatHours(minutes?: number) { return typeof minutes === 'number' ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : '—'; }
function friendlyStatus(value?: string) { return translateStatus(value); }
function statusTone(value?: string) {
  if (['ACCEPTED', 'COMPLETED', 'PUBLISHED', 'PRESENT', 'ACTIVE'].includes(value || '')) return 'success';
  if (['URGENT', 'HIGH', 'REJECTED', 'ABSENT', 'SICKNESS'].includes(value || '')) return 'danger';
  if (['ARRIVED', 'CHECKING', 'DRAFT', 'LEAVE'].includes(value || '')) return 'warning';
  return 'neutral';
}

function useResource<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reload = useCallback(async () => {
    setLoading(true); setError('');
    try { setData(await request(path)); } catch (error) { setError(errorMessage(error)); } finally { setLoading(false); }
  }, [path]);
  useEffect(() => { void reload(); }, [reload]);
  return { data, loading, error, reload };
}

type IconName = 'grid' | 'users' | 'calendar' | 'clipboard' | 'truck' | 'mail' | 'refresh' | 'plus' | 'download' | 'logout' | 'close' | 'check' | 'arrow' | 'alert';
function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const paths: Record<IconName, ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18M8 15h.01M12 15h.01M16 15h.01" /></>,
    clipboard: <><path d="M9 5h6M9 3h6a2 2 0 0 1 2 2v1H7V5a2 2 0 0 1 2-2Z" /><path d="M17 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2M8 12h8M8 16h5" /></>,
    truck: <><path d="M3 6h11v11H3zM14 9h4l3 3v5h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    refresh: <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 5v4h4M4 13a8.1 8.1 0 0 0 15.5 2M20 19v-4h-4" />,
    plus: <path d="M12 5v14M5 12h14" />, download: <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />, logout: <path d="M10 17l5-5-5-5M15 12H3M21 19V5a2 2 0 0 0-2-2h-6" />,
    close: <path d="M18 6 6 18M6 6l12 12" />, check: <path d="m5 12 4 4L19 6" />, arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    alert: <><path d="M10.3 3.9 1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" {...common}>{paths[name]}</svg>;
}

function Button({ children, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) { return <button className={`button ${className}`.trim()} {...props}>{children}</button>; }
function StatusBadge({ value }: { value?: string }) { return <span className={`status status--${statusTone(value)}`}>{friendlyStatus(value)}</span>; }
function LanguageSelector({ language, onLanguageChange, className = '' }: { language: Language; onLanguageChange: (language: Language) => void; className?: string }) {
  return <label className={`language-selector ${className}`.trim()}>
    <span className="language-selector__label">{t('language.label')}</span>
    <select aria-label={t('language.label')} value={language} onChange={event => onLanguageChange(event.target.value as Language)}>
      {languageOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  </label>;
}

function departmentScope(department?: any) {
  const identity = `${department?.code || ''} ${department?.name || ''}`.toLocaleLowerCase('it-IT');
  return /(log|magazz|warehouse|ricev|inbound|operat|produz|manut|trasport|supply|qualit|hse|qhs)/.test(identity) ? 'operations' : 'office';
}
function profileScope(profile?: any) {
  const identity = `${profile?.code || ''} ${profile?.title || ''}`.toLocaleLowerCase('it-IT');
  if (/(dirett|director|manager|responsab|coordin|head)/.test(identity)) return 'leadership';
  if (/(operaio|operatore|magazz|logistic|ricev|produz|manut|addetto)/.test(identity)) return 'operations';
  return 'office';
}
function DepartmentBadge({ department }: { department?: any }) {
  if (!department) return <span className="department-badge department-badge--unassigned">{t('attendance.departmentUnassigned')}</span>;
  return <span className={`department-badge department-badge--${departmentScope(department)}`} title={`${department.code} · ${department.name}`}><b>{department.code}</b><span>{department.name}</span></span>;
}
function ProfessionalBadge({ profile }: { profile?: any }) {
  if (!profile) return <span className="professional-badge professional-badge--unassigned">{t('attendance.profileUnassigned')}</span>;
  return <span className={`professional-badge professional-badge--${profileScope(profile)}`} title={`${profile.code} · ${profile.title}`}><b>{profile.code}</b><span>{profile.title}</span></span>;
}
function employeeLabel(employee?: any) {
  if (!employee) return t('attendance.employeeUnavailable');
  const name = `${employee.user?.firstName || ''} ${employee.user?.lastName || ''}`.trim() || employee.code || t('attendance.employeeFallback');
  const department = employee.department?.name || t('attendance.departmentUnassigned');
  const profile = employee.jobProfile?.title ? ` · ${employee.jobProfile.title}` : '';
  return `${name} · ${department}${profile}`;
}

function PageHeader({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: ReactNode }) {
  return <header className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-description">{description}</p></div><div className="page-actions">{children}<span className="live-indicator"><i />{t('common.systemOperational')}</span></div></header>;
}
function Panel({ title, subtitle, meta, children }: { title: string; subtitle?: string; meta?: ReactNode; children: ReactNode }) {
  return <section className="panel"><div className="panel__header"><div>{subtitle && <p className="eyebrow">{subtitle}</p>}<h2>{title}</h2></div>{meta}</div>{children}</section>;
}
function TableState({ loading, error, colSpan, onRetry, emptyTitle, emptyText }: { loading: boolean; error: string; colSpan: number; onRetry: () => void; emptyTitle?: string; emptyText?: string }) {
  if (loading) return <tr><td colSpan={colSpan}><div className="table-state"><span className="spinner" />{t('common.loading')}</div></td></tr>;
  if (error) return <tr><td colSpan={colSpan}><div className="table-state table-state--error"><Icon name="alert" /><span><b>{t('common.unableToLoad')}</b>{error}</span><Button type="button" className="button--secondary button--small" onClick={onRetry}>{t('common.retry')}</Button></div></td></tr>;
  return <tr><td colSpan={colSpan}><div className="table-state"><b>{emptyTitle || t('common.noResults')}</b><span>{emptyText || t('common.nothingToShow')}</span></div></td></tr>;
}
function Modal({ title, description, onClose, children }: { title: string; description: string; onClose: () => void; children: ReactNode }) {
  const dialogRef = useRef<HTMLElement>(null); const titleId = useId(); const descriptionId = useId();
  useEffect(() => {
    const focusedBeforeOpen = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    window.setTimeout(() => dialog?.focus(), 0);
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
      if (event.key !== 'Tab' || !dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) { event.preventDefault(); dialog.focus(); return; }
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', handler);
    return () => { window.removeEventListener('keydown', handler); focusedBeforeOpen?.focus(); };
  }, [onClose]);
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section ref={dialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} tabIndex={-1} onMouseDown={event => event.stopPropagation()}><div className="modal__header"><div><h2 id={titleId}>{title}</h2><p id={descriptionId}>{description}</p></div><button className="icon-button" type="button" aria-label={t('common.closeWindow')} onClick={onClose}><Icon name="close" /></button></div>{children}</section></div>;
}

function Login({ onLogin, language, onLanguageChange }: { onLogin: () => void; language: Language; onLanguageChange: (language: Language) => void }) {
  const [email, setEmail] = useState('admin@nexus.local');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setError('');
    try { await login(email.trim(), password); onLogin(); } catch (error) { setError(errorMessage(error)); } finally { setSubmitting(false); }
  }
  return <main className="login-page"><section className="login-card"><div className="login-card__brand"><Brand /><div className="login-card__utilities"><span className="environment-tag">{t('login.environment')}</span><LanguageSelector language={language} onLanguageChange={onLanguageChange} className="language-selector--login" /></div></div><div className="login-copy"><p className="eyebrow">{t('login.restricted')}</p><h1>Nexus Enterprise Solutions</h1><p>{t('login.description')}</p></div><form className="login-form" onSubmit={handleLogin}><label htmlFor="email">{t('login.corporateEmail')}</label><input id="email" type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} required disabled={submitting} /><label htmlFor="password">{t('login.password')}</label><div className="password-field"><input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required disabled={submitting} /><button type="button" onClick={() => setShowPassword(value => !value)} disabled={submitting}>{showPassword ? t('login.hide') : t('login.show')}</button></div>{error && <div className="form-message form-message--error" role="alert"><Icon name="alert" size={16} />{error}</div>}<Button type="submit" className="button--primary button--full" disabled={submitting}>{submitting ? <><span className="spinner spinner--light" />{t('login.verifying')}</> : <>{t('login.signIn')} <Icon name="arrow" size={16} /></>}</Button></form><div className="login-security"><span><i />{t('login.secureConnection')}</span><span>{t('login.internalUse')}</span></div></section></main>;
}
function Brand() { return <><div className="brand-mark" aria-hidden="true">N<span>∕</span>E</div><div className="brand-name"><strong>NEXUS</strong><span>ENTERPRISE SOLUTIONS</span></div></>; }

function Stat({ value, label, hint, accent, icon }: { value?: number; label: string; hint: string; accent?: boolean; icon: IconName }) {
  return <article className={`stat-card${accent ? ' stat-card--accent' : ''}`}><div className="stat-card__icon"><Icon name={icon} size={19} /></div><div><strong>{typeof value === 'number' ? value : '—'}</strong><span>{label}</span></div><small>{hint}</small></article>;
}
function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const blob = new Blob([rows.map(row => row.map(escape).join(';')).join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
}

function Dashboard({ notify }: { notify: Notify }) {
  const { data, loading, error, reload } = useResource<any>('/dashboard');
  const arrivals = data?.arrivals || [];
  function exportArrivals() { if (!data) return; downloadCsv(`nexus-arrivi-${localDate()}.csv`, [[t('dashboard.receipt'), 'Ordine di acquisto', t('dashboard.supplier'), t('dashboard.carrier'), t('dashboard.lines'), t('dashboard.status')], ...arrivals.map((receipt: any) => [receipt.number, receipt.purchaseOrder || '', receipt.supplier?.name || '', receipt.carrier || '', receipt.lines?.length || 0, friendlyStatus(receipt.status)])]); notify(t('dashboard.reportExported')); }
  const greetingName = auth.user?.name ? `, ${auth.user.name.split(' ')[0]}` : '';
  return <><PageHeader eyebrow={t('dashboard.eyebrow')} title={t('dashboard.greeting', { name: greetingName })} description={t('dashboard.description')}><Button type="button" className="button--secondary" onClick={exportArrivals} disabled={!data}><Icon name="download" size={16} />{t('dashboard.exportReport')}</Button><Button type="button" className="button--icon button--secondary" aria-label={t('dashboard.refresh')} onClick={reload} disabled={loading}><Icon name="refresh" size={17} /></Button></PageHeader><section className="stats-grid" aria-label={t('dashboard.indicators')}><Stat value={data?.kpis?.employees} label={t('dashboard.activePersonnel')} hint={t('dashboard.currentDirectory')} icon="users" /><Stat value={data?.kpis?.present} label={t('dashboard.presentToday')} hint={t('dashboard.confirmedReadings')} accent icon="check" /><Stat value={data?.kpis?.openReceipts} label={t('dashboard.arrivalsToManage')} hint={t('dashboard.waitingWorkflow')} icon="truck" /><Stat value={data?.kpis?.lowStock} label={t('dashboard.lowStock')} hint={t('dashboard.minimumThreshold')} icon="alert" /></section><Panel title={t('dashboard.arrivalsAcceptance')} subtitle="INBOUND" meta={<span className="count-badge">{arrivals.length} {arrivals.length === 1 ? t('dashboard.case') : t('dashboard.cases')}</span>}><div className="table-wrap"><table><thead><tr><th>{t('dashboard.receipt')}</th><th>{t('dashboard.supplier')}</th><th>{t('dashboard.carrier')}</th><th>{t('dashboard.lines')}</th><th>{t('dashboard.status')}</th></tr></thead><tbody>{loading || error || arrivals.length === 0 ? <TableState loading={loading} error={error} colSpan={5} onRetry={reload} emptyTitle={t('dashboard.noArrivals')} emptyText={t('dashboard.noArrivalsText')} /> : arrivals.map((receipt: any) => <tr key={receipt.id}><td><strong>{receipt.number}</strong><small>{receipt.purchaseOrder || t('dashboard.noPurchaseOrder')}</small></td><td>{receipt.supplier?.name || '—'}</td><td>{receipt.carrier || t('common.notAssigned')}</td><td>{receipt.lines?.length || 0}</td><td><StatusBadge value={receipt.status} /></td></tr>)}</tbody></table></div></Panel></>;
}

function Attendance({ notify }: { notify: Notify }) {
  const attendance = useResource<any[]>('/attendance');
  const directory = useResource<any[]>('/employees');
  const organization = useResource<MasterData>('/master-data');
  const [busyId, setBusyId] = useState('');
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const canCreateEmployee = ['ADMIN', 'HR'].includes(auth.user?.role || '');
  const departments = organization.data?.departments || [];
  const officeDepartments = departments.filter(department => departmentScope(department) === 'office');
  const operationsDepartments = departments.filter(department => departmentScope(department) === 'operations');
  async function refreshPeople() { await Promise.all([attendance.reload(), directory.reload(), organization.reload()]); }
  async function registerClock(employee: any) {
    const type = employee.attendance ? 'OUT' : 'IN'; setBusyId(employee.id);
    try {
      await request('/attendance/clock', { method: 'POST', body: JSON.stringify({ employeeId: employee.id, type }) });
      notify(t(type === 'IN' ? 'attendance.clockedIn' : 'attendance.clockedOut', { name: employee.user.firstName }));
      await refreshPeople();
    } catch (error) { notify(errorMessage(error), 'error'); } finally { setBusyId(''); }
  }
  return <>
    <PageHeader eyebrow={t('attendance.eyebrow')} title={t('attendance.title')} description={t('attendance.description')}>
      {canCreateEmployee && <Button type="button" className="button--primary" onClick={() => setShowEmployeeModal(true)}><Icon name="plus" size={16} />{t('attendance.addCollaborator')}</Button>}
      <Button type="button" className="button--secondary" onClick={() => void refreshPeople()} disabled={attendance.loading || directory.loading}><Icon name="refresh" size={16} />{t('common.refresh')}</Button>
    </PageHeader>
    <Panel title={t('attendance.dailyRegister')} subtitle={t('attendance.today')} meta={<span className="count-badge">{attendance.data?.length || 0} {t('attendance.people')}</span>}>
      <div className="table-wrap"><table><thead><tr><th>{t('attendance.employee')}</th><th>{t('attendance.department')}</th><th>{t('dashboard.status')}</th><th>{t('attendance.workedHours')}</th><th><span className="sr-only">{t('attendance.action')}</span></th></tr></thead><tbody>{attendance.loading || attendance.error || !attendance.data?.length ? <TableState loading={attendance.loading} error={attendance.error} colSpan={5} onRetry={attendance.reload} emptyTitle={t('attendance.noRecords')} emptyText={t('attendance.noRecordsText')} /> : attendance.data.map(employee => <tr key={employee.id}><td><strong>{employee.user.firstName} {employee.user.lastName}</strong><small>{employee.code}</small></td><td><DepartmentBadge department={employee.department} /></td><td><StatusBadge value={employee.attendance?.status} /></td><td>{formatHours(employee.attendance?.workedMinutes)}</td><td className="table-action"><Button type="button" className="button--small button--secondary" disabled={busyId === employee.id} onClick={() => void registerClock(employee)}>{busyId === employee.id ? <span className="spinner" /> : <Icon name={employee.attendance ? 'logout' : 'check'} size={15} />}{employee.attendance ? t('attendance.clockOut') : t('attendance.clockIn')}</Button></td></tr>)}</tbody></table></div>
    </Panel>
    <div className="organization-directory" aria-labelledby="organization-title">
      <Panel title="Reparti, uffici e operations" subtitle="STRUTTURA AZIENDALE" meta={<span className="count-badge">{departments.length} aree</span>}>
        {organization.loading || organization.error ? <div className="organization-state">{organization.loading ? <><span className="spinner" />Caricamento struttura aziendale…</> : <><Icon name="alert" size={16} /><span>Non è possibile caricare la struttura aziendale.</span><Button type="button" className="button--small button--secondary" onClick={organization.reload}>Riprova</Button></>}</div> : <div className="organization-grid">
          <section className="organization-group">
            <div className="organization-group__header"><span className="organization-group__kicker">UFFICI E DIREZIONE</span><h3 id="organization-title">Funzioni aziendali</h3><p>Amministrazione, risorse umane, IT, commerciale, acquisti e direzione.</p></div>
            <div className="organization-list">{officeDepartments.length ? officeDepartments.map(department => <DepartmentBadge key={department.id} department={department} />) : <span className="organization-empty">Nessun ufficio configurato</span>}</div>
          </section>
          <section className="organization-group organization-group--operations">
            <div className="organization-group__header"><span className="organization-group__kicker">OPERATIONS</span><h3>Operatività e logistica</h3><p>Magazzino, ricevimento merci, produzione, qualità e funzioni sul campo.</p></div>
            <div className="organization-list">{operationsDepartments.length ? operationsDepartments.map(department => <DepartmentBadge key={department.id} department={department} />) : <span className="organization-empty">Nessun reparto operativo configurato</span>}</div>
          </section>
        </div>}
      </Panel>
    </div>
    <div className="employee-directory" id="anagrafica-collaboratori">
      <Panel title="Anagrafica collaboratori" subtitle="PERSONALE" meta={<span className="count-badge">{directory.data?.length || 0} collaboratori</span>}>
        <div className="table-wrap"><table className="organization-table"><thead><tr><th>{t('attendance.employee')}</th><th>{t('attendance.department')}</th><th>Qualifica / mansione</th><th>Ruolo applicativo</th><th>Assunzione</th><th>{t('dashboard.status')}</th></tr></thead><tbody>{directory.loading || directory.error || !directory.data?.length ? <TableState loading={directory.loading} error={directory.error} colSpan={6} onRetry={directory.reload} emptyTitle="Nessun collaboratore presente" emptyText="Aggiungi il primo collaboratore per completare l'anagrafica aziendale." /> : directory.data.map(employee => <tr key={employee.id}><td><strong>{employee.user?.firstName} {employee.user?.lastName}</strong><small>{employee.code} · {employee.user?.email}</small></td><td><DepartmentBadge department={employee.department} /></td><td><ProfessionalBadge profile={employee.jobProfile} /></td><td>{translateRole(employee.user?.role) || '—'}</td><td>{formatDate(employee.hiredAt)}</td><td><StatusBadge value={employee.user?.active ? 'ACTIVE' : 'INACTIVE'} /></td></tr>)}</tbody></table></div>
      </Panel>
    </div>
    {showEmployeeModal && <EmployeeModal onClose={() => setShowEmployeeModal(false)} onCreated={async () => { await refreshPeople(); setShowEmployeeModal(false); notify('Collaboratore aggiunto correttamente all’anagrafica aziendale.'); }} notify={notify} />}
  </>;
}

function EmployeeModal({ onClose, onCreated, notify }: { onClose: () => void; onCreated: () => Promise<void>; notify: Notify }) {
  const [masterData, setMasterData] = useState<MasterData | null>(null);
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ code: '', firstName: '', lastName: '', email: '', role: 'VIEWER', departmentId: '', jobProfileId: '', hiredAt: localDate(), temporaryPassword: '' });
  const availableRoles = ['ADMIN', 'HR', 'SUPERVISOR', 'WAREHOUSE_OPERATOR', 'RECEIVING_OPERATOR', 'VIEWER'].filter(role => auth.user?.role === 'ADMIN' || role !== 'ADMIN');
  const loadMasterData = useCallback(async () => {
    setLoading(true); setError('');
    try { setMasterData(await request('/master-data') as MasterData); } catch (error) { setError(errorMessage(error)); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadMasterData(); }, [loadMasterData]);
  function validate() {
    const code = form.code.trim(); const email = form.email.trim(); const password = form.temporaryPassword;
    if (code.length < 2 || code.length > 32) return 'Il codice collaboratore deve contenere da 2 a 32 caratteri.';
    if (!form.firstName.trim() || !form.lastName.trim()) return 'Inserisci nome e cognome del collaboratore.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Inserisci un indirizzo email aziendale valido.';
    if (!form.departmentId) return 'Seleziona un reparto di appartenenza.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.hiredAt)) return 'Inserisci una data di assunzione valida.';
    if (password.length < 12 || password.length > 128 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) return 'La password temporanea deve avere almeno 12 caratteri, con maiuscola, minuscola, numero e simbolo.';
    return '';
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setSaving(true); setError('');
    try {
      await request('/employees', { method: 'POST', body: JSON.stringify({ code: form.code.trim().toUpperCase(), firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim().toLowerCase(), role: form.role, departmentId: form.departmentId, ...(form.jobProfileId ? { jobProfileId: form.jobProfileId } : {}), hiredAt: form.hiredAt, temporaryPassword: form.temporaryPassword }) });
      await onCreated();
    } catch (error) { const message = errorMessage(error); setError(message); notify(message, 'error'); } finally { setSaving(false); }
  }
  const close = useCallback(() => { if (!saving) onClose(); }, [onClose, saving]);
  return <Modal title="Aggiungi un collaboratore" description="Crea l'anagrafica, assegna area e qualifica professionale, poi definisci l'accesso al portale." onClose={close}>
    <form className="modal-form employee-form" onSubmit={submit} noValidate>
      {error && <div className="form-message form-message--error" role="alert" aria-live="assertive"><Icon name="alert" size={16} />{error}</div>}
      {loading && <div className="form-message form-message--loading" role="status"><span className="spinner" />Caricamento reparti e profili disponibili…</div>}
      <div className="form-grid">
        <label htmlFor="employee-code">Codice collaboratore<input id="employee-code" value={form.code} onChange={event => setForm({ ...form, code: event.target.value.toUpperCase() })} placeholder="Es. OPS-024" minLength={2} maxLength={32} autoComplete="off" disabled={saving} required /></label>
        <label htmlFor="employee-hired-at">Data di assunzione<input id="employee-hired-at" type="date" value={form.hiredAt} onChange={event => setForm({ ...form, hiredAt: event.target.value })} disabled={saving} required /></label>
        <label htmlFor="employee-first-name">Nome<input id="employee-first-name" value={form.firstName} onChange={event => setForm({ ...form, firstName: event.target.value })} maxLength={80} autoComplete="given-name" disabled={saving} required /></label>
        <label htmlFor="employee-last-name">Cognome<input id="employee-last-name" value={form.lastName} onChange={event => setForm({ ...form, lastName: event.target.value })} maxLength={80} autoComplete="family-name" disabled={saving} required /></label>
        <label className="field--full" htmlFor="employee-email">Email aziendale<input id="employee-email" type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} placeholder="nome.cognome@azienda.it" maxLength={254} autoComplete="email" disabled={saving} required /></label>
        <label htmlFor="employee-department">Area / reparto aziendale<select id="employee-department" value={form.departmentId} onChange={event => setForm({ ...form, departmentId: event.target.value })} disabled={loading || saving} required><option value="" disabled>Seleziona ufficio o reparto</option>{masterData?.departments.map(department => <option key={department.id} value={department.id}>{department.code} · {department.name}</option>)}</select><span className="field-help">Uffici, direzione, operations e logistica.</span></label>
        <label htmlFor="employee-profile">Qualifica / mansione <span className="optional">consigliata</span><select id="employee-profile" value={form.jobProfileId} onChange={event => setForm({ ...form, jobProfileId: event.target.value })} disabled={loading || saving}><option value="">Da definire successivamente</option>{masterData?.profiles.map(profile => <option key={profile.id} value={profile.id}>{profile.code} · {profile.title}</option>)}</select><span className="field-help">Esempi: impiegato, HR, IT, operaio, addetto logistico, direttivo.</span></label>
        <label htmlFor="employee-role">Ruolo di accesso al portale<select id="employee-role" value={form.role} onChange={event => setForm({ ...form, role: event.target.value })} disabled={saving}>{availableRoles.map(role => <option key={role} value={role}>{translateRole(role)}</option>)}</select><span className="field-help">Definisce i permessi software, non la qualifica professionale.</span></label>
        <div className="form-field"><label htmlFor="employee-password">Password temporanea</label><div className="password-field"><input id="employee-password" type={showPassword ? 'text' : 'password'} value={form.temporaryPassword} onChange={event => setForm({ ...form, temporaryPassword: event.target.value })} minLength={12} maxLength={128} autoComplete="new-password" aria-describedby="employee-password-help" disabled={saving} required /><button type="button" onClick={() => setShowPassword(value => !value)} disabled={saving}>{showPassword ? 'Nascondi' : 'Mostra'}</button></div><span className="field-help" id="employee-password-help">Min. 12 caratteri: maiuscola, minuscola, numero e simbolo.</span></div>
      </div>
      <div className="modal-actions"><Button type="button" className="button--tertiary" onClick={close} disabled={saving}>Annulla</Button><Button type="submit" className="button--primary" disabled={loading || saving}>{saving ? <><span className="spinner spinner--light" />Creazione…</> : <>Crea collaboratore <Icon name="arrow" size={16} /></>}</Button></div>
    </form>
  </Modal>;
}

function Shifts({ notify }: { notify: Notify }) {
  const { data: rows, loading, error, reload } = useResource<any[]>('/shifts');
  const directory = useResource<any[]>('/employees');
  const organization = useResource<MasterData>('/master-data');
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({ search: '', departmentId: '', profileId: '', status: '' });
  const employeesById = new Map((directory.data || []).map(employee => [employee.id, employee]));
  const enrichShift = (shift: any) => {
    const directoryEmployee = employeesById.get(shift.employeeId || shift.employee?.id);
    return {
      ...shift,
      employee: {
        ...(directoryEmployee || {}),
        ...(shift.employee || {}),
        department: shift.employee?.department || directoryEmployee?.department,
        jobProfile: shift.employee?.jobProfile || directoryEmployee?.jobProfile,
      },
    };
  };
  const plannedRows = (rows || []).map(enrichShift);
  const uniqueById = (items: any[]) => Array.from(new Map(items.filter(Boolean).map(item => [item.id, item])).values()) as any[];
  const departmentOptions = organization.data?.departments?.length ? organization.data.departments : uniqueById(plannedRows.map(shift => shift.employee?.department));
  const profileOptions = organization.data?.profiles?.length ? organization.data.profiles : uniqueById(plannedRows.map(shift => shift.employee?.jobProfile));
  const statusOptions = Array.from(new Set(plannedRows.map(shift => shift.status).filter(Boolean)));
  const searchTerm = filters.search.trim().toLocaleLowerCase('it-IT');
  const visibleRows = plannedRows.filter(shift => {
    const employee = shift.employee;
    const searchable = [employee?.user?.firstName, employee?.user?.lastName, employee?.code, employee?.department?.name, employee?.department?.code, employee?.jobProfile?.title, employee?.jobProfile?.code].filter(Boolean).join(' ').toLocaleLowerCase('it-IT');
    return (!searchTerm || searchable.includes(searchTerm))
      && (!filters.departmentId || employee?.department?.id === filters.departmentId)
      && (!filters.profileId || employee?.jobProfile?.id === filters.profileId)
      && (!filters.status || shift.status === filters.status);
  });
  const hasFilters = Boolean(filters.search || filters.departmentId || filters.profileId || filters.status);
  const resetFilters = () => setFilters({ search: '', departmentId: '', profileId: '', status: '' });
  return <>
    <PageHeader eyebrow="WORKFORCE PLANNING" title="Pianificazione turni" description="Copertura dei reparti, degli uffici e delle qualifiche professionali nei prossimi sette giorni.">
      <Button type="button" className="button--primary" onClick={() => setShowModal(true)}><Icon name="plus" size={16} />Assegna turno</Button>
      <Button type="button" className="button--icon button--secondary" aria-label="Aggiorna turni" onClick={reload} disabled={loading}><Icon name="refresh" size={17} /></Button>
    </PageHeader>
    <section className="planning-filters" aria-label="Filtri pianificazione turni">
      <div className="planning-filters__intro"><span className="planning-filters__kicker">VISTA ORGANIZZATIVA</span><strong>Filtra per area e qualifica</strong><p>Confronta rapidamente uffici, operations e ruoli professionali assegnati.</p></div>
      <div className="planning-filters__controls">
        <label className="planning-filter planning-filter--search"><span>Cerca collaboratore</span><input type="search" value={filters.search} onChange={event => setFilters({ ...filters, search: event.target.value })} placeholder="Nome, reparto o qualifica" /></label>
        <label className="planning-filter"><span>Area / reparto</span><select value={filters.departmentId} onChange={event => setFilters({ ...filters, departmentId: event.target.value })}><option value="">Tutti i reparti</option>{departmentOptions.map(department => <option key={department.id} value={department.id}>{department.code} · {department.name}</option>)}</select></label>
        <label className="planning-filter"><span>Qualifica / mansione</span><select value={filters.profileId} onChange={event => setFilters({ ...filters, profileId: event.target.value })}><option value="">Tutte le qualifiche</option>{profileOptions.map(profile => <option key={profile.id} value={profile.id}>{profile.code} · {profile.title}</option>)}</select></label>
        <label className="planning-filter"><span>Stato piano</span><select value={filters.status} onChange={event => setFilters({ ...filters, status: event.target.value })}><option value="">Tutti gli stati</option>{statusOptions.map(status => <option key={status} value={status}>{friendlyStatus(status)}</option>)}</select></label>
        {hasFilters && <Button type="button" className="button--tertiary planning-filters__reset" onClick={resetFilters}>Azzera filtri</Button>}
      </div>
    </section>
    <Panel title="Turni programmati" subtitle="ORIZZONTE 7 GIORNI" meta={<span className="count-badge">{hasFilters ? `${visibleRows.length} di ${plannedRows.length}` : plannedRows.length} assegnazioni</span>}>
      <div className="table-wrap"><table className="shift-table"><thead><tr><th>Data</th><th>Collaboratore</th><th>Area / reparto</th><th>Qualifica / mansione</th><th>Turno</th><th>Fascia</th><th>Stato</th></tr></thead><tbody>{loading || error || !rows?.length ? <TableState loading={loading} error={error} colSpan={7} onRetry={reload} emptyTitle="Nessun turno pianificato" emptyText="Crea una nuova assegnazione per iniziare la pianificazione." /> : !visibleRows.length ? <tr><td colSpan={7}><div className="table-state"><span><b>Nessun turno corrisponde ai filtri</b><span>Modifica i criteri di ricerca oppure ripristina la vista completa.</span></span><Button type="button" className="button--secondary button--small" onClick={resetFilters}>Azzera filtri</Button></div></td></tr> : visibleRows.map(shift => <tr key={shift.id}><td className="date-cell">{formatDate(shift.date, true)}</td><td><strong>{shift.employee?.user?.firstName} {shift.employee?.user?.lastName}</strong><small>{shift.employee?.code || shift.employee?.user?.email || '—'}</small></td><td><DepartmentBadge department={shift.employee?.department} /></td><td><ProfessionalBadge profile={shift.employee?.jobProfile} /></td><td><span className="shift-name"><i style={{ backgroundColor: shift.template?.color || '#4361ee' }} />{shift.template?.name || '—'}</span></td><td>{shift.template?.startsAt} <span className="muted">—</span> {shift.template?.endsAt}</td><td><StatusBadge value={shift.status} /></td></tr>)}</tbody></table></div>
    </Panel>
    {showModal && <ShiftModal onClose={() => setShowModal(false)} onCreated={async () => { setShowModal(false); await reload(); notify('Turno assegnato e pubblicato nel piano.'); }} notify={notify} />}
  </>;
}

function ShiftModal({ onClose, onCreated, notify }: { onClose: () => void; onCreated: () => Promise<void>; notify: Notify }) {
  const [employees, setEmployees] = useState<any[]>([]); const [templates, setTemplates] = useState<any[]>([]); const [error, setError] = useState(''); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [form, setForm] = useState({ employeeId: '', templateId: '', date: localDate(), status: 'PUBLISHED' });
  useEffect(() => { void Promise.all([request('/employees'), request('/shift-templates')]).then(([employeeData, templateData]) => { setEmployees(employeeData); setTemplates(templateData); setForm(current => ({ ...current, employeeId: current.employeeId || employeeData[0]?.id || '', templateId: current.templateId || templateData[0]?.id || '' })); }).catch(error => setError(errorMessage(error))).finally(() => setLoading(false)); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); setError(''); try { await request('/shifts', { method: 'POST', body: JSON.stringify(form) }); await onCreated(); } catch (error) { const message = errorMessage(error); setError(message); notify(message, 'error'); } finally { setSaving(false); } }
  const selectedEmployee = employees.find(employee => employee.id === form.employeeId);
  return <Modal title="Assegna un turno" description="Pianifica la copertura considerando area aziendale, qualifica e fascia oraria." onClose={onClose}><form className="modal-form" onSubmit={submit}>{error && <div className="form-message form-message--error" role="alert"><Icon name="alert" size={16} />{error}</div>}<div className="form-grid"><label className="field--full">Collaboratore<select value={form.employeeId} onChange={event => setForm({ ...form, employeeId: event.target.value })} disabled={loading || saving} required><option value="" disabled>Seleziona collaboratore</option>{employees.map(employee => <option key={employee.id} value={employee.id}>{employeeLabel(employee)}</option>)}</select></label>{selectedEmployee && <div className="assignment-context field--full"><span>Inquadramento selezionato</span><DepartmentBadge department={selectedEmployee.department} /><ProfessionalBadge profile={selectedEmployee.jobProfile} /></div>}<label>Template turno<select value={form.templateId} onChange={event => setForm({ ...form, templateId: event.target.value })} disabled={loading || saving} required><option value="" disabled>Seleziona template</option>{templates.map(template => <option key={template.id} value={template.id}>{template.name} · {template.startsAt}–{template.endsAt}</option>)}</select></label><label>Data<input type="date" value={form.date} onChange={event => setForm({ ...form, date: event.target.value })} disabled={saving} required /></label><label>Stato<select value={form.status} onChange={event => setForm({ ...form, status: event.target.value })} disabled={saving}><option value="PUBLISHED">Pubblicato</option><option value="DRAFT">Bozza</option></select></label></div><div className="modal-actions"><Button type="button" className="button--tertiary" onClick={onClose} disabled={saving}>Annulla</Button><Button type="submit" className="button--primary" disabled={loading || saving || !form.employeeId || !form.templateId}>{saving ? <><span className="spinner spinner--light" />Salvataggio…</> : <>Conferma turno <Icon name="arrow" size={16} /></>}</Button></div></form></Modal>;
}

function Tasks({ notify }: { notify: Notify }) {
  const { data: rows, loading, error, reload } = useResource<any[]>('/tasks'); const [showModal, setShowModal] = useState(false); const [busyId, setBusyId] = useState('');
  async function complete(task: any) { setBusyId(task.id); try { await request(`/tasks/${task.id}/complete`, { method: 'PATCH' }); await reload(); notify('Mansione completata e registrata.'); } catch (error) { notify(errorMessage(error), 'error'); } finally { setBusyId(''); } }
  return <><PageHeader eyebrow="STANDARD OPERATING PROCEDURES" title="Mansionario" description="Responsabilità operative, priorità e completamento delle attività assegnate."><Button type="button" className="button--primary" onClick={() => setShowModal(true)}><Icon name="plus" size={16} />Nuova mansione</Button><Button type="button" className="button--icon button--secondary" aria-label="Aggiorna mansioni" onClick={reload} disabled={loading}><Icon name="refresh" size={17} /></Button></PageHeader><Panel title="Attività operative" subtitle="ELENCO PRIORITÀ" meta={<span className="count-badge">{rows?.filter(task => !task.completedAt).length || 0} aperte</span>}><div className="table-wrap"><table><thead><tr><th>Attività</th><th>Assegnata a</th><th>Priorità</th><th>Scadenza</th><th><span className="sr-only">Stato</span></th></tr></thead><tbody>{loading || error || !rows?.length ? <TableState loading={loading} error={error} colSpan={5} onRetry={reload} emptyTitle="Nessuna mansione presente" emptyText="Crea una mansione per rendere visibili responsabilità e scadenze." /> : rows.map(task => <tr key={task.id}><td><strong>{task.title}</strong><small>{task.description || task.jobProfile?.title || 'Attività operativa'}</small></td><td>{task.employee ? `${task.employee.user?.firstName} ${task.employee.user?.lastName}` : task.jobProfile?.title || 'Non assegnata'}</td><td><StatusBadge value={task.priority} /></td><td>{formatDate(task.dueAt)}</td><td className="table-action">{task.completedAt ? <span className="completion"><Icon name="check" size={15} />Completata</span> : <Button type="button" className="button--small button--secondary" disabled={busyId === task.id} onClick={() => void complete(task)}>{busyId === task.id ? <span className="spinner" /> : <Icon name="check" size={15} />}Completa</Button>}</td></tr>)}</tbody></table></div></Panel>{showModal && <TaskModal onClose={() => setShowModal(false)} onCreated={async () => { setShowModal(false); await reload(); notify('Nuova mansione creata con successo.'); }} notify={notify} />}</>;
}

function TaskModal({ onClose, onCreated, notify }: { onClose: () => void; onCreated: () => Promise<void>; notify: Notify }) {
  const [employees, setEmployees] = useState<any[]>([]); const [profiles, setProfiles] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [form, setForm] = useState({ title: '', description: '', priority: 'NORMAL', employeeId: '', jobProfileId: '', dueAt: '' });
  useEffect(() => { void Promise.all([request('/employees'), request('/master-data') as Promise<MasterData>]).then(([employeeData, masterData]) => { setEmployees(employeeData); setProfiles(masterData.profiles || []); }).catch(error => setError(errorMessage(error))).finally(() => setLoading(false)); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); setError(''); const payload = Object.fromEntries(Object.entries(form).filter(([, value]) => value !== '')); try { await request('/tasks', { method: 'POST', body: JSON.stringify(payload) }); await onCreated(); } catch (error) { const message = errorMessage(error); setError(message); notify(message, 'error'); } finally { setSaving(false); } }
  return <Modal title="Crea una mansione" description="Definisci responsabilità, priorità e una scadenza condivisa." onClose={onClose}><form className="modal-form" onSubmit={submit}>{error && <div className="form-message form-message--error" role="alert"><Icon name="alert" size={16} />{error}</div>}<div className="form-grid"><label className="field--full">Titolo attività<input value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="Es. Verifica giacenze area A" minLength={3} maxLength={120} disabled={saving} required /></label><label className="field--full">Descrizione<textarea value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} placeholder="Istruzioni operative o contesto utile" rows={3} disabled={saving} /></label><label>Priorità<select value={form.priority} onChange={event => setForm({ ...form, priority: event.target.value })} disabled={saving}><option value="LOW">Bassa</option><option value="NORMAL">Normale</option><option value="HIGH">Alta</option><option value="URGENT">Urgente</option></select></label><label>Scadenza<input type="date" value={form.dueAt} onChange={event => setForm({ ...form, dueAt: event.target.value })} disabled={saving} /></label><label>Assegna a una persona<select value={form.employeeId} onChange={event => setForm({ ...form, employeeId: event.target.value })} disabled={loading || saving}><option value="">Nessuna assegnazione individuale</option>{employees.map(employee => <option key={employee.id} value={employee.id}>{employee.user.firstName} {employee.user.lastName}</option>)}</select></label><label>Profilo di riferimento<select value={form.jobProfileId} onChange={event => setForm({ ...form, jobProfileId: event.target.value })} disabled={loading || saving}><option value="">Nessun profilo</option>{profiles.map(profile => <option key={profile.id} value={profile.id}>{profile.title}</option>)}</select></label></div><div className="modal-actions"><Button type="button" className="button--tertiary" onClick={onClose} disabled={saving}>Annulla</Button><Button type="submit" className="button--primary" disabled={saving || loading || form.title.trim().length < 3}>{saving ? <><span className="spinner spinner--light" />Creazione…</> : <>Crea mansione <Icon name="arrow" size={16} /></>}</Button></div></form></Modal>;
}

function receiptAction(status: string) { if (status === 'DRAFT') return { label: 'Segna arrivato', target: 'ARRIVED' }; if (status === 'ARRIVED') return { label: 'Avvia controllo', target: 'CHECKING' }; if (status === 'CHECKING') return { label: 'Accetta merce', target: 'ACCEPTED' }; return null; }
function Receiving({ notify }: { notify: Notify }) {
  const { data: rows, loading, error, reload } = useResource<any[]>('/receipts'); const [showModal, setShowModal] = useState(false); const [busyId, setBusyId] = useState('');
  async function updateStatus(receipt: any) { const action = receiptAction(receipt.status); if (!action) return; setBusyId(receipt.id); try { await request(`/receipts/${receipt.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: action.target }) }); await reload(); notify(`${receipt.number}: stato aggiornato a “${friendlyStatus(action.target)}”.`); } catch (error) { notify(errorMessage(error), 'error'); } finally { setBusyId(''); } }
  return <><PageHeader eyebrow="WAREHOUSE INBOUND" title="Accettazione merci" description="Controllo documentale e avanzamento del workflow di ricevimento."><Button type="button" className="button--primary" onClick={() => setShowModal(true)}><Icon name="plus" size={16} />Preavviso arrivo</Button><Button type="button" className="button--icon button--secondary" aria-label="Aggiorna ricevimento merci" onClick={reload} disabled={loading}><Icon name="refresh" size={17} /></Button></PageHeader><Panel title="Ricevimenti" subtitle="INBOUND WORKFLOW" meta={<span className="count-badge">{rows?.filter(receipt => !['ACCEPTED', 'CLOSED', 'REJECTED'].includes(receipt.status)).length || 0} aperti</span>}><div className="table-wrap"><table><thead><tr><th>Documento</th><th>Fornitore</th><th>Arrivo previsto</th><th>Baia / vettore</th><th>Stato</th><th><span className="sr-only">Workflow</span></th></tr></thead><tbody>{loading || error || !rows?.length ? <TableState loading={loading} error={error} colSpan={6} onRetry={reload} emptyTitle="Nessun ricevimento presente" emptyText="Registra un preavviso per iniziare a tracciare una nuova consegna." /> : rows.map(receipt => { const action = receiptAction(receipt.status); return <tr key={receipt.id}><td><strong>{receipt.number}</strong><small>{receipt.purchaseOrder || 'Senza ordine di acquisto'}</small></td><td>{receipt.supplier?.name || '—'}</td><td>{formatDate(receipt.expectedAt)}</td><td><strong className="warehouse-code">{receipt.warehouse?.code || '—'}</strong><small>{receipt.carrier || 'Vettore non assegnato'}</small></td><td><StatusBadge value={receipt.status} /></td><td className="table-action">{action ? <Button type="button" className="button--small button--secondary" disabled={busyId === receipt.id} onClick={() => void updateStatus(receipt)}>{busyId === receipt.id ? <span className="spinner" /> : <Icon name="arrow" size={15} />}{action.label}</Button> : <span className="completion"><Icon name="check" size={15} />{friendlyStatus(receipt.status)}</span>}</td></tr>; })}</tbody></table></div></Panel>{showModal && <ReceiptModal onClose={() => setShowModal(false)} onCreated={async () => { setShowModal(false); await reload(); notify('Preavviso registrato nel workflow di ricevimento.'); }} notify={notify} />}</>;
}

function ReceiptModal({ onClose, onCreated, notify }: { onClose: () => void; onCreated: () => Promise<void>; notify: Notify }) {
  const [masterData, setMasterData] = useState<MasterData | null>(null); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const today = localDate().replace(/-/g, ''); const [form, setForm] = useState({ number: `ING-${today}-${Math.floor(100 + Math.random() * 900)}`, supplierId: '', warehouseId: '', expectedAt: '', carrier: '', purchaseOrder: '', itemId: '', expectedQty: '1', locationId: '' });
  useEffect(() => { void (request('/master-data') as Promise<MasterData>).then(data => { setMasterData(data); setForm(current => ({ ...current, supplierId: current.supplierId || data.suppliers[0]?.id || '', warehouseId: current.warehouseId || data.warehouses[0]?.id || '', itemId: current.itemId || data.items[0]?.id || '' })); }).catch(error => setError(errorMessage(error))).finally(() => setLoading(false)); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); setError(''); const payload = { number: form.number.trim(), supplierId: form.supplierId, warehouseId: form.warehouseId, expectedAt: form.expectedAt || undefined, carrier: form.carrier.trim() || undefined, purchaseOrder: form.purchaseOrder.trim() || undefined, lines: [{ itemId: form.itemId, expectedQty: Number(form.expectedQty), locationId: form.locationId || undefined }] }; try { await request('/receipts', { method: 'POST', body: JSON.stringify(payload) }); await onCreated(); } catch (error) { const message = errorMessage(error); setError(message); notify(message, 'error'); } finally { setSaving(false); } }
  return <Modal title="Registra preavviso arrivo" description="Crea una pratica inbound con la prima riga merce da ricevere." onClose={onClose}><form className="modal-form" onSubmit={submit}>{error && <div className="form-message form-message--error" role="alert"><Icon name="alert" size={16} />{error}</div>}<div className="form-grid"><label>Numero ricevimento<input value={form.number} onChange={event => setForm({ ...form, number: event.target.value })} minLength={2} disabled={saving} required /></label><label>Arrivo previsto<input type="datetime-local" value={form.expectedAt} onChange={event => setForm({ ...form, expectedAt: event.target.value })} disabled={saving} /></label><label>Fornitore<select value={form.supplierId} onChange={event => setForm({ ...form, supplierId: event.target.value })} disabled={loading || saving} required><option value="" disabled>Seleziona fornitore</option>{masterData?.suppliers.map(supplier => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></label><label>Magazzino<select value={form.warehouseId} onChange={event => setForm({ ...form, warehouseId: event.target.value })} disabled={loading || saving} required><option value="" disabled>Seleziona magazzino</option>{masterData?.warehouses.map(warehouse => <option key={warehouse.id} value={warehouse.id}>{warehouse.code} · {warehouse.name}</option>)}</select></label><label>Vettore<input value={form.carrier} onChange={event => setForm({ ...form, carrier: event.target.value })} placeholder="Es. Trasporti Rossi" disabled={saving} /></label><label>Ordine di acquisto<input value={form.purchaseOrder} onChange={event => setForm({ ...form, purchaseOrder: event.target.value })} placeholder="Es. ODA-2026-0042" disabled={saving} /></label><label>Articolo<select value={form.itemId} onChange={event => setForm({ ...form, itemId: event.target.value })} disabled={loading || saving} required><option value="" disabled>Seleziona articolo</option>{masterData?.items.map(item => <option key={item.id} value={item.id}>{item.sku} · {item.name}</option>)}</select></label><label>Quantità prevista<input type="number" min="0.001" step="0.001" value={form.expectedQty} onChange={event => setForm({ ...form, expectedQty: event.target.value })} disabled={saving} required /></label><label className="field--full">Ubicazione di destinazione <span className="optional">opzionale</span><select value={form.locationId} onChange={event => setForm({ ...form, locationId: event.target.value })} disabled={loading || saving}><option value="">Da definire in accettazione</option>{masterData?.locations.map(location => <option key={location.id} value={location.id}>{location.code}</option>)}</select></label></div><div className="modal-actions"><Button type="button" className="button--tertiary" onClick={onClose} disabled={saving}>Annulla</Button><Button type="submit" className="button--primary" disabled={saving || loading || !form.supplierId || !form.warehouseId || !form.itemId || Number(form.expectedQty) <= 0}>{saving ? <><span className="spinner spinner--light" />Registrazione…</> : <>Registra preavviso <Icon name="arrow" size={16} /></>}</Button></div></form></Modal>;
}

function App() {
  const { language, setLanguage } = useLanguage();
  const [logged, setLogged] = useState(Boolean(auth.token)); const [page, setPage] = useState<Page>('dashboard'); const [notice, setNotice] = useState<{ id: number; message: string; type: NoticeType } | null>(null); const notify = useCallback<Notify>((message, type = 'success') => setNotice({ id: Date.now(), message, type }), []);
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(null), 4500); return () => window.clearTimeout(timer); }, [notice]);
  if (!logged) return <Login onLogin={() => setLogged(true)} language={language} onLanguageChange={setLanguage} />;
  const View = { dashboard: Dashboard, presenze: Attendance, turni: Shifts, mansionario: Tasks, ricevimento: Receiving, comunicazioni: Communications }[page];
  return <div className="app-shell"><aside className="sidebar"><div className="sidebar__brand"><Brand /></div><LanguageSelector language={language} onLanguageChange={setLanguage} className="language-selector--sidebar" /><p className="sidebar__label">{t('navigation.label')}</p><nav aria-label={t('navigation.label')}>{pages.map(item => <button type="button" key={item.id} className={page === item.id ? 'is-active' : ''} onClick={() => setPage(item.id)}><Icon name={item.icon} size={18} /><span>{t(item.labelKey)}</span></button>)}</nav><div className="sidebar__footer"><div className="user-avatar">{auth.user?.name?.split(' ').map((part: string) => part[0]).join('').slice(0, 2) || 'NE'}</div><div className="user-meta"><strong>{auth.user?.name || t('common.user')}</strong><span>{translateRole(auth.user?.role) || auth.user?.role}</span></div><button type="button" className="logout" aria-label={t('common.logout')} onClick={() => { localStorage.removeItem('nexus-token'); localStorage.removeItem('nexus-user'); window.location.reload(); }}><Icon name="logout" size={17} /></button></div></aside><main className="content"><View notify={notify} /></main>{notice && <div className={`toast toast--${notice.type}`} role="status" key={notice.id}><Icon name={notice.type === 'success' ? 'check' : 'alert'} size={18} /><span>{notice.message}</span><button type="button" aria-label={t('common.messageClose')} onClick={() => setNotice(null)}><Icon name="close" size={15} /></button></div>}</div>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
