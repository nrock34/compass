export const quoteIdentifier = (identifier: string): string => `"${identifier.replace(/"/g, '""')}"`;
export const quoteLiteral = (value: string): string => `'${value.replace(/'/g, "''")}'`;
export const qualifiedName = (schema: string | undefined, name: string): string => schema ? `${quoteIdentifier(schema)}.${quoteIdentifier(name)}` : quoteIdentifier(name);
export const qualifiedRelation = qualifiedName;
export const qualifiedRegclass = qualifiedName;
export function fnv1aHash(value: string): string { let hash = 0x811c9dc5; for (let index = 0; index < value.length; index += 1) { hash ^= value.charCodeAt(index); hash = Math.imul(hash, 0x01000193); } return (hash >>> 0).toString(16).padStart(8, '0'); }
export function djb2XorHash(value: string): string { let hash = 5381; for (let index = 0; index < value.length; index += 1) hash = ((hash * 33) ^ value.charCodeAt(index)) >>> 0; return hash.toString(16); }
