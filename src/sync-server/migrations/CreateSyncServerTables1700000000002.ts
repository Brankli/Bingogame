import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateSyncServerTables1700000000002 implements MigrationInterface {
  name = 'CreateSyncServerTables1700000000002';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'central_users',
        columns: [
          { name: 'centralId', type: 'varchar', length: '36', isPrimary: true },
          { name: 'username', type: 'varchar', length: '255', isUnique: true },
          { name: 'passwordHash', type: 'varchar', length: '255' },
          { name: 'role', type: 'varchar', length: '32' },
          { name: 'isActive', type: 'boolean', default: true },
          { name: 'sourceUpdatedAt', type: 'datetime', isNullable: true },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );
    await queryRunner.createTable(
      new Table({
        name: 'sync_devices',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'deviceId', type: 'varchar', length: '128', isUnique: true },
          { name: 'secretHash', type: 'varchar', length: '255' },
          { name: 'isActive', type: 'boolean', default: true },
          { name: 'canUpload', type: 'boolean', default: false },
          { name: 'lastHeartbeatAt', type: 'datetime', isNullable: true },
          { name: 'createdAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );
    await queryRunner.createTable(
      new Table({
        name: 'sync_logs',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'deviceId', type: 'varchar', length: '128' },
          { name: 'operation', type: 'varchar', length: '32' },
          { name: 'success', type: 'boolean', default: true },
          { name: 'message', type: 'varchar', length: '500', isNullable: true },
          { name: 'createdAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('sync_logs', true);
    await queryRunner.dropTable('sync_devices', true);
    await queryRunner.dropTable('central_users', true);
  }
}
