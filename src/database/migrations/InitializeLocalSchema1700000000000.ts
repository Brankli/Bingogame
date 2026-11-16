import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the current local schema only for a genuinely fresh installation.
 * Existing databases are changed exclusively by the incremental migrations.
 */
export class InitializeLocalSchema1700000000000 implements MigrationInterface {
  name = 'InitializeLocalSchema1700000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('users')) {
      return;
    }

    const schemaBuilder = queryRunner.connection.driver.createSchemaBuilder();
    const schema = await schemaBuilder.log();
    for (const query of schema.upQueries) {
      await queryRunner.query(query.query, query.parameters);
    }
  }

  async down(): Promise<void> {
    // Fresh-install schema rollback is intentionally not destructive.
  }
}
