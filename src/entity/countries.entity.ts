import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('countries')
export class Counties {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 2, unique: true })
  country_code: string;

  @Column({ type: 'int', default: 1 })
  digits_phone_number: number;

  @Column({ type: 'varchar', length: 5 })
  phone_country_code: string;

  @Column({ type: 'int', nullable: true, default: 0 })
  status: number;

  @Column({ type: 'int', nullable: true, default: 0 })
  show_insurance_company: number;

  @Column({ type: 'int', default: 0 })
  currency_id: number;
}