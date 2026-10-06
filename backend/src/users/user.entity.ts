import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 320 })
  email!: string;

  @Column({ name: 'password_hash', select: false })
  passwordHash!: string;

  @Column({ name: 'full_name', length: 120 })
  fullName!: string;

  @Column({ name: 'phone_number', length: 30, nullable: true })
  phoneNumber!: string | null;

  @Column({ length: 500, nullable: true })
  avatarUrl!: string | null;

  @Column({ length: 1000, nullable: true })
  bio!: string | null;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ name: 'refresh_token_hash', nullable: true, select: false })
  refreshTokenHash!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
