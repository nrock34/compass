import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';

const { UnauthorizedError, ValidationError } = errors;

type AuthContext = {
  state: { user?: { id?: number | string; username?: string } };
  body?: unknown;
  request?: { body?: Record<string, unknown> };
};

type RecordValue = Record<string, unknown>;

function userId(ctx: AuthContext): number | string {
  const id = ctx.state.user?.id;
  if (id == null || id === '') throw new UnauthorizedError('Authentication is required.');
  return id;
}

async function savedTargets(
  strapi: Core.Strapi,
  uid: string,
  relation: string,
  id: number | string,
): Promise<unknown[]> {
  const rows = await strapi.db.query(uid).findMany({
    where: { user: id },
    populate: [relation],
    orderBy: { saved_at: 'desc' },
  }) as RecordValue[];
  return rows.flatMap((row) => row[relation] == null ? [] : [row[relation]]);
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async accountInfo(ctx: AuthContext) {
    const account = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: userId(ctx) },
      select: ['id', 'email', 'username', 'first_name', 'last_name'],
    });
    if (!account) throw new UnauthorizedError('Account not found.');
    ctx.body = {
      email: account.email,
      username: account.username,
      first_name: account.first_name ?? '',
      last_name: account.last_name ?? '',
    };
  },

  async profileInfo(ctx: AuthContext) {
    const id = userId(ctx);
    const [account, profile, sensitive] = await Promise.all([
      strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id }, select: ['id', 'username', 'first_name', 'last_name'],
      }),
      strapi.db.query('api::user-profile-info.user-profile-info').findOne({
        where: { user: id }, select: ['bio', 'avatar'],
      }),
      strapi.db.query('api::user-sensitive-info.user-sensitive-info').findOne({
        where: { user: id }, select: ['dob'],
      }),
    ]);
    if (!account) throw new UnauthorizedError('Account not found.');
    ctx.body = {
      username: account.username,
      first_name: account.first_name ?? '',
      last_name: account.last_name ?? '',
      bio: profile?.bio ?? '',
      avatar: profile?.avatar ?? '',
      birthday: sensitive?.dob ?? '',
    };
  },

  async updateEducation(ctx: AuthContext) {
    const id = userId(ctx);
    const input = ctx.request?.body ?? {};
    const university = Number(input.university);
    const year = Number(input.year);
    const major = typeof input.major === 'string' ? input.major.trim() : '';
    if (!Number.isSafeInteger(university) || university <= 0) throw new ValidationError('Select a university.');
    if (!major) throw new ValidationError('Enter your major.');
    if (!Number.isInteger(year) || year < 2010) throw new ValidationError('Select a valid graduation year.');
    const selectedUniversity = await strapi.db.query('api::university.university').findOne({
      where: { id: university }, select: ['id'],
    });
    if (!selectedUniversity) throw new ValidationError('The selected university is unavailable.');

    await strapi.db.transaction(async ({ trx }) => {
      // Serialize first-time saves for this user so they cannot create duplicate profiles.
      const userTable = strapi.db.metadata.get('plugin::users-permissions.user').tableName;
      await strapi.db.connection(userTable).transacting(trx).where({ id }).forUpdate().first('id');
      const uid = 'api::user-education-info.user-education-info';
      const existing = await strapi.db.query(uid).findOne({ where: { user: id } });
      const data = { university, major, year };
      if (existing) {
        await strapi.documents(uid).update({ documentId: existing.documentId, data });
      } else {
        await strapi.documents(uid).create({ data: { ...data, user: id } });
      }
    });
    ctx.body = { university, major, year };
  },

  async educationInfo(ctx: AuthContext) {
    const education = await strapi.db.query('api::user-education-info.user-education-info').findOne({
      where: { user: userId(ctx) },
      select: ['major', 'year'],
      populate: { university: { select: ['id'] } },
    });
    ctx.body = {
      university: education?.university?.id ?? '',
      major: education?.major ?? '',
      year: education?.year ?? null,
    };
  },

  async activity(ctx: AuthContext) {
    const id = userId(ctx);
    const rows = await strapi.db.query('api::user-profile-activity.user-profile-activity').findMany({
      where: { user: id },
      orderBy: { timestamp: 'desc' },
      limit: 50,
    }) as RecordValue[];
    ctx.body = rows.map((row) => ({
      id: row.id,
      type: 'activity',
      action: row.action,
      target: row.description,
      timestamp: row.timestamp,
      user: ctx.state.user?.username ?? '',
    }));
  },

  async applications(ctx: AuthContext) {
    const id = userId(ctx);
    const rows = await strapi.db.query('api::tracked-application.tracked-application').findMany({
      where: { user: id },
      populate: ['for_program', 'for_scholarship', 'for_external'],
      orderBy: { tracked_since: 'desc' },
    }) as RecordValue[];
    ctx.body = rows.map((row) => ({
      id: row.id,
      type: row.type,
      status: row.status,
      submitted: row.submitted,
      progress: row.progress,
      application_to: row.for_program ?? row.for_scholarship ?? row.for_external ?? null,
      app_info: { deadline: row.submission_on },
    }));
  },

  async savedItems(ctx: AuthContext) {
    const id = userId(ctx);
    const [programs, scholarships, resources] = await Promise.all([
      savedTargets(strapi, 'api::saved-program.saved-program', 'program', id),
      savedTargets(strapi, 'api::saved-scholarship.saved-scholarship', 'scholarship', id),
      savedTargets(strapi, 'api::saved-resource.saved-resource', 'resource', id),
    ]);
    ctx.body = { programs, scholarships, resources };
  },
});
