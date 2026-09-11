import { randomUUID } from 'node:crypto';
import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import {
  advisoryInteractionLock,
  assertIdentifier,
  assertTargetUid,
  COMMUNITY_INTERACTION_TARGETS,
  idColumn,
  isPostgres,
  lockTarget,
  morphColumns,
  quoteIdentifier,
  resultRows,
  scalarColumn,
  table,
  timestampColumns,
  type CommunityInteractionTargetUid,
} from './community-interaction-support';

const { ValidationError } = errors;

function insertStatement(
  strapi: Core.Strapi,
  uid: string,
  values: Record<string, unknown>,
): { sql: string; bindings: unknown[] } {
  const columns = Object.keys(values);
  return {
    sql: `INSERT INTO ${table(strapi, uid)} (${columns.map(quoteIdentifier).join(', ')}) VALUES (${columns.map(() => '?').join(', ')}) RETURNING ${quoteIdentifier(idColumn(strapi, uid))}`,
    bindings: columns.map((column) => values[column]),
  };
}

export type ToggleLikeInput = {
  authorId: number | string;
  targetUid: CommunityInteractionTargetUid;
  targetId: number | string;
  at?: Date;
};

/**
 * Atomically toggle an author's like. The service serializes same-author
 * toggles; the installed PostgreSQL trigger applies the counter delta.
 */
export async function toggleLike(strapi: Core.Strapi, input: ToggleLikeInput): Promise<{ liked: boolean }> {
  if (!isPostgres(strapi)) {
    throw new ValidationError('Atomic community interactions require PostgreSQL.');
  }
  assertTargetUid(input.targetUid);
  const authorId = assertIdentifier(input.authorId, 'authorId');
  const targetId = assertIdentifier(input.targetId, 'targetId');
  const likeUid = 'api::like.like';

  return strapi.db.transaction(async ({ trx }) => {
    await lockTarget(strapi, trx, input.targetUid, targetId);
    await advisoryInteractionLock(trx, input.targetUid, targetId, authorId);

    const authorColumn = scalarColumn(strapi, likeUid, 'author');
    const subject = morphColumns(strapi, likeUid, 'subject');
    const likeTable = table(strapi, likeUid);
    const existing = resultRows(await trx.raw(
      `SELECT ${quoteIdentifier(idColumn(strapi, likeUid))} FROM ${likeTable} WHERE ${quoteIdentifier(authorColumn)} = ? AND ${quoteIdentifier(subject.type)} = ? AND ${quoteIdentifier(subject.id)} = ? FOR UPDATE`,
      [authorId, input.targetUid, targetId],
    ))[0];

    if (existing) {
      await trx.raw(
        `DELETE FROM ${likeTable} WHERE ${quoteIdentifier(idColumn(strapi, likeUid))} = ?`,
        [existing[idColumn(strapi, likeUid)]],
      );
      return { liked: false };
    }

    const now = input.at ?? new Date();
    const statement = insertStatement(strapi, likeUid, {
      [authorColumn]: authorId,
      [subject.type]: input.targetUid,
      [subject.id]: targetId,
      ...timestampColumns(strapi, likeUid, now, true),
    });
    await trx.raw(statement.sql, statement.bindings);
    return { liked: true };
  });
}

export type CreateCommentInput = {
  authorId: number | string;
  targetUid: CommunityInteractionTargetUid;
  targetId: number | string;
  content: string;
  at?: Date;
};

/** Create a comment while target existence and the counter change share one transaction. */
export async function createComment(strapi: Core.Strapi, input: CreateCommentInput): Promise<{ id: unknown }> {
  if (!isPostgres(strapi)) {
    throw new ValidationError('Atomic community interactions require PostgreSQL.');
  }
  assertTargetUid(input.targetUid);
  const authorId = assertIdentifier(input.authorId, 'authorId');
  const targetId = assertIdentifier(input.targetId, 'targetId');
  if (typeof input.content !== 'string' || input.content.length > 500) {
    throw new ValidationError('Comment content must be a string no longer than 500 characters.');
  }

  const commentUid = 'api::comment.comment';
  return strapi.db.transaction(async ({ trx }) => {
    await lockTarget(strapi, trx, input.targetUid, targetId);
    const authorColumn = scalarColumn(strapi, commentUid, 'author');
    const subject = morphColumns(strapi, commentUid, 'subject');
    const statement = insertStatement(strapi, commentUid, {
      [authorColumn]: authorId,
      [scalarColumn(strapi, commentUid, 'documentId')]: randomUUID(),
      content: input.content,
      [subject.type]: input.targetUid,
      [subject.id]: targetId,
      ...timestampColumns(strapi, commentUid, input.at ?? new Date(), true),
    });
    const row = resultRows(await trx.raw(statement.sql, statement.bindings))[0];
    return { id: row?.[idColumn(strapi, commentUid)] };
  });
}

export { COMMUNITY_INTERACTION_TARGETS };
export { installCommunityInteractionTriggers, reconcileCommunityCounters } from './community-counter-triggers';
