import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_otp')
export class UserOtp {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    user_id: number;

    @Column({ type: 'varchar', length: 4 })
    otp: string;  // Changed to string to handle leading zeros and more flexibility

    @Column({
        type: 'varchar',
        length: 255,
    })
    action: string;  // Changed to string for flexibility and handling large numbers

    @CreateDateColumn()
    create_date: Date;

    @UpdateDateColumn()
    update_date: Date;
}
