import React from 'react';
import { Fields, type Context } from './Fields';
import type { Data, Field } from './types';

// Group related decisions without hiding fields or adding another navigation layer.
const GROUPS = [
  { title: 'Essential details', names: ['title', 'name', 'provider', 'shortDescription', 'summary'] },
  { title: 'What students can expect', names: ['description', 'highlights', 'categories'] },
  { title: 'Study at a glance', names: ['duration', 'language', 'participants', 'fields'] },
  { title: 'Award amount', names: ['lower_bound', 'upper_bound'] },
  { title: 'Award benefits', names: ['benefits'] },
  { title: 'Application details', names: ['application_link', 'info_link', 'application_deadline', 'deadline', 'status', 'link'] },
  { title: 'Cover photo', names: ['image'] },
  { title: 'Photo gallery', names: ['gallery'] },
  { title: 'RWM publishing settings', names: ['rating', 'featured'] },
];
export function GroupedFields({ fields, value, onChange, context, disabled }: { fields: Field[]; value: Data; onChange: (value: Data) => void; context: Context; disabled: boolean }) {
  const used = new Set<string>();
  const groups = GROUPS.map(group => ({ ...group, fields: group.names.flatMap(name => fields.find(f => f.name === name && !f.children) || []) })).filter(group => group.fields.length);
  groups.forEach(group => group.fields.forEach(field => used.add(field.name)));
  const remaining = fields.filter(field => !used.has(field.name));
  if (!fields.length) return null;
  return <fieldset disabled={disabled} className="ce-form-groups">
    {groups.map(group => <fieldset className="ce-form-block" key={group.title}><legend>{group.title}</legend><div className="ce-fields"><Fields fields={group.fields} value={value} onChange={onChange} context={context} /></div></fieldset>)}
    {remaining.map(field => <div className="ce-owned-block" key={field.name}><Fields fields={[field]} value={value} onChange={onChange} context={context} /></div>)}
  </fieldset>;
}
