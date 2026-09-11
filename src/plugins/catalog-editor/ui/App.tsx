import React, { useEffect, useState } from 'react';
import { Editor } from './Editor';
import type { Api, Data, Draft, Identity } from './types';
import './styles.css';
const statusLabels: Record<string, string> = { draft: 'Draft · Not submitted', submitted: 'In review with RWM', changes_requested: 'Changes requested', applied: 'Published' };


export function CatalogApp({ api, portal = false }: { api: Api; portal?: boolean }) {
  const [identity, setIdentity] = useState<Identity>();
  const [organization, setOrganization] = useState('');
  const [entries, setEntries] = useState<{ entries: Data[]; drafts: Data[] }>({ entries: [], drafts: [] });
  const [draft, setDraft] = useState<Draft>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [tab, setTab] = useState('entries');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [dirty, setDirty] = useState(false);
  async function loadIdentity() {
    setLoading(true);
    try { const result = await api('/me'); setIdentity(result); setOrganization(current => current || result.organizations[0]?.documentId || ''); setAuthRequired(false); setError(''); }
    catch (e: any) { setError(e.message); if (portal && [401, 403].includes(e.status)) setAuthRequired(true); }
    finally { setLoading(false); }
  }
  async function loadEntries() {
    if (!organization) return;
    setLoading(true);
    try { setEntries(await api(`/entries?organization=${encodeURIComponent(organization)}`)); setError(''); } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }
  useEffect(() => { void loadIdentity(); }, []);
  useEffect(() => { void loadEntries(); }, [organization]);
  useEffect(() => {
    if (!portal || !identity) return;
    const id = /^\/provider\/drafts\/([^/]+)$/.exec(window.location.pathname)?.[1];
    if (id) void open(id, false);
  }, [identity]);
  useEffect(() => {
    if (!portal) return;
    const previous = window.location.pathname;
    const onPop = () => {
      if (dirty && !window.confirm('Leave this entry? Unsaved changes will be lost.')) { window.history.pushState(null, '', previous); return; }
      setDirty(false);
      const id = /^\/provider\/drafts\/([^/]+)$/.exec(window.location.pathname)?.[1];
      if (id) void open(id, false); else { setDraft(undefined); void loadEntries(); }
    };
    window.addEventListener('popstate', onPop); return () => window.removeEventListener('popstate', onPop);
  }, [portal, dirty, draft?.documentId, organization]);
  async function open(id: string, navigate = true) {
    try { setDraft(await api(`/drafts/${id}`)); if (portal && navigate) window.history.pushState(null, '', `/provider/drafts/${id}`); setError(''); } catch (e: any) { setError(e.message); }
  }
  async function create(kind: string, target?: string) {
    try { const created = await api('/drafts', { method: 'POST', body: { kind, organization, target } }); setDraft(created); if (portal) window.history.pushState(null, '', `/provider/drafts/${created.documentId}`); setError(''); } catch (e: any) { setError(e.message); }
  }
  if (portal && (authRequired || window.location.pathname === '/provider/reset')) return <div className="ce-app ce-portal"><Auth api={api} onLogin={loadIdentity} /></div>;
  const organizationName = identity?.organizations.find(o => o.documentId === organization)?.name;
  return <div className={`ce-app ${portal ? 'ce-portal' : 'ce-admin'} ${draft && identity ? 'ce-editing' : ''}`} >

    <main className="ce-main" id="main-content">
      {portal && <div className="ce-portal-account"><span className="ce-portal-identity"><span className="ce-brand-mark" aria-hidden="true" /><span><strong>RomeWithMe</strong><span className="ce-account-name">{organizationName || 'Provider portal'}</span></span></span>{identity && <button type="button" onClick={async () => { if (dirty && !window.confirm('Sign out and discard unsaved changes?')) return; try { await api('/auth/logout', { method: 'POST' }); setIdentity(undefined); setAuthRequired(true); } catch (e: any) { setError(e.message); } }}>Sign out</button>}</div>}
      {error && <p className="ce-notice ce-error" role="alert">{error}</p>}
      {draft && identity ? <Editor key={draft.documentId} api={api} identity={identity} entry={draft} onDirtyChange={setDirty} onClose={() => { setDraft(undefined); setDirty(false); if (portal) window.history.pushState(null, '', '/provider'); void loadEntries(); }} /> : <>
        <header className="ce-entry-header"><div><h1>{portal ? 'Your catalog' : 'Catalog editor'}</h1><p>Programs, scholarships, and submissions</p></div><div className="ce-actions"><button type="button" className="ce-primary" disabled={!organization} onClick={() => create('program')}>New program</button><button type="button" disabled={!organization} onClick={() => create('scholarship')}>New scholarship</button></div></header>
        {identity && identity.organizations.length > 1 && <label className="ce-organization">Organization<select value={organization} onChange={e => setOrganization(e.target.value)}>{identity.organizations.map(o => <option key={o.documentId} value={o.documentId}>{o.name}</option>)}</select></label>}
        {identity && !organization && <p>No provider organizations are available. Ask an administrator to assign access.</p>}
        <nav className="ce-sections" aria-label="Catalog views"><button type="button" aria-current={tab === 'entries' ? 'page' : undefined} onClick={() => setTab('entries')}>Entries & drafts</button>{identity?.members && <button type="button" aria-current={tab === 'members' ? 'page' : undefined} onClick={() => setTab('members')}>Provider accounts</button>}</nav>
        {tab === 'members' && organization ? <Members api={api} organization={organization} /> : <>
          <div className="ce-filters"><label>Search entries<input type="search" value={search} onChange={e => setSearch(e.target.value)} /></label><label>Draft status<select value={status} onChange={e => setStatus(e.target.value)}><option value="">All drafts</option><option value="draft">Draft</option><option value="submitted">Submitted</option><option value="changes_requested">Changes requested</option><option value="applied">Published</option></select></label><button type="button" onClick={loadEntries}>Refresh</button></div>
          {loading && <p role="status">Loading catalog…</p>}
          <section className="ce-catalog-panel" aria-label="Drafts and submissions"><h2>Drafts & submissions</h2><ul className="ce-entry-list">{entries.drafts.filter(d => (status ? d.status === status : d.status !== 'applied') && d.title.toLowerCase().includes(search.toLowerCase())).map(d => <li key={d.documentId}><button type="button" className="ce-entry-link" onClick={() => open(d.documentId)}>{d.title}<span>{d.kind === 'program' ? 'Program' : 'Scholarship'} · {statusLabels[d.status]}</span></button><time dateTime={d.updatedAt}>{new Date(d.updatedAt).toLocaleDateString()}</time></li>)}</ul>{!entries.drafts.length && !loading && <p className="ce-help">Your saved drafts and submissions will appear here.</p>}
          </section><section className="ce-catalog-panel" aria-label="Published catalog entries"><h2>Catalog entries</h2><ul className="ce-entry-list">{entries.entries.filter(d => d.title.toLowerCase().includes(search.toLowerCase())).map(d => <li key={`${d.kind}:${d.documentId}`}><div>{d.title}<span>{d.kind === 'program' ? 'Program' : 'Scholarship'}</span></div><button type="button" aria-label={`Edit ${d.title}`} onClick={() => create(d.kind, d.documentId)}>Edit entry</button></li>)}</ul>{!entries.entries.length && !loading && <p className="ce-help">No entries yet. Create a program or scholarship to get started.</p>}</section>
        </>}
      </>}
    </main>
  </div>;
}
function Auth({ api, onLogin }: { api: Api; onLogin: () => void }) {
  const reset = window.location.pathname === '/provider/reset';
  const [mode, setMode] = useState(reset ? 'reset' : 'login');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const body = mode === 'login' ? { identifier: email, password } : mode === 'forgot' ? { email } : { code: new URLSearchParams(window.location.search).get('code'), password, passwordConfirmation: confirmation };
      await api(`/auth/${mode}`, { method: 'POST', body });
      if (mode === 'forgot') setMessage('If this email has provider access, a reset link has been sent.');
      else { if (reset) window.history.replaceState(null, '', '/provider'); onLogin(); }
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }
  return <div className="ce-auth-shell"><div className="ce-provider-login"><div className="ce-provider-wordmark"><span className="ce-brand-mark" aria-hidden="true" />RomeWithMe</div><main className="ce-auth"><p className="ce-auth-context">Provider portal</p><h1>{mode === 'login' ? 'Sign in to your workspace' : mode === 'forgot' ? 'Reset your password' : 'Choose a new password'}</h1><p>{mode === 'login' ? 'Manage your programs and scholarships.' : 'Use the account authorized by your RWM administrator.'}</p><form onSubmit={submit}>
    {mode !== 'reset' && <label>Email<input required type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} /></label>}
    {mode !== 'forgot' && <label>Password<input required type="password" minLength={mode === 'reset' ? 12 : undefined} autoComplete={mode === 'reset' ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} /></label>}
    {mode === 'reset' && <label>Confirm password<input required type="password" autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>}
    {error && <p role="alert" className="ce-error">{error}</p>}{message && <p role="status">{message}</p>}<button type="submit" className="ce-primary" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : mode === 'forgot' ? 'Send reset link' : 'Set password'}</button>
  </form>{mode === 'login' ? <button type="button" className="ce-link" onClick={() => { setMode('forgot'); setError(''); }}>Forgot password?</button> : <a href="/provider">Back to sign in</a>}<p className="ce-help">Account access is managed by RWM. Contact your administrator if you need access.</p></main></div></div>;
}
function Members({ api, organization }: { api: Api; organization: string }) {
  const [rows, setRows] = useState<Data[]>([]); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function load() { try { setRows(await api(`/members?organization=${organization}`)); } catch (e: any) { setError(e.message); } }
  useEffect(() => { void load(); }, [organization]);
  async function update(body: Data) { setBusy(true); try { await api('/members', { method: 'POST', body: { ...body, organization } }); setPassword(''); setEmail(''); setError(''); await load(); } catch (e: any) { setError(e.message); } finally { setBusy(false); } }
  return <section className="ce-members"><h2>Provider accounts</h2><p>Authorize an existing account or create one with a temporary password.</p>{error && <p role="alert" className="ce-error">{error}</p>}<ul className="ce-entry-list">{rows.map(row => <li key={row.documentId}><span>{row.email} · {row.active ? 'Authorized' : 'Revoked'}</span><button type="button" disabled={busy} onClick={() => update({ documentId: row.documentId, active: !row.active })}>{row.active ? 'Revoke access' : 'Authorize'}</button></li>)}</ul><form onSubmit={e => { e.preventDefault(); void update({ email, password }); }}><label>Email<input required type="email" value={email} onChange={e => setEmail(e.target.value)} /></label><label>Temporary password (new accounts only)<input type="password" autoComplete="new-password" minLength={12} value={password} onChange={e => setPassword(e.target.value)} /></label><button type="submit" disabled={busy}>Authorize account</button></form></section>;
}
