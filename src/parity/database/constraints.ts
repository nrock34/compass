import type { Core } from '@strapi/strapi';
import { DJANGO_CONSTRAINT_OPTIONS, PROGRAM_PROVIDER_MAIN_SYNC_OPTION, type ConstraintOption } from '../options/constraints';
import { isPostgresDatabase } from './client';
import { createMetadataResolver } from './metadata';
import { fnv1aHash, qualifiedName, qualifiedRegclass, qualifiedRelation, quoteIdentifier, quoteLiteral } from './sql';

export async function installDjangoParityConstraints(strapi: Core.Strapi): Promise<void> {

  if (!isPostgresDatabase(strapi)) return;
  const db = strapi.db as unknown as { getSchemaName?: () => string | undefined; connection: { raw(sql: string): Promise<void> } };
  const schema = db.getSchemaName?.(); const skipped: string[] = []; let installed = 0;
  const metadata = createMetadataResolver(strapi, (message) => skipped.push(message));
  const raw = async (sql: string) => { await db.connection.raw(sql); installed += 1; };
  const table = (uid: string) => { const name = metadata.table(uid); return name ? qualifiedRelation(schema, name) : undefined; };
  const quotedColumns = (uid: string, fields: readonly string[]) => { const values = metadata.columns(uid, fields); return values && Object.fromEntries(Object.entries(values).map(([field, value]) => [field, quoteIdentifier(value)])); };
  const install = async (option: ConstraintOption) => { const relation = table(option.uid); const columns = quotedColumns(option.uid, option.fields); if (!relation || !columns) return; if (option.kind === 'check') { const model = metadata.model(option.uid); if (!model) return; await raw(`DO $rwm$\nBEGIN\n  IF NOT EXISTS (\n    SELECT 1\n    FROM pg_constraint\n    WHERE conname = ${quoteLiteral(option.name)}\n      AND conrelid = ${quoteLiteral(qualifiedRegclass(schema, model.tableName))}::regclass\n  ) THEN\n    ALTER TABLE ${relation}\n      ADD CONSTRAINT ${quoteIdentifier(option.name)}\n      CHECK (${option.expression(columns)});\n  END IF;\nEND\n$rwm$;`); return; } const expressions = option.expressions?.map((expression) => { if (expression.kind === 'attribute') { const value = columns[expression.field]; return expression.lower ? `LOWER(${value})` : value; } const morph = metadata.morphToOneColumns(option.uid, expression.field); return morph ? quoteIdentifier(expression.kind === 'morph-type' ? morph.type : morph.id) : undefined; }); if (expressions?.some((value) => !value)) return; const fields = expressions ?? option.fields.map((field) => columns[field]); const where = option.predicate ? ` WHERE ${option.predicate(columns)}` : ''; await raw(`CREATE UNIQUE INDEX IF NOT EXISTS ${quoteIdentifier(option.name)} ON ${relation} (${fields.join(', ')})${where};`); };
  for (const option of DJANGO_CONSTRAINT_OPTIONS) await install(option);
  const sync = PROGRAM_PROVIDER_MAIN_SYNC_OPTION; const sourceTable = table(sync.sourceUid); const parentTable = table(sync.parentUid); const sourceColumns = quotedColumns(sync.sourceUid, sync.sourceFields); const parentId = metadata.idColumn(sync.parentUid); const parentField = metadata.column(sync.parentUid, sync.parentField); if (sourceTable && parentTable && sourceColumns && parentId && parentField) { const fn = qualifiedName(schema, sync.functionName); const trigger = quoteIdentifier(sync.triggerName); await raw(`CREATE OR REPLACE FUNCTION ${fn}()\nRETURNS trigger LANGUAGE plpgsql AS $rwm$\nBEGIN\n  IF NEW.${sourceColumns[sync.conditionField]} IS TRUE THEN\n    UPDATE ${parentTable}\n    SET ${quoteIdentifier(parentField)} = NEW.${sourceColumns.provider}\n    WHERE ${quoteIdentifier(parentId)} = NEW.${sourceColumns.program};\n  END IF;\n  RETURN NEW;\nEND\n$rwm$;`); await raw(`DROP TRIGGER IF EXISTS ${trigger} ON ${sourceTable};`); await raw(`CREATE TRIGGER ${trigger}\nAFTER INSERT OR UPDATE OF ${sourceColumns.program}, ${sourceColumns.provider}, ${sourceColumns.is_main} ON ${sourceTable}\nFOR EACH ROW EXECUTE FUNCTION ${fn}();`); }
  let oneToOneIndexes = 0;
  for (const [uid, model] of metadata.entries()) {
    if (!uid.startsWith('api::')) continue;
    // Strapi models audit users as one-to-one, but an admin can author many entries.
    // Remove indexes installed by earlier versions as well as excluding new ones.
    for (const field of ['createdBy', 'updatedBy']) {
      const indexName = `rwm_o2o_${fnv1aHash(`${uid}.${field}`)}_uniq`;
      await raw(`DROP INDEX IF EXISTS ${qualifiedName(schema, indexName)};`);
    }
    for (const [field, attribute] of Object.entries(model.attributes)) {
      if (field === 'createdBy' || field === 'updatedBy') continue;
      if (attribute.type !== 'relation' || attribute.relation !== 'oneToOne' || !attribute.owner || !attribute.joinColumn?.name) continue;
      const relation = table(uid);
      if (!relation) continue;
      const indexName = `rwm_o2o_${fnv1aHash(`${uid}.${field}`)}_uniq`;
      await raw(`CREATE UNIQUE INDEX IF NOT EXISTS ${quoteIdentifier(indexName)} ON ${relation} (${quoteIdentifier(attribute.joinColumn.name)});`);
      oneToOneIndexes += 1;
    }
  }
  strapi.log.info(`RWM Django-parity PostgreSQL constraints ready (${installed} DDL statements; ${oneToOneIndexes} one-to-one indexes).`); if (skipped.length > 0) strapi.log.warn(`RWM Django-parity PostgreSQL constraints skipped ${skipped.length} unsupported metadata bindings: ${skipped.join('; ')}`);
}
