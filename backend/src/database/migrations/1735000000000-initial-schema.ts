import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class InitialSchema1735000000000 implements MigrationInterface {
  name = 'InitialSchema1735000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: 'users',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
        { name: 'email', type: 'varchar', length: '320', isUnique: true },
        { name: 'password_hash', type: 'varchar' },
        { name: 'full_name', type: 'varchar', length: '120' },
        { name: 'phone_number', type: 'varchar', length: '30', isNullable: true },
        { name: 'avatar_url', type: 'varchar', length: '500', isNullable: true },
        { name: 'bio', type: 'varchar', length: '1000', isNullable: true },
        { name: 'is_active', type: 'boolean', default: true },
        { name: 'refresh_token_hash', type: 'varchar', isNullable: true },
        { name: 'created_at', type: 'timestamptz', default: 'now()' },
        { name: 'updated_at', type: 'timestamptz', default: 'now()' },
      ],
    }));
  }

  async down(queryRunner: QueryRunner): Promise<void> { await queryRunner.dropTable('users'); }
}
