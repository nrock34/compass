import { randomUUID } from 'node:crypto';
import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import { createComment, toggleLike } from '../../../workflows/community-interactions';
import { transitionEditorialPublication } from '../../../workflows/editorial-publications';

const { NotFoundError, UnauthorizedError, ValidationError } = errors;
const POST_UID = 'api::post.post';

const POST_CATEGORIES = new Set(['opp', 'social', 'academic', 'housing', 'events']);
type AuthenticatedUser = {
  id?: number | string;
  username?: string;
  email?: string;
};

type MutationContext = {
  params: Record<string, string | undefined>;
  request: { body?: unknown };
  state: { user?: AuthenticatedUser | null };
  body?: unknown;
  status?: number;
};

type EntityRecord = Record<string, unknown> & {
  id: number | string;
  documentId?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

function objectBody(ctx: MutationContext): Record<string, unknown> {
  const value = ctx.request.body;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ValidationError('A JSON object body is required.');
  }
  return value as Record<string, unknown>;
}

function requiredText(value: unknown, name: string, maxLength: number): string {
  if (typeof value !== 'string') throw new ValidationError(`${name} must be a string.`);
  const text = value.trim();
  if (!text || text.length > maxLength) {
    throw new ValidationError(`${name} must contain between 1 and ${maxLength} characters.`);
  }
  return text;
}

function optionalText(value: unknown, name: string, maxLength: number): string | null {
  if (value == null || value === '') return null;
  return requiredText(value, name, maxLength);
}

function positiveIdentifier(value: unknown, name: string): number {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) throw new ValidationError(`${name} must be a positive integer.`);
  return id;
}

async function memberAuthor(strapi: Core.Strapi, ctx: MutationContext): Promise<EntityRecord> {
  const user = ctx.state.user;
  if (!user?.id) throw new UnauthorizedError('Authentication is required.');

  const authorQuery = strapi.db.query('api::author.author');
  const existing = await authorQuery.findOne({
    where: { associated_user: { id: user.id } },
  }) as EntityRecord | null;
  if (existing) return existing;

  return authorQuery.create({
    data: {
      public_id: randomUUID(),
      name: user.username || user.email || `Member ${String(user.id)}`,
      avatar: '',
      identity_type: 'member',
      associated_user: user.id,
    },
  }) as Promise<EntityRecord>;
}

async function postByRestId(strapi: Core.Strapi, value: unknown): Promise<EntityRecord> {
  const id = positiveIdentifier(value, 'post id');
  const post = await strapi.db.query(POST_UID).findOne({ where: { id } }) as EntityRecord | null;
  if (!post) throw new NotFoundError('Post not found.');
  return post;
}

async function postCategoryId(strapi: Core.Strapi, value: unknown): Promise<number | string | null> {
  if (value == null || value === '') return null;
  const name = requiredText(value, 'category', 32);
  if (!POST_CATEGORIES.has(name)) throw new ValidationError(`Unknown post category: ${name}.`);
  const categoryQuery = strapi.db.query('api::post-category.post-category');
  const existing = await categoryQuery.findOne({ where: { name } }) as EntityRecord | null;
  const category = existing ?? await categoryQuery.create({ data: { name } }) as EntityRecord;
  return category.id;
}

async function postTagIds(strapi: Core.Strapi, value: unknown): Promise<Array<number | string>> {
  if (!Array.isArray(value)) throw new ValidationError('tags must be an array.');
  const names = [...new Set(value.map((tag) => requiredText(tag, 'tag', 48).toLowerCase()))].slice(0, 20);
  if (names.length === 0) throw new ValidationError('At least one tag is required.');

  const tagQuery = strapi.db.query('api::post-tag.post-tag');
  const ids: Array<number | string> = [];
  for (const name of names) {
    const existing = await tagQuery.findOne({ where: { name } }) as EntityRecord | null;
    const tag = existing ?? await tagQuery.create({ data: { name } }) as EntityRecord;
    ids.push(tag.id);
  }
  return ids;
}

function authorPayload(author: EntityRecord): Record<string, unknown> {
  return {
    id: String(author.documentId ?? author.id),
    name: typeof author.name === 'string' ? author.name : 'Community Member',
    avatar: typeof author.avatar === 'string' && author.avatar ? author.avatar : null,
  };
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async createPost(ctx: MutationContext) {
    const input = objectBody(ctx);
    const author = await memberAuthor(strapi, ctx);
    const category = await postCategoryId(strapi, input.category);
    const tags = await postTagIds(strapi, input.tags);
    const published = input.published === true;
    const now = new Date();
    const post = await strapi.db.query(POST_UID).create({
      data: {
        title: requiredText(input.title, 'title', 200),
        content: requiredText(input.content, 'content', 600),
        type: requiredText(input.type, 'type', 32),
        category,
        tags,
        author: author.id,
        media: optionalText(input.media, 'media', 200),
        is_media_video: false,
      },
    }) as EntityRecord;
    if (published) {
      await transitionEditorialPublication(strapi, {
        uid: POST_UID,
        id: post.id,
        status: 'published',
        at: now,
      });
    }

    ctx.status = 201;
    ctx.body = {
      id: Number(post.id),
      documentId: post.documentId,
    };
  },

  async togglePostLike(ctx: MutationContext) {
    const author = await memberAuthor(strapi, ctx);
    const post = await postByRestId(strapi, ctx.params.id);
    ctx.body = await toggleLike(strapi, {
      authorId: author.id,
      targetUid: POST_UID,
      targetId: post.id,
    });
  },

  async createPostComment(ctx: MutationContext) {
    const input = objectBody(ctx);
    const author = await memberAuthor(strapi, ctx);
    const post = await postByRestId(strapi, ctx.params.id);
    const created = await createComment(strapi, {
      authorId: author.id,
      targetUid: POST_UID,
      targetId: post.id,
      content: requiredText(input.content, 'content', 500),
    });
    const comment = await strapi.db.query('api::comment.comment').findOne({
      where: { id: created.id },
    }) as EntityRecord | null;
    if (!comment) throw new NotFoundError('Created comment was not found.');

    ctx.status = 201;
    ctx.body = {
      id: String(comment.documentId ?? comment.id),
      rest_id: Number(comment.id),
      author: authorPayload(author),
      content: comment.content,
      created_at: new Date(comment.createdAt ?? Date.now()).toISOString(),
      updated_at: new Date(comment.updatedAt ?? comment.createdAt ?? Date.now()).toISOString(),
    };
  },
});
