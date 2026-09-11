import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import {
  counterTargets,
  isPostgres,
  morphColumns,
  qualified,
  quoteIdentifier,
  quoteLiteral,
  schemaName,
  table,
  type CounterTarget,
} from './community-interaction-support';

const { ValidationError } = errors;

function counterAdjustmentCases(targets: readonly CounterTarget[], counter: 'like' | 'comment'): string {
  return targets.map((target) => (
    `    WHEN ${quoteLiteral(target.uid)} THEN\n`
    + `      UPDATE ${target.table}\n`
    + `      SET ${quoteIdentifier(target[counter])} = GREATEST(COALESCE(${quoteIdentifier(target[counter])}, 0) + p_delta, 0)\n`
    + `      WHERE ${quoteIdentifier(target.id)} = p_target_id;`
  )).join('\n');
}

async function installCounterTrigger(
  strapi: Core.Strapi,
  sourceUid: 'api::like.like' | 'api::comment.comment',
  counter: 'like' | 'comment',
  targets: readonly CounterTarget[],
): Promise<void> {
  const sourceTable = table(strapi, sourceUid);
  const subject = morphColumns(strapi, sourceUid, 'subject');
  const schema = schemaName(strapi);
  const functionName = `rwm_${counter}_counter_adjust`;
  const triggerName = `rwm_${counter}_counter_trigger`;
  const functionRef = qualified(schema, functionName);
  const triggerRef = quoteIdentifier(triggerName);
  const cases = counterAdjustmentCases(targets, counter);

  await strapi.db.connection.raw(
    `CREATE OR REPLACE FUNCTION ${functionRef}(p_target_type text, p_target_id bigint, p_delta integer)\n`
      + `RETURNS void LANGUAGE plpgsql AS $rwm$\nBEGIN\n  CASE p_target_type\n${cases}\n  END CASE;\nEND\n$rwm$;`,
  );
  await strapi.db.connection.raw(
    `CREATE OR REPLACE FUNCTION ${qualified(schema, `rwm_${counter}_counter_trigger_fn`)}()\n`
      + `RETURNS trigger LANGUAGE plpgsql AS $rwm$\nBEGIN\n`
      + `  IF TG_OP = 'DELETE' THEN\n`
      + `    PERFORM ${functionRef}(OLD.${quoteIdentifier(subject.type)}, OLD.${quoteIdentifier(subject.id)}, -1);\n`
      + `    RETURN OLD;\n`
      + `  ELSIF TG_OP = 'UPDATE' THEN\n`
      + `    IF OLD.${quoteIdentifier(subject.type)} IS DISTINCT FROM NEW.${quoteIdentifier(subject.type)}\n`
      + `       OR OLD.${quoteIdentifier(subject.id)} IS DISTINCT FROM NEW.${quoteIdentifier(subject.id)} THEN\n`
      + `      PERFORM ${functionRef}(OLD.${quoteIdentifier(subject.type)}, OLD.${quoteIdentifier(subject.id)}, -1);\n`
      + `      PERFORM ${functionRef}(NEW.${quoteIdentifier(subject.type)}, NEW.${quoteIdentifier(subject.id)}, 1);\n`
      + `    END IF;\n`
      + `    RETURN NEW;\n`
      + `  END IF;\n`
      + `  PERFORM ${functionRef}(NEW.${quoteIdentifier(subject.type)}, NEW.${quoteIdentifier(subject.id)}, 1);\n`
      + `  RETURN NEW;\nEND\n$rwm$;`,
  );
  await strapi.db.connection.raw(`DROP TRIGGER IF EXISTS ${triggerRef} ON ${sourceTable};`);
  await strapi.db.connection.raw(
    `CREATE TRIGGER ${triggerRef}\nAFTER INSERT OR DELETE OR UPDATE OF ${quoteIdentifier(subject.type)}, ${quoteIdentifier(subject.id)} ON ${sourceTable}\nFOR EACH ROW EXECUTE FUNCTION ${qualified(schema, `rwm_${counter}_counter_trigger_fn`)}();`,
  );
}

async function installTargetCascadeTrigger(strapi: Core.Strapi, target: CounterTarget): Promise<void> {
  const schema = schemaName(strapi);
  const targetToken = target.uid.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const functionName = `rwm_morph_cascade_${targetToken}`;
  const triggerName = `rwm_morph_cascade_${targetToken}`.slice(0, 60);
  const commentSubject = morphColumns(strapi, 'api::comment.comment', 'subject');
  const likeSubject = morphColumns(strapi, 'api::like.like', 'subject');
  const functionRef = qualified(schema, functionName);

  await strapi.db.connection.raw(
    `CREATE OR REPLACE FUNCTION ${functionRef}()\nRETURNS trigger LANGUAGE plpgsql AS $rwm$\nBEGIN\n`
      + `  DELETE FROM ${table(strapi, 'api::comment.comment')} WHERE ${quoteIdentifier(commentSubject.type)} = ${quoteLiteral(target.uid)} AND ${quoteIdentifier(commentSubject.id)} = OLD.${quoteIdentifier(target.id)};\n`
      + `  DELETE FROM ${table(strapi, 'api::like.like')} WHERE ${quoteIdentifier(likeSubject.type)} = ${quoteLiteral(target.uid)} AND ${quoteIdentifier(likeSubject.id)} = OLD.${quoteIdentifier(target.id)};\n`
      + `  RETURN OLD;\nEND\n$rwm$;`,
  );
  await strapi.db.connection.raw(`DROP TRIGGER IF EXISTS ${quoteIdentifier(triggerName)} ON ${target.table};`);
  await strapi.db.connection.raw(
    `CREATE TRIGGER ${quoteIdentifier(triggerName)} AFTER DELETE ON ${target.table}\nFOR EACH ROW EXECUTE FUNCTION ${functionRef}();`,
  );
}

/** Install database-level native-morph counter and delete-cascade behavior. */
export async function installCommunityInteractionTriggers(strapi: Core.Strapi): Promise<void> {
  if (!isPostgres(strapi)) return;
  const targets = counterTargets(strapi);
  await installCounterTrigger(strapi, 'api::like.like', 'like', targets);
  await installCounterTrigger(strapi, 'api::comment.comment', 'comment', targets);
  for (const target of targets) await installTargetCascadeTrigger(strapi, target);
  strapi.log.info('RWM native-morph interaction counters and cascades ready.');
}

/** Repair counters under locks; use only from an operations job or admin action. */
export async function reconcileCommunityCounters(strapi: Core.Strapi): Promise<void> {
  if (!isPostgres(strapi)) {
    throw new ValidationError('Counter reconciliation requires PostgreSQL.');
  }
  const targets = counterTargets(strapi);
  const likeTable = table(strapi, 'api::like.like');
  const commentTable = table(strapi, 'api::comment.comment');
  const likeSubject = morphColumns(strapi, 'api::like.like', 'subject');
  const commentSubject = morphColumns(strapi, 'api::comment.comment', 'subject');

  await strapi.db.transaction(async ({ trx }) => {
    await trx.raw('SELECT pg_advisory_xact_lock(hashtext(?))', ['rwm:community-counter-reconciliation']);
    await trx.raw(`LOCK TABLE ${likeTable}, ${commentTable}, ${targets.map((target) => target.table).join(', ')} IN SHARE ROW EXCLUSIVE MODE;`);

    for (const target of targets) {
      await trx.raw(
        `UPDATE ${target.table} AS target SET ${quoteIdentifier(target.like)} = COALESCE((SELECT COUNT(*) FROM ${likeTable} AS interaction WHERE interaction.${quoteIdentifier(likeSubject.type)} = ${quoteLiteral(target.uid)} AND interaction.${quoteIdentifier(likeSubject.id)} = target.${quoteIdentifier(target.id)}), 0), ${quoteIdentifier(target.comment)} = COALESCE((SELECT COUNT(*) FROM ${commentTable} AS interaction WHERE interaction.${quoteIdentifier(commentSubject.type)} = ${quoteLiteral(target.uid)} AND interaction.${quoteIdentifier(commentSubject.id)} = target.${quoteIdentifier(target.id)}), 0);`,
      );
    }
  });
}
