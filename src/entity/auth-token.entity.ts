import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('auth_tokens')
export class AuthToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  user_id: number;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  phone_id: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  access_token?: string;

  @Column({ type: 'datetime' })
  expires_in_access_token: Date;

  @Column({ type: 'varchar', length: 50 })
  refresh_token: string;

  @Column({ type: 'datetime' })
  expires_in_refresh_token: Date;

  @Column({ type: 'datetime' })
  create_date: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  push_token?: string;

  @Column({ type: 'int' })
  role_id: number;

  @Column({ type: 'tinyint', default: 1, nullable: true })
  online?: number;

  @Column({ type: 'tinyint', default: 1, nullable: true })
  os_type?: number;

  @Column({ type: 'varchar', length: 25, nullable: true })
  app_version?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  voip_push_token?: string;
}
