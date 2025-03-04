import { Entity, Column, PrimaryColumn, JoinColumn, ManyToOne } from 'typeorm';
import { Order } from './order.entity';

@Entity({ name: 'user_data' }) // Use @Entity instead of @ViewEntity
export class UserData {
    @PrimaryColumn()
    user_id: number; // Primary key (composite)

    @PrimaryColumn()
    field_key: string; // Primary key (composite)

    @Column()
    role_id: number;

    @Column({ type: 'varchar', length: 255 })
    field_value: string;

    @ManyToOne(() => Order, (order) => order.userData)
    @JoinColumn({ name: 'user_id' })
    order: Order;
}
