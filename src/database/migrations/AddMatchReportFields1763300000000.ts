import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMatchReportFields1763300000000 implements MigrationInterface {
  name = 'AddMatchReportFields1763300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const matchTable = await queryRunner.getTable('match');
    if (!matchTable) {
      return;
    }

    const dateType =
      queryRunner.connection.options.type === 'postgres'
        ? 'timestamp'
        : 'datetime';

    if (!matchTable.findColumnByName('createdAt')) {
      await queryRunner.addColumn(
        'match',
        new TableColumn({
          name: 'createdAt',
          type: dateType,
          isNullable: false,
          default: 'CURRENT_TIMESTAMP',
        }),
      );
    }

    if (!matchTable.findColumnByName('payoutAmount')) {
      await queryRunner.addColumn(
        'match',
        new TableColumn({
          name: 'payoutAmount',
          type: 'float',
          default: 0,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const matchTable = await queryRunner.getTable('match');
    if (!matchTable) {
      return;
    }

    if (matchTable.findColumnByName('payoutAmount')) {
      await queryRunner.dropColumn('match', 'payoutAmount');
    }
    if (matchTable.findColumnByName('createdAt')) {
      await queryRunner.dropColumn('match', 'createdAt');
    }
  }
}
