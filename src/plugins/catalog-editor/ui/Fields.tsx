import React, { useEffect, useId, useState } from 'react';
import type { Api, Data, Field, Issue } from './types';

export type Context = { api: Api; organization: string; organizationName?: string; draftId: string; staff: boolean; errors: Issue[] };
export function initial(fields: Field[]): Data {
  return Object.fromEntries(fields.filter(f => f.default !== undefined).map(f => [f.name, f.default]));
}
function Reference({ field, value, onChange, context, id }: { field: Field; value: any; onChange: (v: any) => void; context: Context; id: string }) {
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<Data[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [alt, setAlt] = useState('');
  const [file, setFile] = useState<File>();
  const type = field.target?.split('::')[1]?.split('.')[0] || 'provider';
  const many = field.relation === 'manyToMany';
  const selected: string[] = many ? value || [] : value ? [value] : [];
  const [selectedRows, setSelectedRows] = useState<Data[]>([]);
  const [pickerOpen, setPickerOpen] = useState(!selected.length);
  useEffect(() => {
    if (!selected.length) { setSelectedRows([]); return; }
    let active = true;
    context.api(`/references?type=${type}&organization=${encodeURIComponent(context.organization)}&draft=${context.draftId}&ids=${encodeURIComponent(selected.join(','))}`).then(result => { if (active) setSelectedRows(result); }).catch(e => active && setError(e.message));
    return () => { active = false; };
  }, [JSON.stringify(selected), context.organization]);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      context.api(`/references?type=${type}&organization=${encodeURIComponent(context.organization)}&draft=${context.draftId}&q=${encodeURIComponent(search)}`).then(result => { if (active) { setRows(result); setError(''); } }).catch(e => active && setError(e.message)).finally(() => active && setLoading(false));
    }, 200);
    return () => { active = false; clearTimeout(timer); };
  }, [search, type, context.organization, context.draftId, refresh]);
  const choose = (entry: string) => { if (!entry) return; onChange(many ? [...new Set([...selected, entry])] : entry); setPickerOpen(false); setSearch(''); };
  async function upload() {
    if (!file || !alt.trim()) { setError('Choose an image and enter alternative text.'); return; }
    const body = new FormData(); body.append('file', file); body.append('alt_text', alt); body.append('organization', context.organization);
    setUploading(true);
    try { const asset = await context.api('/assets', { method: 'POST', body }); setRows(prev => [...prev, asset]); choose(asset.documentId); setAlt(''); setFile(undefined); setRefresh(v => v + 1); setError(''); }
    catch (e: any) { setError(e.message); } finally { setUploading(false); }
  }
  async function create() {
    if (!newName.trim() || creating) return;
    setCreating(true);
    try { const row = await context.api('/references', { method: 'POST', body: { type, name: newName.trim() } }); setRows(prev => [...prev, row]); choose(row.documentId); setRefresh(v => v + 1); setCreateOpen(false); setNewName(''); setError(''); }
    catch (e: any) { setError(e.message); } finally { setCreating(false); }
  }
  return <div className="ce-reference">
    {selected.length > 0 && <ol className="ce-selected">{selected.map((entry, index) => {
      const row = selectedRows.find(r => r.documentId === entry) || rows.find(r => r.documentId === entry);
      return <li key={entry}>{row?.url && <img src={row.url} alt={row.alt_text || ''} />}<span>{row?.name || `Selected ${field.label.toLowerCase()} ${index + 1}`}</span>
        {many && <><button type="button" disabled={index === 0} aria-label={`Move ${row?.name || 'image'} up`} onClick={() => { const copy = [...selected]; [copy[index - 1], copy[index]] = [copy[index], copy[index - 1]]; onChange(copy); }}>Move up</button><button type="button" disabled={index === selected.length - 1} aria-label={`Move ${row?.name || 'image'} down`} onClick={() => { const copy = [...selected]; [copy[index + 1], copy[index]] = [copy[index], copy[index + 1]]; onChange(copy); }}>Move down</button></>}
        <button type="button" aria-label={`Remove ${row?.name || field.label}`} onClick={() => onChange(many ? selected.filter(x => x !== entry) : undefined)}>Remove</button>
      </li>;
    })}</ol>}
    {selected.length > 0 && <button type="button" aria-expanded={pickerOpen} onClick={() => setPickerOpen(!pickerOpen)}>{pickerOpen ? 'Close selection' : many ? `Add to ${field.label.toLowerCase()}` : `Change ${field.label.toLowerCase()}`}</button>}
    {(pickerOpen || !selected.length) && <div className="ce-picker-panel">
    <input id={id} type="search" value={search} placeholder={`Search ${field.label.toLowerCase()}`} aria-label={`Search ${field.label.toLowerCase()}`} onChange={e => setSearch(e.target.value)} />
    {loading && <p className="ce-help" role="status">Searching…</p>}
    <ul className="ce-reference-results" aria-label={`Available ${field.label.toLowerCase()}`}>{rows.filter(r => !selected.includes(r.documentId)).slice(0, 8).map(row => <li key={row.documentId}><button type="button" onClick={() => choose(row.documentId)}>{row.url && <img src={row.url} alt="" />}<span>{row.name}</span><span className="ce-select-action">Select</span></button></li>)}</ul>
    {rows.length > 8 && <p className="ce-help">Showing the first 8 results. Search for a name to narrow the list.</p>}
    {!loading && rows.length === 0 && <p className="ce-help">No matching entries.</p>}
    {type === 'catalog-asset' && <details><summary>Upload a new photo</summary><label htmlFor={`${id}-file`}>Choose a photo (JPEG, PNG, WebP, AVIF, or GIF; up to 10 MB)</label><input id={`${id}-file`} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" onChange={e => setFile(e.target.files?.[0])} /><label htmlFor={`${id}-alt`}>Describe the photo</label><p className="ce-field-hint">A short description for people who cannot see the image. For example, “Students in the courtyard of the Rome campus.”</p><input id={`${id}-alt`} value={alt} maxLength={255} onChange={e => setAlt(e.target.value)} /><button type="button" disabled={uploading} onClick={upload}>{uploading ? 'Uploading…' : 'Use this photo'}</button></details>}
    </div>}
    {type === 'program-field' && !context.staff && <p className="ce-help">Subjects are managed by RWM. If a subject is missing, contact RWM to have it added. You can save your draft in the meantime.</p>}
    {context.staff && ['provider', 'program-field'].includes(type) && <div className="ce-reference-create">
      <button type="button" aria-expanded={createOpen} onClick={() => { setNewName(search); setCreateOpen(!createOpen); }}>{createOpen ? 'Cancel creation' : `Create new ${type === 'program-field' ? 'subject' : 'provider'}`}</button>
      {createOpen && <div><label htmlFor={`${id}-new-name`}>{type === 'program-field' ? 'Subject name' : 'Provider name'}</label><input id={`${id}-new-name`} value={newName} maxLength={type === 'program-field' ? 40 : 255} onChange={e => setNewName(e.target.value)} /><button type="button" disabled={creating || !newName.trim()} onClick={create}>{creating ? 'Creating…' : 'Create and select'}</button></div>}
    </div>}
    {error && <p role="alert" className="ce-error">{error}</p>}
  </div>;
}
export function ReferenceSummary({ field, value, context }: { field: Field; value: any; context: Context }) {
  const [rows, setRows] = useState<Data[]>([]);
  const [failed, setFailed] = useState(false);
  const ids: string[] = Array.isArray(value) ? value : value ? [value] : [];
  useEffect(() => {
    let active = true;
    if (ids.length) context.api(`/references?type=${field.target?.split('::')[1]?.split('.')[0] || 'provider'}&organization=${context.organization}&draft=${context.draftId}&ids=${encodeURIComponent(ids.join(','))}`).then(result => active && setRows(result)).catch(() => active && setFailed(true));
    return () => { active = false; };
  }, [JSON.stringify(ids)]);
  if (!ids.length) return <>None selected</>;
  if (failed) return <>Unable to load selected entries. Check this field before publishing.</>;
  return <>{ids.map(id => { const row = rows.find(r => r.documentId === id); return <div key={id}>{row?.url && <img className="ce-summary-image" src={row.url} alt={row.alt_text || ''} />}{row?.name || 'Loading selection…'}</div>; })}</>;
}
export function Fields({ fields, value, onChange, context, prefix = '' }: { fields: Field[]; value: Data; onChange: (data: Data) => void; context: Context; prefix?: string }) {
  return <>{fields.filter(f => f.name !== 'step').map(field => <FieldInput key={field.name} field={field} value={value[field.name]} onChange={v => { const next = { ...value }; if (v === undefined) delete next[field.name]; else next[field.name] = v; onChange(next); }} context={context} path={`${prefix}${field.name}`} />)}</>;
}
function FieldInput({ field: f, value, onChange, context, path }: { field: Field; value: any; onChange: (v: any) => void; context: Context; path: string }) {
  const reactId = useId(); const id = `ce-${reactId}`;
  const errors = context.errors.filter(e => e.path === path);
  const helpId = `${id}-help`;
  if (f.children) {
    const rows: Data[] = f.many ? value || [] : value ? [value] : [];
    const singular = f.singular || f.label.toLowerCase();
    const update = (index: number, row: Data) => onChange(f.many ? rows.map((r, i) => i === index ? row : r) : row);
    return <fieldset className="ce-group" data-field-path={path}><legend>{f.label} <span className="ce-optional">Optional</span></legend><p className="ce-group-hint">{f.hint}</p>
      {rows.map((row, i) => <div className="ce-related" key={row.documentId || i}>
        <div className="ce-row-actions"><h3>{f.many ? row.name || row.title || `${singular.replace(/^./, c => c.toUpperCase())} ${i + 1}` : 'Details'}</h3>{f.many && <><button type="button" disabled={i === 0} aria-label={`Move ${f.label} ${i + 1} up`} onClick={() => { const copy = [...rows]; [copy[i - 1], copy[i]] = [copy[i], copy[i - 1]]; onChange(copy.map((r, n) => f.name === 'application_steps' ? { ...r, step: n + 1 } : r)); }}>Move up</button><button type="button" disabled={i === rows.length - 1} aria-label={`Move ${f.label} ${i + 1} down`} onClick={() => { const copy = [...rows]; [copy[i + 1], copy[i]] = [copy[i], copy[i + 1]]; onChange(copy.map((r, n) => f.name === 'application_steps' ? { ...r, step: n + 1 } : r)); }}>Move down</button></>}<button type="button" aria-label={`Remove ${f.label} ${i + 1}`} onClick={() => onChange(f.many ? rows.filter((_, index) => index !== i) : undefined)}>Remove</button></div>
        <Fields fields={f.children!} value={row} onChange={data => update(i, data)} context={context} prefix={`${path}.${f.many ? i + '.' : ''}`} />
        {f.name === 'cost' && <p className="ce-total">Total program fees (USD): <strong>${['program_fee', 'accommodation_fee', 'extra_fee'].reduce((sum, key) => sum + Number(row[key] || 0), 0).toLocaleString()}</strong></p>}
      </div>)}
      {(f.many || !rows.length) && <button type="button" onClick={() => { const row = initial(f.children!); if (f.name === 'application_steps') row.step = rows.length + 1; onChange(f.many ? [...rows, row] : row); }}>+ Add {singular}</button>}
    </fieldset>;
  }
  const required = f.required && f.type !== 'json';
  const props = { id, placeholder: f.placeholder, 'aria-required': required || undefined, 'aria-invalid': errors.length > 0 || undefined, 'aria-describedby': `${f.hint ? id + '-hint ' : ''}${helpId}` };
  let control: React.ReactNode;
  if (f.type === 'relation') {
    if (f.name === 'provider' && path === 'provider' && !context.staff) control = <input id={id} readOnly value={context.organizationName || 'Your organization'} />;
    else control = <Reference field={f} value={value} onChange={onChange} context={context} id={id} />;
  } else if (f.type === 'json') {
    const items: string[] = value || [];
    const itemName: Record<string, string> = { highlights: 'highlight', courses: 'course', trips: 'trip', benefits: 'benefit', amenities: 'amenity', prerequisites: 'requirement', categories: 'category' };
    const singular = itemName[f.name] || 'item';
    control = <><ol className="ce-text-list">{items.map((item, i) => <li key={i}><input aria-label={`${singular} ${i + 1}`} placeholder={`Enter ${singular}`} value={item} maxLength={2000} onChange={e => onChange(items.map((v, n) => n === i ? e.target.value : v))} /><button type="button" aria-label={`Remove ${f.label} ${i + 1}`} onClick={() => onChange(items.filter((_, n) => n !== i))}>Remove</button></li>)}</ol><button id={id} type="button" aria-label={`Add ${singular}`} onClick={() => onChange([...items, ''])}>+ Add {singular}</button></>;
  } else if (f.type === 'boolean') control = <select {...props} value={value === undefined ? '' : String(value)} onChange={e => onChange(e.target.value === '' ? undefined : e.target.value === 'true')}><option value="">Choose</option><option value="true">Yes</option><option value="false">No</option></select>;
  else if (f.options) control = <select {...props} value={value || ''} onChange={e => onChange(e.target.value || undefined)}><option value="">Choose</option>{f.options.map(o => <option value={o.value} key={o.value}>{o.label}</option>)}</select>;
  else if (f.type === 'text') control = <textarea {...props} rows={5} value={value || ''} maxLength={f.maxLength} onChange={e => onChange(e.target.value)} />;
  else {
    const type = f.type === 'date' ? 'date' : f.type === 'datetime' ? 'datetime-local' : ['integer', 'decimal'].includes(f.type) ? 'number' : ['link', 'application_link', 'info_link'].includes(f.name) ? 'url' : 'text';
    let display = value ?? '';
    if (f.type === 'datetime' && value) { const d = new Date(value); if (!isNaN(d.valueOf())) display = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }
    control = <input {...props} type={type} value={display} min={f.min} max={f.max} maxLength={f.maxLength} step={f.type === 'decimal' ? '0.01' : undefined} onChange={e => { const v = e.target.value; onChange(!v ? undefined : type === 'number' ? Number(v) : type === 'datetime-local' ? new Date(v).toISOString() : v); }} />;
  }
  return <div className={`ce-field ${['text', 'json', 'relation'].includes(f.type) || f.maxLength && f.maxLength > 100 ? 'ce-field-wide' : ''}`} data-field-path={path}><div className="ce-label-row">{f.type === 'json' ? <span className="ce-field-label">{f.label}</span> : <label htmlFor={id}>{f.label}{required && <span className="ce-required" aria-hidden="true"> *</span>}</label>}{!required && <span className="ce-optional">Optional</span>}</div>{f.hint && <p id={`${id}-hint`} className="ce-field-hint">{f.hint}</p>}{control}<div id={helpId}>{errors.map(e => <p key={e.message} className="ce-error">{e.message === 'Required.' ? `Please add ${f.label.toLowerCase()}.` : e.message}</p>)}{f.maxLength && <p className="ce-help ce-character-count">{String(value || '').length} / {f.maxLength}</p>}{f.type === 'datetime' && <p className="ce-help">Your timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, ' ')}.</p>}</div></div>;
}
