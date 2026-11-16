import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMatchFinancialFields1763400000000
  implements MigrationInterface
{
  name = 'AddMatchFinancialFields1763400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const matchTable = await queryRunner.getTable('match');
    if (!matchTable) {
      return;
    }

    if (!matchTable.findColumnByName('betAmount')) {
      await queryRunner.addColumn(
        'match',
        new TableColumn({
          name: 'betAmount',
          type: 'float',
          isNullable: true,
        }),
      );
    }

    if (!matchTable.findColumnByName('houseFeePercent')) {
      await queryRunner.addColumn(
        'match',
        new TableColumn({
          name: 'houseFeePercent',
          type: 'float',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const matchTable = await queryRunner.getTable('match');
    if (!matchTable) {
      return;
    }

    if (matchTable.findColumnByName('houseFeePercent')) {
      await queryRunner.dropColumn('match', 'houseFeePercent');
    }
    if (matchTable.findColumnByName('betAmount')) {
      await queryRunner.dropColumn('match', 'betAmount');
    }
  }
}
