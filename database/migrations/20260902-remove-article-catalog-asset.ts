import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('editorial_article', 'catalog_asset_id');
  if (hasColumn) {
    await knex.schema.alterTable('editorial_article', (table) => {
      table.dropColumn('catalog_asset_id');
    });
  }
}
