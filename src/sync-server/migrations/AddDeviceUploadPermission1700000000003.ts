import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDeviceUploadPermission1700000000003
  implements MigrationInterface
{
  name = 'AddDeviceUploadPermission1700000000003';

  async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('sync_devices');
    if (table && !table.findColumnByName('canUpload')) {
      await queryRunner.addColumn(
        'sync_devices',
        new TableColumn({
          name: 'canUpload',
          type: 'boolean',
          default: false,
        }),
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('sync_devices');
    if (table?.findColumnByName('canUpload')) {
      await queryRunner.dropColumn('sync_devices', 'canUpload');
    }
  }
}
