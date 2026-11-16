import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableIndex,
} from 'typeorm';

export class AddAccountSyncFields1700000000001 implements MigrationInterface {
  name = 'AddAccountSyncFields1700000000001';

  async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');
    if (!table) {
      return;
    }
    if (!table.findColumnByName('centralId')) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'centralId',
          type: 'varchar',
          length: '64',
          isNullable: true,
        }),
      );
      await queryRunner.createIndex(
        'users',
        new TableIndex({
          name: 'UQ_users_centralId',
          columnNames: ['centralId'],
          isUnique: true,
        }),
      );
    }
    if (!table.findColumnByName('isActive')) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'isActive',
          type: 'boolean',
          default: true,
        }),
      );
    }
    if (!table.findColumnByName('updatedAt')) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'updatedAt',
          type: 'datetime',
          isNullable: true,
        }),
      );
    }
    await queryRunner.createTable(
      new Table({
        name: 'sync_state',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'deviceId', type: 'varchar', length: '128', isUnique: true },
          { name: 'lastSuccessfulAt', type: 'datetime', isNullable: true },
          {
            name: 'offlineAuthorizedUntil',
            type: 'datetime',
            isNullable: true,
          },
          { name: 'pendingCount', type: 'int', default: 0 },
          { name: 'revoked', type: 'boolean', default: false },
          {
            name: 'lastError',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
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
        name: 'sync_outbox',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'userId', type: 'int', isUnique: true },
          {
            name: 'operation',
            type: 'varchar',
            length: '32',
            default: "'UPSERT'",
          },
          {
            name: 'status',
            type: 'varchar',
            length: '16',
            default: "'PENDING'",
          },
          { name: 'attempts', type: 'int', default: 0 },
          {
            name: 'lastError',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
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
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('sync_outbox', true);
    await queryRunner.dropTable('sync_state', true);
    const table = await queryRunner.getTable('users');
    if (table?.indices.some((index) => index.name === 'UQ_users_centralId')) {
      await queryRunner.dropIndex('users', 'UQ_users_centralId');
    }
    if (table?.findColumnByName('updatedAt')) {
      await queryRunner.dropColumn('users', 'updatedAt');
    }
    if (table?.findColumnByName('isActive')) {
      await queryRunner.dropColumn('users', 'isActive');
    }
    if (table?.findColumnByName('centralId')) {
      await queryRunner.dropColumn('users', 'centralId');
    }
  }
}
