import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255 })
    firstName: string;

    @Column({ type: 'varchar', length: 255 })
    lastName: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    login_email: string;

    @Column({ type: 'varchar', length: 255, select: false }) // Ensure password is selectable when needed
    password: string;

    @Column({ type: 'varchar', length: 255 })
    login_phone: string;

    @Column({ type: 'varchar', length: 10 })
    phone_code: string;

    @Column({ type: 'varchar', length: 20, unique: true })
    phone_number: string;

    @Column({ type: 'boolean', default: true })
    status: boolean;

    @Column({ type: 'timestamp', nullable: true })
    lastLoginAt: Date;

    @Column({ type: 'varchar', nullable: true })
    device: string;

    @Column({ type: 'varchar', nullable: true })
    latitude: string;

    @Column({ type: 'varchar', nullable: true })
    longitude: string;
}
