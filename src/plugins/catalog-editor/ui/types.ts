export type Data = Record<string, any>;
export type Api = (path: string, options?: { method?: string; body?: unknown }) => Promise<any>;
export type Issue = { path: string; message: string };
export type Field = { name: string; label: string; hint?: string; placeholder?: string; singular?: string; type: string; required?: boolean; maxLength?: number; min?: number; max?: number; default?: any; relation?: string; target?: string; children?: Field[]; many?: boolean; options?: { value: string; label: string }[] };
export type Contract = { kind: string; fields: Field[]; sections: { title: string; hint?: string; fields: string[] }[] };
export type Draft = { documentId: string; kind: string; organization: string; target?: string; payload: Data; revision: number; status: string; baseline?: { payload: Data }; feedback?: string; history?: { action: string; at: string; feedback?: string; changedFields?: string[] }[] };
export type Identity = { staff: boolean; publish: boolean; members: boolean; organizations: { documentId: string; name: string }[] };
