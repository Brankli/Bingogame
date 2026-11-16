import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class AddDeviceUserAssignments1700000000004
  implements MigrationInterface
{
  name = 'AddDeviceUserAssignments1700000000004';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'sync_device_users',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'deviceId', type: 'varchar', length: '128' },
          { name: 'centralId', type: 'varchar', length: '36' },
          {
            name: 'assignedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        uniques: [
          {
            name: 'UQ_sync_device_users_device_user',
            columnNames: ['deviceId', 'centralId'],
          },
        ],
        foreignKeys: [
          {
            name: 'FK_sync_device_users_device',
            columnNames: ['deviceId'],
            referencedTableName: 'sync_devices',
            referencedColumnNames: ['deviceId'],
            onDelete: 'CASCADE',
          },
          {
            name: 'FK_sync_device_users_user',
            columnNames: ['centralId'],
            referencedTableName: 'central_users',
            referencedColumnNames: ['centralId'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('sync_device_users', true);
  }
}
