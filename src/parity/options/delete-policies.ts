import { ARTICLE_LOCATION_DEFAULT_ID } from './constants';

export type DjangoDeleteAction = 'cascade' | 'protect' | 'set-null' | 'set-default';
export type DjangoDeletePolicy = Readonly<{ source: string; target: string; relation: string; action: DjangoDeleteAction; defaultValue?: number }>;

// The database installer consumes the complete declared policy list while this module owns the shared default contract.
export { ARTICLE_LOCATION_DEFAULT_ID };
