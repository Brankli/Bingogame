import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSyncRevocation1700000000002 implements MigrationInterface {
  name = 'AddSyncRevocation1700000000002';

  async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('sync_state');
    if (table && !table.findColumnByName('revoked')) {
      await queryRunner.addColumn(
        'sync_state',
        new TableColumn({
          name: 'revoked',
          type: 'boolean',
          default: false,
        }),
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('sync_state');
    if (table?.findColumnByName('revoked')) {
      await queryRunner.dropColumn('sync_state', 'revoked');
    }
  }
}
