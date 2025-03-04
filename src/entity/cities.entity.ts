import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('cities')
export class Cities {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 2000 })
  alternative_names: string;

  @Column({ type: 'float' })
  lat: number;

  @Column({ type: 'float' })
  lon: number;

  @Column({ type: 'varchar', length: 50 })
  timezone: string;

  @Column({ type: 'int', nullable: true })
  country_id: number;

  @Column({ type: 'int' })
  active: number;

  @Column({ type: 'int', default: 0 })
  population: number;
}