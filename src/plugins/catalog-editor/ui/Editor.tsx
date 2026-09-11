import React, { useEffect, useRef, useState } from 'react';
import { GroupedFields } from './GroupedFields';
import { Review, Summary, fieldLabel } from './Review';
import type { Api, Contract, Data, Draft, Identity, Issue } from './types';

export function Editor({ api, identity, entry, onClose, onDirtyChange }: { api: Api; identity: Identity; entry: Draft; onClose: () => void; onDirtyChange?: (dirty: boolean) => void }) {
  const [draft, setDraft] = useState(entry);
  const [payload, setPayload] = useState(entry.payload);
  const [contract, setContract] = useState<Contract>();
  const [section, setSection] = useState(0);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState('All changes saved');
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [live, setLive] = useState<{ payload: Data; hash: string; changed: boolean } | null>(null);
  const saved = useRef(JSON.stringify(entry.payload));
  const latest = useRef(payload); latest.current = payload;
  const currentDraft = useRef(draft); currentDraft.current = draft;
  const inFlight = useRef<Promise<Draft> | null>(null);
  const mounted = useRef(true);
  const scrollArea = useRef<HTMLElement>(null);
  useEffect(() => { scrollArea.current?.scrollTo({ top: 0 }); }, [section]);
  const dirty = JSON.stringify(payload) !== saved.current;
  useEffect(() => { onDirtyChange?.(dirty); }, [dirty]);
  const locked = draft.status === 'applied' || (!identity.staff && draft.status === 'submitted');
  useEffect(() => { mounted.current = true; api(`/contract/${draft.kind}`).then(setContract).catch(e => setError(e.message)); return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { if (JSON.stringify(latest.current) !== saved.current) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', handler); return () => window.removeEventListener('beforeunload', handler);
  }, []);
  async function save(): Promise<Draft> {
    if (inFlight.current) { await inFlight.current; return save(); }
    const body = structuredClone(latest.current);
    const encoded = JSON.stringify(body);
    if (encoded === saved.current) return currentDraft.current;
    setSaveStatus('Saving…');
    const request = api(`/drafts/${draft.documentId}`, { method: 'PUT', body: { revision: currentDraft.current.revision, payload: body } }); inFlight.current = request;
    try {
      const result = await request;
      saved.current = encoded; currentDraft.current = result;
      if (mounted.current) { setDraft(result); setSaveStatus(JSON.stringify(latest.current) === encoded ? 'All changes saved' : 'Unsaved changes'); setError(''); setChecked(false); }
      return result;
    } catch (e: any) {
      if (mounted.current) { setSaveStatus('Not saved — retry'); setError(e.message); if (Array.isArray(e.details)) setIssues(e.details); if (e.status === 409) setConflict(true); }
      throw e;
    } finally { inFlight.current = null; }
  }
  useEffect(() => {
    if (!dirty || locked || conflict || busy) return;
    setSaveStatus('Unsaved changes');
    const timer = setTimeout(() => { void save().catch(() => {}); }, 1200);
    return () => clearTimeout(timer);
  }, [payload, locked, conflict, busy]);
  async function review() {
    setChecking(true);
    try { await save(); const [errors, comparison] = await Promise.all([api(`/drafts/${draft.documentId}/validation`), api(`/drafts/${draft.documentId}/live`)]); setIssues(errors); setLive(comparison); setChecked(true); }
    catch (e: any) { setError(e.message); } finally { setChecking(false); }
  }
  async function action(name: string, extra: Data = {}) {
    setBusy(true);
    try {
      const current = await save();
      const result = await api(`/drafts/${draft.documentId}/${name}`, { method: 'POST', body: { revision: current.revision, feedback, ...extra } });
      currentDraft.current = result; setDraft(result); setPayload(result.payload); saved.current = JSON.stringify(result.payload); setError(''); setIssues([]); setFeedback(''); setChecked(['submit', 'apply'].includes(name)); setConflict(false); setSaveStatus('All changes saved');
      if (name === 'reconcile') setLive(null);
      if (['reconcile', 'withdraw', 'request-changes'].includes(name)) setSection(0);
    } catch (e: any) { setError(e.message); if (Array.isArray(e.details)) { setIssues(e.details); setSection((contract?.sections.length || 1) - 1); } if (e.status === 409) await api(`/drafts/${draft.documentId}/live`).then(setLive).catch(() => {}); }
    finally { setBusy(false); }
  }
  function focusIssue(issue: Issue) {
    const index = contract!.sections.findIndex(s => s.fields.includes(issue.path.split('.')[0]));
    setSection(Math.max(index, 0));
    setTimeout(() => { const field = Array.from(document.querySelectorAll<HTMLElement>('[data-field-path]')).find(el => el.dataset.fieldPath === issue.path); field?.querySelector<HTMLElement>('input,select,textarea,button')?.focus(); field?.scrollIntoView({ block: 'center', behavior: 'instant' }); }, 0);
  }
  function leave() { if (!dirty || window.confirm('Leave this entry? Unsaved changes will be lost.')) onClose(); }
  const issueLabel = (path: string) => fieldLabel(contract?.fields || [], path);
  async function reload() {
    if (dirty && !window.confirm('Replace your unsaved changes with the saved draft?')) return;
    try { const result = await api(`/drafts/${draft.documentId}`); setDraft(result); currentDraft.current = result; setPayload(result.payload); saved.current = JSON.stringify(result.payload); setConflict(false); setError(''); setSaveStatus('All changes saved'); } catch (e: any) { setError(e.message); }
  }
  if (!contract) return <p role="status">{error || 'Loading editor…'}</p>;
  const currentSection = contract.sections[section];
  const isReview = section === contract.sections.length - 1;
  const statusLabel = { draft: 'Draft', submitted: 'In review with RWM', changes_requested: 'Changes requested', applied: 'Published' }[draft.status];
  const goSection = (index: number) => { setSection(index); if (index === contract.sections.length - 1) void review(); };
  const sectionTitle = (title: string) => title === 'Review' ? identity.publish ? 'Review & publish' : 'Review & submit' : title;
  const context = { api, staff: identity.staff, organization: draft.organization, organizationName: identity.organizations.find(o => o.documentId === draft.organization)?.name, draftId: draft.documentId, errors: issues };
  return <div className="ce-editor">
    <button type="button" className="ce-back" onClick={leave}>← All entries</button>
    <header className="ce-entry-header"><div><h1>{payload.title || payload.name || `New ${draft.kind}`}</h1><p>{draft.kind === 'program' ? 'Program' : 'Scholarship'} · {statusLabel}</p></div><div className="ce-actions"><span role="status">{saveStatus}</span>{!locked && <button type="button" disabled={busy || conflict} onClick={() => void save().catch(() => {})}>Save draft</button>}</div></header>
    <nav className="ce-sections" aria-label="Entry sections">{contract.sections.map((s, i) => <button type="button" aria-current={section === i ? 'step' : undefined} key={s.title} onClick={() => goSection(i)}>{sectionTitle(s.title)}</button>)}</nav>
    <label className="ce-mobile-sections">Section<select value={section} onChange={e => { goSection(Number(e.target.value)); }}>{contract.sections.map((s, i) => <option value={i} key={s.title}>{sectionTitle(s.title)}</option>)}</select></label>
    <section ref={scrollArea} tabIndex={0} className="ce-form-section" aria-label={currentSection.title}>
    {error && <div className="ce-notice ce-error" role="alert"><p>{error}</p>{conflict && <button type="button" onClick={reload}>Reload saved draft</button>}</div>}
    {draft.status === 'draft' && <p className="ce-visibility-note">Your draft is private. Nothing is published until RWM approves it.</p>}
    {draft.status === 'submitted' && <div className="ce-submission-state" role="status"><span aria-hidden="true">✓</span><div><h2>{identity.staff ? 'Provider submission ready for review' : 'Submitted to RWM'}</h2><p>{identity.staff ? 'Review the details, make any corrections, then publish or request changes in the review section.' : 'Your entry is being reviewed. Any feedback will appear here. To make changes now, take it out of review first.'}</p>{!identity.staff && <button type="button" disabled={busy} onClick={() => action('withdraw')}>Take out of review and edit</button>}</div></div>}
    {draft.status === 'applied' && <div className="ce-submission-state" role="status"><span aria-hidden="true">✓</span><div><h2>Your entry is published</h2><p>This version is now in the RWM catalog. Return to your catalog to propose further changes.</p></div></div>}
    {draft.feedback && <div className="ce-notice"><h2>Changes requested</h2><p>{draft.feedback}</p></div>}
<div className="ce-section-heading"><h2>{sectionTitle(currentSection.title)}</h2><p>{currentSection.hint}</p>{!isReview && !locked && <p className="ce-form-instructions">Fields marked <span aria-hidden="true">*</span> are required to submit. Everything else is optional.</p>}</div>
      <GroupedFields disabled={locked || busy} fields={currentSection.fields.filter(name => identity.staff || name !== 'provider').flatMap(name => contract.fields.find(f => f.name === name) || [])} value={payload} onChange={setPayload} context={context} />
      {isReview && <>
        <Review contract={contract} payload={payload} baseline={draft.baseline?.payload} context={context} issues={issues} checking={checking} checked={checked} onEdit={goSection} onFix={focusIssue} />
        {live?.changed && <div className="ce-notice"><h3>The live entry has changed</h3><p>Compare the live version below. Choose which complete version to keep, then check it before publishing.</p><details><summary>Current live content</summary><Summary fields={contract.fields} payload={live.payload} context={context} /></details><div className="ce-actions"><button type="button" disabled={locked || busy} onClick={() => action('reconcile', { liveHash: live.hash, useLive: true })}>Use live version</button><button type="button" disabled={locked || busy} onClick={() => action('reconcile', { liveHash: live.hash, useLive: false })}>Keep this draft over live changes</button></div></div>}
        {!locked && <div className="ce-submit-box"><div><h3>{identity.publish ? 'Publish this entry' : 'Send your entry to RWM'}</h3><p>{identity.publish ? 'Publishing applies these details to the catalog.' : 'RWM will review your entry before it appears in the catalog. You can see its status and any feedback here.'}</p>{issues.length > 0 && <p className="ce-error">Complete the details above to continue.</p>}</div><button type="button" className="ce-primary" disabled={busy || conflict || checking || !checked || issues.length > 0 || live?.changed} onClick={() => action(identity.publish ? 'apply' : 'submit')}>{busy ? 'Please wait…' : identity.publish ? draft.target ? 'Publish changes' : 'Publish entry' : 'Submit to RWM for review'}</button><button type="button" onClick={review}>Check details again</button></div>}
        {draft.status === 'submitted' && <div className="ce-review-actions">{identity.publish && <><label htmlFor="review-feedback">Feedback for the provider</label><textarea id="review-feedback" value={feedback} maxLength={5000} onChange={e => setFeedback(e.target.value)} /><button type="button" disabled={busy || !feedback.trim()} onClick={() => action('request-changes')}>Request changes</button></>}</div>}
        {draft.history?.length ? <details><summary>Review history</summary><ol>{draft.history.map((event, i) => <li key={i}>{event.action.replace(/-/g, ' ')} · {new Date(event.at).toLocaleString()}{event.feedback && <p>{event.feedback}</p>}{event.changedFields?.length ? <p>Updated: {event.changedFields.map(issueLabel).join(', ')}</p> : null}</li>)}</ol></details> : null}
      </>}
    </section>
      {!isReview && <footer className="ce-section-footer"><span>Section {section + 1} of {contract.sections.length}</span><div className="ce-actions">{section > 0 && <button type="button" onClick={() => goSection(section - 1)}>Back</button>}<button type="button" className="ce-primary" onClick={() => goSection(section + 1)}>Continue to {sectionTitle(contract.sections[section + 1].title).toLowerCase()} →</button></div></footer>}
  </div>;
}
