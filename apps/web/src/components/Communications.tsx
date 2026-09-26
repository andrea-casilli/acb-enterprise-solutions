import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { request } from '../api';
import { translate } from '../i18n';

type NoticeType = 'success' | 'error';
type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
type CommunicationStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

type Department = { id: string; code?: string; name?: string };
type DepartmentReference = Department | string;
type CommunicationAuthor = { firstName?: string; lastName?: string; name?: string; email?: string; role?: string } | string;

type CommunicationMessage = {
  id: string;
  message?: string;
  content?: string;
  body?: string;
  createdAt?: string;
  createdBy?: CommunicationAuthor | null;
  author?: CommunicationAuthor | null;
  user?: CommunicationAuthor | null;
};

type Communication = {
  id: string;
  reference?: string;
  title?: string;
  subject?: string;
  message?: string;
  body?: string;
  content?: string;
  kind?: string;
  priority?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  closedAt?: string | null;
  threadMessageCount?: number;
  recipientDepartment?: DepartmentReference | null;
  toDepartment?: DepartmentReference | null;
  targetDepartment?: DepartmentReference | null;
  senderDepartment?: DepartmentReference | null;
  fromDepartment?: DepartmentReference | null;
  createdBy?: CommunicationAuthor | null;
  author?: CommunicationAuthor | null;
  user?: CommunicationAuthor | null;
};

type CommunicationDetail = Communication & { messages: CommunicationMessage[] };

export type CommunicationsProps = {
  notify?: (message: string, type?: NoticeType) => void;
  onLoadingChange?: (loading: boolean) => void;
  onError?: (message: string) => void;
};

const PRIORITIES: Array<{ value: Priority; label: string; description: string }> = [
  { value: 'LOW', label: 'Bassa', description: 'Nessuna scadenza immediata' },
  { value: 'NORMAL', label: 'Normale', description: 'Gestione ordinaria' },
  { value: 'HIGH', label: 'Alta', description: 'Richiede presa in carico rapida' },
  { value: 'URGENT', label: 'Urgente', description: 'Da presidiare con priorità' },
];

const STATUS_ACTIONS: Record<CommunicationStatus, Array<{ value: CommunicationStatus; label: string }>> = {
  OPEN: [
    { value: 'IN_PROGRESS', label: 'Prendi in carico' },
    { value: 'RESOLVED', label: 'Segna come risolta' },
    { value: 'CLOSED', label: 'Chiudi conversazione' },
  ],
  IN_PROGRESS: [
    { value: 'OPEN', label: 'Riapri richiesta' },
    { value: 'RESOLVED', label: 'Segna come risolta' },
    { value: 'CLOSED', label: 'Chiudi conversazione' },
  ],
  RESOLVED: [
    { value: 'IN_PROGRESS', label: 'Riapri in lavorazione' },
    { value: 'CLOSED', label: 'Chiudi conversazione' },
  ],
  CLOSED: [],
};

const priorityOrder: Record<string, number> = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };
const priorityLabels: Record<string, string> = Object.fromEntries(PRIORITIES.map((priority) => [priority.value, priority.label]));
const statusLabels: Record<string, string> = { OPEN: 'Aperta', IN_PROGRESS: 'In lavorazione', RESOLVED: 'Risolta', CLOSED: 'Chiusa' };

function errorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : translate('common.errorFallback');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function communicationList(payload: unknown): Communication[] {
  if (Array.isArray(payload)) return payload as Communication[];
  if (!isRecord(payload)) return [];
  const candidates = [payload.communications, payload.items, payload.data, payload.requests];
  return (candidates.find(Array.isArray) || []) as Communication[];
}

function communicationDetail(payload: unknown): CommunicationDetail | null {
  if (!isRecord(payload) || typeof payload.id !== 'string') return null;
  const messages = Array.isArray(payload.messages)
    ? payload.messages.filter((message): message is CommunicationMessage => isRecord(message) && typeof message.id === 'string') as CommunicationMessage[]
    : [];
  return { ...(payload as Communication), messages };
}

function communicationMessage(payload: unknown): CommunicationMessage | null {
  return isRecord(payload) && typeof payload.id === 'string' ? payload as CommunicationMessage : null;
}

function communicationResponse(payload: unknown): Communication | null {
  return isRecord(payload) && typeof payload.id === 'string' ? payload as Communication : null;
}

function departmentList(payload: unknown): Department[] {
  if (!isRecord(payload) || !Array.isArray(payload.departments)) return [];
  return payload.departments.filter((department): department is Department => isRecord(department) && typeof department.id === 'string');
}

function normalizePriority(value?: string): Priority {
  return value && value in priorityLabels ? value as Priority : 'NORMAL';
}

function normalizeStatus(value?: string): CommunicationStatus {
  return value && value in STATUS_ACTIONS ? value as CommunicationStatus : 'OPEN';
}

function statusLabel(value?: string) {
  return value ? statusLabels[value] || value.replace(/_/g, ' ') : 'Aperta';
}

function statusTone(value?: string) {
  if (['RESOLVED', 'CLOSED'].includes(value || '')) return 'complete';
  if (value === 'IN_PROGRESS') return 'active';
  return 'open';
}

function departmentName(department?: DepartmentReference | null) {
  if (!department) return 'Reparto non indicato';
  return typeof department === 'string' ? department : department.name || department.code || 'Reparto non indicato';
}

function recipientOf(item: Communication) { return item.recipientDepartment || item.toDepartment || item.targetDepartment; }
function senderOf(item: Communication) { return item.senderDepartment || item.fromDepartment; }

function personName(person?: CommunicationAuthor | null) {
  if (!person) return 'Utente interno';
  if (typeof person === 'string') return person;
  return person.name || `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Utente interno';
}

function authorName(item: Communication) { return personName(item.createdBy || item.author || item.user); }
function messageAuthorName(message: CommunicationMessage) { return personName(message.createdBy || message.author || message.user); }

function formatTimestamp(value?: string) {
  if (!value) return 'Data non disponibile';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data non disponibile';
  return new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

function communicationTitle(item: Communication) { return item.title || item.subject || 'Richiesta senza titolo'; }
function communicationBody(item: Pick<Communication, 'message' | 'body' | 'content'>) { return item.message || item.content || item.body || 'Nessun dettaglio aggiuntivo.'; }
function messageBody(message: CommunicationMessage) { return message.message || message.content || message.body || 'Messaggio non disponibile.'; }
function communicationReference(item: Communication) { return item.reference || `#${item.id.slice(-8).toUpperCase()}`; }

function Icon({ name }: { name: 'plus' | 'refresh' | 'mail' | 'alert' | 'close' | 'arrow' }) {
  const paths = {
    plus: <path d="M12 5v14M5 12h14" />,
    refresh: <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 5v4h4M4 13a8.1 8.1 0 0 0 15.5 2M20 19v-4h-4" />,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    alert: <><path d="M10.3 3.9 1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></>,
    close: <path d="M18 6 6 18M6 6l12 12" />,
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  } as const;
  return <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function Modal({ onClose, children, labelledBy, describedBy, className = '' }: { onClose: () => void; children: ReactNode; labelledBy: string; describedBy?: string; className?: string }) {
  const dialogRef = useRef<HTMLElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const dialogId = useId();
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => {
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => {
      const target = dialog?.querySelector<HTMLElement>('[data-modal-autofocus]');
      (target || dialog)?.focus();
    }, 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onCloseRef.current(); return; }
      if (event.key !== 'Tab' || !dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) { event.preventDefault(); dialog.focus(); return; }
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => { window.clearTimeout(focusTimer); window.removeEventListener('keydown', onKeyDown); document.body.style.overflow = previousOverflow; restoreFocusRef.current?.focus(); };
  }, []);
  return <div className="communications-modal-backdrop" role="presentation" onMouseDown={onClose}>
    <section ref={dialogRef} id={dialogId} className={`communications-modal ${className}`.trim()} role="dialog" aria-modal="true" aria-labelledby={labelledBy} aria-describedby={describedBy} tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}>{children}</section>
  </div>;
}

export default function Communications({ notify, onLoadingChange, onError }: CommunicationsProps) {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showComposer, setShowComposer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ recipientDepartmentId: '', title: '', message: '', priority: 'NORMAL' as Priority });
  const [formError, setFormError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedCommunication, setSelectedCommunication] = useState<CommunicationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [reply, setReply] = useState('');
  const [replyError, setReplyError] = useState('');
  const [replying, setReplying] = useState(false);
  const [statusTarget, setStatusTarget] = useState<CommunicationStatus | ''>('');
  const [statusSaving, setStatusSaving] = useState(false);
  const titleInput = useRef<HTMLInputElement>(null);
  const detailRequestVersion = useRef(0);
  const notifyRef = useRef(notify);
  const loadingRef = useRef(onLoadingChange);
  const errorRef = useRef(onError);

  useEffect(() => { notifyRef.current = notify; }, [notify]);
  useEffect(() => { loadingRef.current = onLoadingChange; }, [onLoadingChange]);
  useEffect(() => { errorRef.current = onError; }, [onError]);
  useEffect(() => () => { detailRequestVersion.current += 1; }, []);

  const setLoadingState = useCallback((nextLoading: boolean) => { setLoading(nextLoading); loadingRef.current?.(nextLoading); }, []);
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoadingState(true);
    setError('');
    try {
      const [communicationsResponse, masterDataResponse] = await Promise.all([request('/communications'), request('/master-data')]);
      setCommunications(communicationList(communicationsResponse));
      setDepartments(departmentList(masterDataResponse));
    } catch (cause) {
      const message = errorMessage(cause);
      setError(message); errorRef.current?.(message);
      if (!silent) notifyRef.current?.(message, 'error');
    } finally { if (!silent) setLoadingState(false); }
  }, [setLoadingState]);

  const loadDetail = useCallback(async (id: string) => {
    const version = detailRequestVersion.current + 1;
    detailRequestVersion.current = version;
    setSelectedId(id); setSelectedCommunication(null); setDetailLoading(true); setDetailError(''); setReply(''); setReplyError(''); setStatusTarget('');
    try {
      const payload = await request(`/communications/${encodeURIComponent(id)}`);
      const detail = communicationDetail(payload);
      if (!detail) throw new Error('Il dettaglio della conversazione non è disponibile.');
      if (detailRequestVersion.current !== version) return;
      setSelectedCommunication(detail);
      setStatusTarget(STATUS_ACTIONS[normalizeStatus(detail.status)][0]?.value || '');
    } catch (cause) {
      if (detailRequestVersion.current !== version) return;
      const message = errorMessage(cause);
      setDetailError(message); errorRef.current?.(message); notifyRef.current?.(message, 'error');
    } finally { if (detailRequestVersion.current === version) setDetailLoading(false); }
  }, []);

  const closeComposer = useCallback(() => { if (!submitting) setShowComposer(false); }, [submitting]);
  const closeDetail = useCallback(() => {
    if (replying || statusSaving) return;
    detailRequestVersion.current += 1;
    setSelectedId(null); setSelectedCommunication(null); setDetailLoading(false); setDetailError(''); setReply(''); setReplyError(''); setStatusTarget('');
  }, [replying, statusSaving]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!showComposer) return;
    const timer = window.setTimeout(() => titleInput.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [showComposer]);

  const visibleCommunications = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('it-IT');
    return communications
      .filter((item) => filter === 'ALL' || normalizePriority(item.priority) === filter)
      .filter((item) => !query || [communicationTitle(item), communicationBody(item), departmentName(recipientOf(item)), departmentName(senderOf(item)), authorName(item)].some((value) => value.toLocaleLowerCase('it-IT').includes(query)))
      .sort((left, right) => {
        const priority = priorityOrder[normalizePriority(left.priority)] - priorityOrder[normalizePriority(right.priority)];
        return priority || new Date(right.updatedAt || right.createdAt || 0).getTime() - new Date(left.updatedAt || left.createdAt || 0).getTime();
      });
  }, [communications, filter, search]);

  const openCount = communications.filter((item) => !['CLOSED', 'RESOLVED'].includes(item.status || 'OPEN')).length;
  const urgentCount = communications.filter((item) => ['URGENT', 'HIGH'].includes(normalizePriority(item.priority))).length;
  const selectedStatus = selectedCommunication ? normalizeStatus(selectedCommunication.status) : 'OPEN';
  const availableStatusActions = selectedCommunication ? STATUS_ACTIONS[selectedStatus] : [];
  const isDetailBusy = replying || statusSaving;

  function openComposer() { setForm({ recipientDepartmentId: '', title: '', message: '', priority: 'NORMAL' }); setFormError(''); setShowComposer(true); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const recipientDepartmentId = form.recipientDepartmentId.trim(); const title = form.title.trim(); const message = form.message.trim();
    if (!recipientDepartmentId || !title || !message) { setFormError('Indica reparto destinatario, titolo e messaggio prima di inviare la richiesta.'); return; }
    setSubmitting(true); setFormError('');
    try {
      await request('/communications', { method: 'POST', body: JSON.stringify({ recipientDepartmentId, title, message, priority: form.priority }) });
      setShowComposer(false); notifyRef.current?.('Richiesta interna inviata al reparto selezionato.', 'success'); await load(true);
    } catch (cause) {
      const messageText = errorMessage(cause); setFormError(messageText); errorRef.current?.(messageText); notifyRef.current?.(messageText, 'error');
    } finally { setSubmitting(false); }
  }

  async function submitReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = reply.trim(); const detail = selectedCommunication;
    if (!selectedId || !detail || selectedStatus === 'CLOSED') return;
    if (!content) { setReplyError('Inserisci un messaggio prima di inviare la risposta.'); return; }
    setReplying(true); setReplyError('');
    try {
      const payload = await request(`/communications/${encodeURIComponent(selectedId)}/messages`, { method: 'POST', body: JSON.stringify({ message: content }) });
      const createdMessage = communicationMessage(payload);
      if (!createdMessage) throw new Error('La risposta è stata registrata ma non può essere visualizzata. Aggiorna la conversazione.');
      setSelectedCommunication((current) => !current || current.id !== selectedId ? current : {
        ...current,
        updatedAt: createdMessage.createdAt || new Date().toISOString(),
        threadMessageCount: (current.threadMessageCount || current.messages.length) + 1,
        messages: [...current.messages, createdMessage],
      });
      setReply(''); notifyRef.current?.('Risposta interna inviata nella conversazione.', 'success'); await load(true);
    } catch (cause) {
      const message = errorMessage(cause); setReplyError(message); errorRef.current?.(message); notifyRef.current?.(message, 'error');
    } finally { setReplying(false); }
  }

  async function updateStatus() {
    const detail = selectedCommunication;
    if (!detail || !selectedId || !statusTarget || !availableStatusActions.some((action) => action.value === statusTarget)) return;
    setStatusSaving(true); setDetailError('');
    try {
      const payload = await request(`/communications/${encodeURIComponent(selectedId)}/status`, { method: 'PATCH', body: JSON.stringify({ status: statusTarget }) });
      const updated = communicationResponse(payload);
      if (!updated) throw new Error('Lo stato è stato aggiornato ma la risposta del server non è valida. Aggiorna la conversazione.');
      setSelectedCommunication((current) => current?.id === selectedId ? { ...current, ...updated, messages: current.messages } : current);
      setCommunications((current) => current.map((item) => item.id === selectedId ? { ...item, ...updated } : item));
      setStatusTarget(STATUS_ACTIONS[normalizeStatus(updated.status)][0]?.value || '');
      notifyRef.current?.(`Stato aggiornato: ${statusLabel(updated.status)}.`, 'success'); await load(true);
    } catch (cause) {
      const message = errorMessage(cause); setDetailError(message); errorRef.current?.(message); notifyRef.current?.(message, 'error');
    } finally { setStatusSaving(false); }
  }

  return <section className="communications" aria-labelledby="communications-title">
    <header className="communications__header">
      <div><p className="communications__eyebrow">{translate('communications.eyebrow')}</p><h1 id="communications-title">{translate('communications.title')}</h1><p className="communications__description">{translate('communications.description')}</p></div>
      <div className="communications__actions"><button className="communications-button communications-button--secondary" type="button" onClick={() => void load()} disabled={loading}><Icon name="refresh" /> {translate('common.refresh')}</button><button className="communications-button communications-button--primary" type="button" onClick={openComposer} disabled={loading || departments.length === 0}><Icon name="plus" /> {translate('communications.compose')}</button></div>
    </header>

    <section className="communications__summary" aria-label="Riepilogo richieste interne"><article className="communications-stat"><span>Richieste aperte</span><strong>{loading ? '—' : openCount}</strong><small>Da prendere in carico</small></article><article className="communications-stat communications-stat--attention"><span>Priorità elevate</span><strong>{loading ? '—' : urgentCount}</strong><small>Alta o urgente</small></article><article className="communications-stat"><span>Reparti collegati</span><strong>{loading ? '—' : departments.length}</strong><small>Anagrafiche disponibili</small></article></section>

    {error && <div className="communications-alert" role="alert"><Icon name="alert" /><div><strong>{translate('common.unableToLoad')}</strong><span>{error}</span></div><button type="button" onClick={() => void load()}>{translate('common.retry')}</button></div>}

    <section className="communications-panel" aria-labelledby="requests-title">
      <div className="communications-panel__header"><div><p className="communications__eyebrow">{translate('communications.inbox')}</p><h2 id="requests-title">{translate('communications.requests')}</h2></div><span className="communications-count">{loading ? '…' : `${visibleCommunications.length} ${visibleCommunications.length === 1 ? 'richiesta' : 'richieste'}`}</span></div>
      <div className="communications-toolbar"><label><span className="communications-toolbar__label">Cerca</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Titolo, reparto o richiedente" aria-label="Cerca richieste" /></label><label><span className="communications-toolbar__label">Priorità</span><select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filtra per priorità"><option value="ALL">Tutte le priorità</option>{PRIORITIES.map((priority) => <option key={priority.value} value={priority.value}>{priority.label}</option>)}</select></label></div>
      <div className="communications-list" aria-live="polite">
        {loading ? <div className="communications-state"><span className="communications-spinner" />{translate('common.loading')}</div>
          : visibleCommunications.length === 0 ? <div className="communications-empty"><Icon name="mail" /><strong>Nessuna richiesta da mostrare</strong><span>{communications.length ? 'Modifica i filtri per visualizzare altre richieste.' : 'Invia la prima richiesta a un reparto per avviare il flusso interno.'}</span>{!communications.length && departments.length > 0 && <button className="communications-link" type="button" onClick={openComposer}>Crea richiesta</button>}</div>
          : visibleCommunications.map((item) => {
            const priority = normalizePriority(item.priority); const status = item.status || 'OPEN'; const threadCount = item.threadMessageCount || 0;
            return <article className="communication-card" key={item.id}>
              <button className="communication-card__open" type="button" onClick={() => void loadDetail(item.id)} aria-label={`Apri conversazione: ${communicationTitle(item)}`}><span className="sr-only">Apri conversazione: {communicationTitle(item)}</span></button>
              <div className="communication-card__priority"><span className={`communication-priority communication-priority--${priority.toLocaleLowerCase('it-IT')}`}>{priorityLabels[priority]}</span><span className={`communication-status communication-status--${statusTone(status)}`}>{statusLabel(status)}</span></div>
              <div className="communication-card__main"><h3>{communicationTitle(item)}</h3><p>{communicationBody(item)}</p></div>
              <dl className="communication-card__meta"><div><dt>Destinatario</dt><dd>{departmentName(recipientOf(item))}</dd></div><div><dt>Richiedente</dt><dd>{authorName(item)}{senderOf(item) ? ` · ${departmentName(senderOf(item))}` : ''}</dd></div><div><dt>Conversazione</dt><dd>{threadCount ? `${threadCount} ${threadCount === 1 ? 'risposta' : 'risposte'}` : 'Nessuna risposta'}</dd></div></dl>
              <span className="communication-card__arrow" aria-hidden="true"><Icon name="arrow" /></span>
            </article>;
          })}
      </div>
    </section>

    {showComposer && <Modal onClose={closeComposer} labelledBy="new-communication-title" describedBy="new-communication-description">
      <header className="communications-modal__header"><div><p className="communications__eyebrow">{translate('communications.eyebrow')}</p><h2 id="new-communication-title">{translate('communications.compose')}</h2><p id="new-communication-description">La richiesta sarà visibile nel centro comunicazioni del reparto destinatario.</p></div><button className="communications-icon-button" data-modal-autofocus type="button" aria-label={translate('common.close')} onClick={closeComposer} disabled={submitting}><Icon name="close" /></button></header>
      <form className="communications-form" onSubmit={(event) => void submit(event)}><div className="communications-form__grid"><label className="communications-form__field communications-form__field--full"><span>Reparto destinatario</span><select value={form.recipientDepartmentId} onChange={(event) => setForm((current) => ({ ...current, recipientDepartmentId: event.target.value }))} disabled={submitting} required><option value="">Seleziona il reparto</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.code ? `${department.code} · ` : ''}{departmentName(department)}</option>)}</select></label><label className="communications-form__field communications-form__field--full"><span>Titolo</span><input ref={titleInput} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} disabled={submitting} maxLength={160} placeholder="Es. Conferma disponibilità per inventario" required /></label><label className="communications-form__field communications-form__field--full"><span>Messaggio</span><textarea value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} disabled={submitting} maxLength={5000} placeholder="Descrivi il contesto, l’azione richiesta e l’eventuale scadenza." required /></label><fieldset className="communications-form__field communications-form__field--full"><legend>Priorità</legend><div className="communications-priority-options">{PRIORITIES.map((priority) => <label key={priority.value} className={`communications-priority-option${form.priority === priority.value ? ' is-selected' : ''}`}><input type="radio" name="communication-priority" value={priority.value} checked={form.priority === priority.value} onChange={() => setForm((current) => ({ ...current, priority: priority.value }))} disabled={submitting} /><span><b>{priority.label}</b><small>{priority.description}</small></span></label>)}</div></fieldset></div>{formError && <div className="communications-form__error" role="alert"><Icon name="alert" />{formError}</div>}<footer className="communications-form__actions"><button className="communications-button communications-button--secondary" type="button" onClick={closeComposer} disabled={submitting}>{translate('common.cancel')}</button><button className="communications-button communications-button--primary" type="submit" disabled={submitting || departments.length === 0}>{submitting ? <><span className="communications-spinner communications-spinner--light" />Invio in corso…</> : <>{translate('communications.compose')} <Icon name="arrow" /></>}</button></footer></form>
    </Modal>}

    {selectedId && <Modal onClose={closeDetail} labelledBy="communication-detail-title" describedBy="communication-detail-description" className="communications-modal--detail">
      <header className="communications-modal__header communications-thread__header"><div><p className="communications__eyebrow">CONVERSAZIONE INTERNA</p><h2 id="communication-detail-title">{selectedCommunication ? communicationTitle(selectedCommunication) : 'Dettaglio conversazione'}</h2><p id="communication-detail-description">Thread interno tra reparti. Le risposte restano nel portale e non inviano e-mail esterne.</p></div><button className="communications-icon-button" data-modal-autofocus type="button" aria-label={translate('common.close')} onClick={closeDetail} disabled={isDetailBusy}><Icon name="close" /></button></header>
      {detailLoading ? <div className="communications-thread__state" role="status"><span className="communications-spinner" />{translate('common.loading')}</div>
        : detailError ? <div className="communications-thread__state communications-thread__state--error" role="alert"><Icon name="alert" /><div><strong>{translate('common.unableToLoad')}</strong><span>{detailError}</span></div><button className="communications-button communications-button--secondary" type="button" onClick={() => void loadDetail(selectedId)} disabled={isDetailBusy}>{translate('common.retry')}</button></div>
          : !selectedCommunication ? <div className="communications-thread__state"><Icon name="mail" />Dettaglio conversazione non disponibile.</div>
            : <div className="communications-thread">
              <div className="communications-thread__overview"><div className="communications-thread__badges"><span className={`communication-priority communication-priority--${normalizePriority(selectedCommunication.priority).toLocaleLowerCase('it-IT')}`}>{priorityLabels[normalizePriority(selectedCommunication.priority)]}</span><span className={`communication-status communication-status--${statusTone(selectedCommunication.status)}`}>{statusLabel(selectedCommunication.status)}</span></div><dl className="communications-thread__metadata"><div><dt>Riferimento</dt><dd>{communicationReference(selectedCommunication)}</dd></div><div><dt>Da</dt><dd>{departmentName(senderOf(selectedCommunication))}</dd></div><div><dt>A</dt><dd>{departmentName(recipientOf(selectedCommunication))}</dd></div><div><dt>Aperta da</dt><dd>{authorName(selectedCommunication)}</dd></div><div><dt>Ultimo aggiornamento</dt><dd>{formatTimestamp(selectedCommunication.updatedAt || selectedCommunication.createdAt)}</dd></div></dl></div>
              <section className="communications-thread__history" aria-labelledby="communications-thread-history-title" aria-live="polite"><div className="communications-thread__section-heading"><div><p className="communications__eyebrow">CRONOLOGIA</p><h3 id="communications-thread-history-title">Messaggi della conversazione</h3></div><span>{selectedCommunication.messages.length + 1} {selectedCommunication.messages.length ? 'messaggi' : 'messaggio'}</span></div><article className="communications-thread-message communications-thread-message--initial"><div className="communications-thread-message__meta"><strong>{authorName(selectedCommunication)}</strong><span>Richiesta iniziale · {formatTimestamp(selectedCommunication.createdAt)}</span></div><p>{communicationBody(selectedCommunication)}</p></article>{selectedCommunication.messages.length === 0 ? <div className="communications-thread__empty"><span>Nessuna risposta ancora.</span><small>Scrivi il primo aggiornamento per proseguire il coordinamento tra reparti.</small></div> : selectedCommunication.messages.map((message) => <article className="communications-thread-message" key={message.id}><div className="communications-thread-message__meta"><strong>{messageAuthorName(message)}</strong><span>{formatTimestamp(message.createdAt)}</span></div><p>{messageBody(message)}</p></article>)}</section>
              <section className="communications-thread__status" aria-labelledby="communications-thread-status-title"><div><p className="communications__eyebrow">GESTIONE</p><h3 id="communications-thread-status-title">Stato della richiesta</h3><p>Usa solo le transizioni disponibili per mantenere il flusso tracciabile.</p></div>{availableStatusActions.length > 0 ? <div className="communications-thread__status-actions"><label><span className="sr-only">Nuovo stato della richiesta</span><select value={statusTarget} onChange={(event) => setStatusTarget(event.target.value as CommunicationStatus)} disabled={isDetailBusy}>{availableStatusActions.map((action) => <option key={action.value} value={action.value}>{action.label}</option>)}</select></label><button className="communications-button communications-button--secondary" type="button" onClick={() => void updateStatus()} disabled={isDetailBusy || !statusTarget}>{statusSaving ? <><span className="communications-spinner" />Aggiornamento…</> : 'Aggiorna stato'}</button></div> : <p className="communications-thread__closed">Questa conversazione è chiusa. Non sono disponibili altre transizioni.</p>}</section>
              <form className="communications-thread__reply" onSubmit={(event) => void submitReply(event)}><div className="communications-thread__section-heading"><div><p className="communications__eyebrow">RISPOSTA INTERNA</p><h3>Scrivi un aggiornamento</h3></div><span>Solo utenti autorizzati</span></div>{selectedStatus === 'CLOSED' ? <div className="communications-thread__reply-closed" role="status">La conversazione è chiusa e non accetta nuove risposte.</div> : <><label className="communications-form__field"><span className="sr-only">Messaggio di risposta</span><textarea value={reply} onChange={(event) => { setReply(event.target.value); if (replyError) setReplyError(''); }} maxLength={5000} disabled={isDetailBusy} placeholder="Scrivi un aggiornamento chiaro per il reparto coinvolto…" required /></label>{replyError && <div className="communications-form__error" role="alert"><Icon name="alert" />{replyError}</div>}<footer className="communications-thread__reply-actions"><small>Messaggio registrato esclusivamente nel portale Nexus Enterprise Solutions.</small><button className="communications-button communications-button--primary" type="submit" disabled={isDetailBusy || !reply.trim()}>{replying ? <><span className="communications-spinner communications-spinner--light" />Invio in corso…</> : <>Invia risposta <Icon name="arrow" /></>}</button></footer></>}</form>
            </div>}
    </Modal>}
  </section>;
}
