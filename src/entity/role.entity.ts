import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('role')
export class Role {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 50, unique: true })
    name: string;

    // @Column({ type: 'varchar', length: 255, nullable: true })
    // description: string;

    @Column({ type: 'boolean', default: true })
    status: boolean;
}
