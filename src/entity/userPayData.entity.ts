import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity('user_pay_data')
export class UserPayData {
    @PrimaryColumn({ type: 'int' })
    user_id: number;

    @PrimaryColumn({ type: 'varchar', length: 50 })
    pay_system: string;

    @Column({ type: 'varchar', length: 255 })
    pay_type: string;

    @PrimaryColumn({ type: 'varchar', length: 50 })
    field_key: string;

    @Column({ type: 'varchar', length: 255 })
    field_value: string;

    @Column({ type: 'int', default: 0 })
    priority: number;
}