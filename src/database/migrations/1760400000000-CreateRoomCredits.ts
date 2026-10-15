import {
  MigrationInterface,
  QueryRunner,
} from 'typeorm';

export class CreateRoomCredits1760400000000
  implements MigrationInterface
{
  name = 'CreateRoomCredits1760400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE room_credits (
        id INT NOT NULL AUTO_INCREMENT,
        roomId INT NOT NULL,
        balance INT NOT NULL DEFAULT 0,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL
          DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY UQ_room_credits_roomId (roomId),
        CONSTRAINT FK_room_credits_room
          FOREIGN KEY (roomId)
          REFERENCES rooms(id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE room_credit_transactions (
        id INT NOT NULL AUTO_INCREMENT,
        roomId INT NOT NULL,
        type VARCHAR(32) NOT NULL,
        amount INT NOT NULL,
        balanceAfter INT NOT NULL,
        idempotencyKey VARCHAR(128) NULL,
        matchId INT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'COMMITTED',
        performedByUserId INT NULL,
        note VARCHAR(500) NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY UQ_room_credit_tx_idempotency_key (idempotencyKey),
        KEY IDX_room_credit_tx_roomId (roomId),
        CONSTRAINT FK_room_credit_tx_room
          FOREIGN KEY (roomId)
          REFERENCES rooms(id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    // Existing rooms receive a zero balance.
    await queryRunner.query(`
      INSERT INTO room_credits (roomId, balance)
      SELECT id, 0 FROM rooms
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP TABLE room_credit_transactions',
    );
    await queryRunner.query('DROP TABLE room_credits');
  }
}
