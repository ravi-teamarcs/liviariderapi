import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('faq')
export class Faq {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'text' })
  answer: string;

  @Column({ type: 'varchar', length: 100 })
  lang: number;

  @Column({ type: 'int' })
  sorting: number;

  @Column({ type: 'int' })
  role_id: number;
}