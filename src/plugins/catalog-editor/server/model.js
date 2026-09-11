'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const uid = (name) => `api::${name}.${name}`;
const PRIVATE = Object.fromEntries(['draft', 'membership', 'asset-ownership', 'audit'].map(name => [name, `plugin::catalog-editor.${name}`]));
const CHILDREN = {
  program: { locations: 'program-location', campuses: 'program-campus', terms: 'program-term', cost: 'program-cost', requirements: 'program-requirement', accomodations: 'program-accomodation', academics: 'program-academic', application_steps: 'program-application-step', testimonials: 'program-testimonial', provider_links: 'program-provider' },
  scholarship: { requirements: 'scholarship-requirement', events: 'scholarship-event', application_steps: 'scholarship-application-process-step' },
};
const SECTIONS = {
  program: [
    ['Overview', ['title', 'provider', 'shortDescription', 'description', 'highlights', 'duration', 'language', 'fields', 'participants']],
    ['Locations & dates', ['locations', 'campuses', 'terms']],
    ['Study & eligibility', ['academics', 'requirements']],
    ['Fees & housing', ['cost', 'accomodations']],
    ['How to apply', ['application_link', 'info_link', 'application_deadline', 'application_steps', 'provider_links']],
    ['Photos & reviews', ['image', 'gallery', 'testimonials']],
    ['Review', ['rating', 'featured']],
  ],
  scholarship: [
    ['Overview', ['name', 'provider', 'summary', 'description', 'categories']],
    ['Award & benefits', ['lower_bound', 'upper_bound', 'benefits']],
    ['Eligibility', ['requirements']],
    ['Dates & application', ['deadline', 'status', 'link', 'events', 'application_steps']],
    ['Photos', ['image', 'gallery']],
    ['Review', ['rating', 'featured']],
  ],
};
const LABELS = { deadline: 'Application deadline', shortDescription: 'Short introduction', accomodations: 'Student housing', lower_bound: 'Minimum award amount (USD)', upper_bound: 'Maximum award amount (USD)', grad_year: 'Eligible year of study', fields: 'Subjects offered', provider_links: 'Partner organizations', image: 'Cover photo', gallery: 'Additional photos', state: 'State or region', gpa: 'Minimum GPA', active_credits_needed: 'Required enrolled credits', start_date_time: 'Start date and time', end_date_time: 'End date and time', complete_by: 'Step deadline', duration: 'Program length', participants: 'Number of students', provider: 'Organization', academics: 'Academic experience', requirements: 'Entry requirements', application_steps: 'Application steps', accomodation_fee: 'Housing fee', accommodation_fee: 'Housing fee', extra_fee: 'Other fees', application_link: 'Application website', info_link: 'Program website', testimonials: 'Student reviews', terms: 'Program dates', campuses: 'Campuses', locations: 'Study locations', is_main: 'Main organization', relationship_type: 'Organization’s role', class_size: 'Typical class size', level: 'Level of study', time_period: 'When they attended', grad_year: 'Eligible year of study', study_country: 'Eligible study destinations', field: 'Eligible subject areas', prerequisites: 'Prior study or experience', events: 'Important dates', link: 'Application website', rating: 'RWM rating', featured: 'Feature on RWM' };
const COPY = {
  program: { title: ['Program name', 'Use the name students will recognize on your website.', 'For example, Spring Semester in Rome'], language: ['Language of instruction', 'Which language are classes taught in?', 'For example, English'], shortDescription: ['Short introduction', 'One sentence that tells students what makes this program worth considering.'], description: ['About the program', 'Describe what students will study and experience, and who the program is for.'], highlights: ['Program highlights', 'Add a few specific reasons to choose this program.'], participants: ['Number of students', 'Leave blank if the group size is not yet known.'], fields: ['Subjects offered', 'Search and select all subjects students can study.'], application_link: ['Application website', 'The page where students can start their application. Include https://.'], info_link: ['Program website', 'A page with more information about this program.'] },
  scholarship: { name: ['Scholarship name', 'Use the official name of the award.'], summary: ['Short introduction', 'One sentence describing who the award supports.'], description: ['About the scholarship', 'Explain the purpose of the award and what recipients can expect.'], lower_bound: ['Minimum award amount (USD)', 'For a fixed award, enter the full amount here.'], upper_bound: ['Maximum award amount (USD)', 'Only needed if the award is offered as a range.'], categories: ['Award categories', 'Add the categories that describe this award, such as merit or financial need.'], benefits: ['What the award covers', 'Add each benefit separately, such as tuition, travel, or accommodation.'], status: ['Application availability', 'This tells students whether they can apply. It does not publish the scholarship.'], requirements: ['Who can apply', 'Add eligibility requirements to help students decide whether this award is for them.'] },
  'program-cost': { program_fee: ['Program fee (USD)', 'Enter whole US dollars.'], accommodation_fee: ['Housing fee (USD)', 'Enter 0 if included in the program fee.'], extra_fee: ['Other required fees (USD)', 'Enter 0 if there are no additional fees.'] },
  'program-location': { city: ['City', '', 'For example, Rome'], state: ['State or region', '', 'For example, Lazio'] },
  'program-campus': { accreditation: ['Accreditation', 'Name the institution or body that accredits this campus.'], has_accommodation: ['Housing available at this campus'] },
  'program-term': { title: ['Session name', '', 'For example, Spring 2027'] },
  'program-requirement': { language: ['Language requirement', '', 'For example, No prior Italian required'], active_credits_needed: ['Required enrolled credits', 'Number of credits the student must currently be taking.'], level: ['Level of study', '', 'For example, Undergraduate'] },
  'program-accomodation': { location: ['Housing location', '', 'For example, Near the city center'], type: ['Type of housing', '', 'For example, Shared apartment'], description: ['About the housing'] },
  'program-testimonial': { name: ['Student’s name'], text: ['Their review'], rating: ['Student’s rating', 'A score from 0 to 5.'] },
  'scholarship-requirement': { eligibility: ['Eligibility requirements', 'Describe who can apply and any restrictions.'], grad_year: ['Eligible year of study'], field: ['Eligible subject areas', 'Leave blank if all subjects are eligible.'], study_country: ['Eligible study destinations', 'Leave blank if there are no destination restrictions.'] },
  'program-application-step': { title: ['Step name', '', 'For example, Submit your transcript'], description: ['What the student needs to do'], deadline: ['Step deadline'] },
  'scholarship-application-process-step': { title: ['Step name', '', 'For example, Write a personal statement'], description: ['What the student needs to do'] },
};
const GROUPS = {
  locations: ['location', 'Add the city and region where students will study.'], campuses: ['campus', 'Add a campus if it has a name and accreditation students should know about.'], terms: ['session', 'Add the dates for each upcoming session.'], cost: ['fee breakdown', 'Enter each fee separately. The total is calculated for you.'], requirements: ['entry requirements', 'Describe the academic and language requirements for applicants.'], accomodations: ['housing details', 'Tell students where they will live and what is included.'], academics: ['academic details', 'Describe the courses, activities, and class sizes students can expect.'], application_steps: ['application step', 'Add each action in the order students need to complete it.'], testimonials: ['student review', 'Share a review from a student who attended this program.'], provider_links: ['partner organization', 'Only add organizations that help deliver this program.'], events: ['important date', 'Add dates such as interviews, award announcements, or orientation.'],
};
const SECTION_HELP = {
  Overview: 'Start with the information students need to understand this opportunity.',
  'Locations & dates': 'Tell students where the program takes place and when they can attend.',
  'Study & eligibility': 'Explain the academic experience and who is eligible to take part.',
  'Fees & housing': 'Help students understand the cost of attending and their accommodation options.',
  'How to apply': 'Give students a clear route from interest to a completed application.',
  'Photos & reviews': 'Choose a cover photo, then add any additional photos or student reviews.',
  'Award & benefits': 'Explain the value of the award and what it covers.',
  Eligibility: 'Make it clear who qualifies for this scholarship.',
  'Dates & application': 'Tell students when and how to apply, and what happens next.',
  Photos: 'Add a photo to help students recognize this scholarship. Photos are optional.',
  Review: 'Check each section before sending your entry to RWM. You can return to any section to make changes.',
};
const ENUM_LABELS = { sem: 'Semester', yr: 'Academic year', sum: 'Summer', brk: 'Break', twowks: 'Two weeks', sxwks: 'Six weeks', fr: 'First year', sp: 'Second year', jn: 'Third year', sn: 'Fourth year', gr: 'Graduate', al: 'Alumni', 'n/a': 'Not applicable' };
const INTERNAL = ['rating', 'featured'];
function schema(name) { return JSON.parse(fs.readFileSync(path.join(__dirname, '../../../api', name, 'content-types', name, 'schema.json'), 'utf8')); }
function label(name) { return LABELS[name] || name.replaceAll('_', ' ').replace(/^./, c => c.toUpperCase()); }
const COMMON_HINT = { image: 'Choose the main photo students will see in the catalog. Select an existing photo or upload a new one below.', gallery: 'Add any extra photos you want students to see. Use Move up and Move down to set their order.' };
function describe(name, parent) {
  return Object.entries(schema(name).attributes).filter(([key, a]) => a.visible !== false && key !== parent && key !== 'publication_status' && key !== 'provider_links').map(([key, a]) => ({
    name: key, label: COPY[name]?.[key]?.[0] || label(key), hint: COPY[name]?.[key]?.[1] || COMMON_HINT[key] || '', placeholder: COPY[name]?.[key]?.[2] || '', ...a,
    ...(GROUPS[key] ? { singular: GROUPS[key][0], hint: COPY[name]?.[key]?.[1] || GROUPS[key][1] } : {}),
    ...(a.type === 'relation' && CHILDREN[name]?.[key] ? { children: describe(CHILDREN[name][key], name), many: a.relation === 'oneToMany' } : {}),
    ...(a.enum ? { options: a.enum.map(value => ({ value, label: ENUM_LABELS[value] || label(value) })) } : {}),
  }));
}
function contract(kind) {
  if (!CHILDREN[kind]) fail(400, 'Choose a program or scholarship.');
  const fields = describe(kind);
  if (kind === 'program') fields.push({ name: 'provider_links', label: 'Partner organizations', singular: GROUPS.provider_links[0], hint: GROUPS.provider_links[1], type: 'relation', many: true, children: describe('program-provider', 'program').filter(f => f.name !== 'is_main').map(f => f.name === 'relationship_type' ? { ...f, enum: ['partner', 'external'], options: [{ value: 'partner', label: 'Delivery partner' }, { value: 'external', label: 'External organization' }] } : f) });
  return { kind, fields, sections: SECTIONS[kind].map(([title, names]) => ({ title, hint: SECTION_HELP[title], fields: names })), internal: INTERNAL, version: 1 };
}
function fail(status, message, details) { const error = new Error(message); error.status = status; error.details = details; throw error; }
function object(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
function canonical(v) {
  if (Array.isArray(v)) return v.map(canonical);
  if (!object(v)) return v;
  return Object.fromEntries(Object.keys(v).sort().map(k => [k, canonical(v[k])]));
}
function fingerprint(v) { return createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex'); }
function defaults(fields) {
  return Object.fromEntries(fields.filter(f => f.default !== undefined && !['application_link'].includes(f.name)).map(f => [f.name, f.default]));
}
/** Strict payload boundary. Partial saves permit absent required fields, never unknown fields or types. */
function validate(kind, value, { complete = false, provider = false } = {}) {
  const errors = [];
  function walk(fields, data, prefix = '') {
    if (!object(data)) { errors.push({ path: prefix, message: 'Expected an object.' }); return; }
    const allowed = new Set([...fields.map(f => f.name), ...(prefix ? ['documentId'] : [])]);
    for (const key of Object.keys(data)) if (!allowed.has(key)) errors.push({ path: prefix + key, message: 'Unsupported field.' });
    if (data.documentId !== undefined && (typeof data.documentId !== 'string' || !data.documentId)) errors.push({ path: prefix + 'documentId', message: 'Invalid document reference.' });
    for (const f of fields) {
      if (!prefix && provider && INTERNAL.includes(f.name)) {
        if (data[f.name] !== undefined) errors.push({ path: f.name, message: 'Only staff can change this field.' });
        continue;
      }
      const p = prefix + f.name, v = data[f.name];
      const add = message => errors.push({ path: p, message });
      if (v === undefined || v === null || v === '') { if (complete && f.required) add('Required.'); continue; }
      if (f.children) {
        if (f.many) {
          if (!Array.isArray(v) || v.length > 100) { add('Use a list of at most 100 entries.'); continue; }
          const ids = v.map(x => x?.documentId).filter(Boolean);
          if (new Set(ids).size !== ids.length) add('A related entry cannot appear twice.');
          v.forEach((row, index) => walk(f.children, row, `${p}.${index}.`));
        } else walk(f.children, v, p + '.');
      } else if (f.type === 'relation') {
        if (f.relation === 'manyToMany') {
          if (!Array.isArray(v) || v.length > 100 || v.some(x => typeof x !== 'string' || !x)) add('Choose valid entries.');
          else if (new Set(v).size !== v.length) add('Choose each entry only once.');
          else if (complete && f.required && !v.length) add('Choose at least one entry.');
        } else if (typeof v !== 'string' || !v) add('Choose a valid entry.');
      } else if (['integer', 'decimal'].includes(f.type)) {
        if (typeof v !== 'number' || !Number.isFinite(v) || (f.type === 'integer' && !Number.isInteger(v))) add('Enter a valid number.');
        else if ((f.min !== undefined && v < f.min) || (f.max !== undefined && v > f.max)) add(`Enter a value between ${f.min ?? 'the minimum'} and ${f.max ?? 'the maximum'}.`);
        else if (f.name === 'rating' && (v < 0 || v > 5)) add('Rating must be between 0 and 5.');
        else if ((f.name.endsWith('_fee') || ['lower_bound', 'upper_bound'].includes(f.name)) && v < 0) add('Amount cannot be negative.');
      } else if (f.type === 'boolean') { if (typeof v !== 'boolean') add('Choose yes or no.'); }
      else if (f.type === 'json') {
        if (!Array.isArray(v) || v.length > 100 || v.some(x => typeof x !== 'string' || x.length > 2000)) add('Use a list of text items (up to 100, 2,000 characters each).');
      } else if (typeof v !== 'string') add('Enter text.');
      else {
        if (f.maxLength && v.length > f.maxLength) add(`Use ${f.maxLength} characters or fewer.`);
        if (complete && f.required && !v.trim()) add('Required.');
        if (f.enum && !f.enum.includes(v)) add('Choose an available option.');
        if (['date', 'datetime'].includes(f.type) && (!/^\d{4}-\d{2}-\d{2}/.test(v) || Number.isNaN(Date.parse(v)))) add('Enter a valid date.');
        if (['application_link', 'info_link', 'link'].includes(f.name)) { try { if (!['http:', 'https:'].includes(new URL(v).protocol)) add('Use an HTTP or HTTPS URL.'); } catch { add('Enter a complete URL.'); } }
      }
    }
  }
  walk(contract(kind).fields, value);
  if (object(value)) {
    if (value.upper_bound != null && value.lower_bound != null && value.upper_bound < value.lower_bound) errors.push({ path: 'upper_bound', message: 'Maximum award must be at least the minimum.' });
    (Array.isArray(value.terms) ? value.terms : []).forEach((term, i) => {
      if (term?.start_date_time && term?.end_date_time && Date.parse(term.end_date_time) < Date.parse(term.start_date_time)) errors.push({ path: `terms.${i}.end_date_time`, message: 'End must be on or after start.' });
    });
  }
  return errors;
}
function assertValid(kind, payload, options) { const issues = validate(kind, payload, options); if (issues.length) fail(422, 'Check the highlighted fields.', issues); }
module.exports = { uid, PRIVATE, CHILDREN, INTERNAL, contract, defaults, fail, object, canonical, fingerprint, validate, assertValid };
