import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateRoomCredits1760400000000 implements MigrationInterface {
  name = 'CreateRoomCredits1760400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'room_credits',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'roomId', type: 'integer' },
          { name: 'balance', type: 'integer', default: 0 },
          { name: 'createdAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        ],
        uniques: [{ name: 'UQ_room_credits_roomId', columnNames: ['roomId'] }],
        foreignKeys: [
          {
            name: 'FK_room_credits_room',
            columnNames: ['roomId'],
            referencedTableName: 'rooms',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );
    await queryRunner.createTable(
      new Table({
        name: 'room_credit_transactions',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'roomId', type: 'integer' },
          { name: 'type', type: 'varchar', length: '32' },
          { name: 'amount', type: 'integer' },
          { name: 'balanceAfter', type: 'integer' },
          {
            name: 'idempotencyKey',
            type: 'varchar',
            length: '128',
            isNullable: true,
          },
          { name: 'matchId', type: 'integer', isNullable: true },
          {
            name: 'status',
            type: 'varchar',
            length: '32',
            default: "'COMMITTED'",
          },
          { name: 'performedByUserId', type: 'integer', isNullable: true },
          { name: 'note', type: 'varchar', length: '500', isNullable: true },
          { name: 'createdAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        ],
        indices: [
          {
            name: 'UQ_room_credit_tx_idempotency_key',
            columnNames: ['idempotencyKey'],
            isUnique: true,
          },
          { name: 'IDX_room_credit_tx_roomId', columnNames: ['roomId'] },
        ],
        foreignKeys: [
          {
            name: 'FK_room_credit_tx_room',
            columnNames: ['roomId'],
            referencedTableName: 'rooms',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Existing rooms receive a zero balance.
    await queryRunner.query(`
      INSERT INTO room_credits (roomId, balance)
      SELECT rooms.id, 0
      FROM rooms
      WHERE NOT EXISTS (
        SELECT 1
        FROM room_credits
        WHERE room_credits.roomId = rooms.id
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE room_credit_transactions');
    await queryRunner.query('DROP TABLE room_credits');
  }
}
