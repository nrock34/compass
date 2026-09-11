import React from 'react';
import { ReferenceSummary, type Context } from './Fields';
import type { Contract, Data, Field, Issue } from './types';

export function fieldLabel(fields: Field[], path: string): string {
  const parts: string[] = [];
  for (const part of path.split('.')) {
    if (/^\d+$/.test(part)) { parts[parts.length - 1] += ` ${Number(part) + 1}`; continue; }
    const field = fields.find(f => f.name === part);
    parts.push(field?.singular ? field.singular.replace(/^./, c => c.toUpperCase()) : field?.label || 'Entry details');
    fields = field?.children || [];
  }
  return parts.join(' › ');
}
export function Summary({ fields, payload, baseline, context }: { fields: Field[]; payload: Data; baseline?: Data; context: Context }) {
  return <dl className="ce-summary">{fields.filter(f => f.name !== 'step' && (hasValue(payload[f.name]) || hasValue(baseline?.[f.name]))).map(f => <React.Fragment key={f.name}><dt>{f.label}{baseline && JSON.stringify(baseline[f.name]) !== JSON.stringify(payload[f.name]) && <span> — {hasValue(payload[f.name]) ? 'updated' : 'removed'}</span>}</dt><dd>{!hasValue(payload[f.name]) ? 'Not included' : f.children ? (Array.isArray(payload[f.name]) ? payload[f.name] : [payload[f.name]]).map((row: Data, i: number) => <Summary key={i} fields={f.children!} payload={row} context={context} />) : f.type === 'relation' ? <ReferenceSummary field={f} value={payload[f.name]} context={context} /> : Array.isArray(payload[f.name]) ? <ul>{payload[f.name].map((v: string, i: number) => <li key={i}>{v}</li>)}</ul> : f.options ? f.options.find(o => o.value === payload[f.name])?.label : typeof payload[f.name] === 'boolean' ? payload[f.name] ? 'Yes' : 'No' : ['date', 'datetime'].includes(f.type) ? new Date(f.type === 'date' ? `${payload[f.name]}T12:00:00` : payload[f.name]).toLocaleString(undefined, f.type === 'date' ? { dateStyle: 'medium' } : { dateStyle: 'medium', timeStyle: 'short' }) : String(payload[f.name])}</dd></React.Fragment>)}</dl>;
}
function hasValue(value: any): boolean { return value !== undefined && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0); }
export function Review({ contract, payload, baseline, context, issues, checking, checked, onEdit, onFix }: { contract: Contract; payload: Data; baseline?: Data; context: Context; issues: Issue[]; checking: boolean; checked: boolean; onEdit: (section: number) => void; onFix: (issue: Issue) => void }) {
  const groups = contract.sections.map((section, index) => ({ ...section, index, errors: issues.filter(e => section.fields.includes(e.path.split('.')[0])), fields: section.fields.flatMap(name => contract.fields.find(f => f.name === name) || []) })).filter(s => s.fields.length > 0);
  const incomplete = groups.filter(g => g.errors.length).length;
  return <div className="ce-review" aria-busy={checking}>
    <div className="ce-review-intro" role="status"><h3>{checking ? 'Checking your entry…' : !checked ? 'Check your latest changes' : incomplete ? `${incomplete} ${incomplete === 1 ? 'section needs' : 'sections need'} your attention` : 'Your entry is ready for review'}</h3><p>{checking ? 'Checking required details and any optional sections you added.' : !checked ? 'Select Check details again below to review your latest saved changes.' : incomplete ? 'Complete the details below. Your draft is saved, and you can come back at any time.' : 'Read through the details below. Use Edit if you need to change anything.'}</p></div>
    <div className="ce-review-sections">{groups.map(group => {
      const added = group.fields.some(f => hasValue(payload[f.name]));
      const needs = group.errors.length > 0;
      return <section className={`ce-review-section ${needs ? 'ce-needs-attention' : ''}`} key={group.title}>
        <header><span className={`ce-section-marker ${checked && !needs && added ? 'ce-complete' : ''}`} aria-hidden="true">{checked && !needs ? added ? '✓' : '—' : group.index + 1}</span><div><h3>{group.title === 'Review' ? 'RWM publishing settings' : group.title}</h3><p>{!checked ? 'Not checked yet' : needs ? `${group.errors.length} ${group.errors.length === 1 ? 'detail' : 'details'} to complete` : added ? 'Complete' : 'Optional · Nothing added'}</p></div><button type="button" onClick={() => needs ? onFix(group.errors[0]) : onEdit(group.index)}>{needs ? 'Complete section' : 'Edit'}</button></header>
        {needs && <div className="ce-review-issues">{group.errors.map((issue, i) => <div className="ce-review-issue" key={`${issue.path}:${i}`}><div><strong>{fieldLabel(contract.fields, issue.path)}</strong><p>{issue.message === 'Required.' ? 'Add this detail before submitting your entry.' : issue.message}</p></div><button type="button" aria-label={`Fix ${fieldLabel(contract.fields, issue.path)}`} onClick={() => onFix(issue)}>Fix</button></div>)}</div>}
        {added && <details><summary>View {group.title === 'Review' ? 'publishing settings' : group.title.toLowerCase()}</summary><Summary fields={group.fields} payload={payload} baseline={baseline} context={context} /></details>}
      </section>;
    })}</div>
  </div>;
}
