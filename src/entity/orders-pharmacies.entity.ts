import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';
import { User } from './user.entity';

@Entity('orders_pharmacies')
export class OrdersPharmacies {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'pharmacy_id', type: 'int' })
    pharmacy_id: number;

    @Column({ name: 'order_id', type: 'int' })
    order_id: number;

    @Column({ name: 'status_id', type: 'int' })
    status_id: number;

    @Column({ name: 'new_doctor_id', type: 'int', nullable: true })
    new_doctor_id: number;

    @Column({ name: 'doctor_id', type: 'int', nullable: true })
    doctor_id: number;

    @Column({ name: 'hospital_id', type: 'int', nullable: true })
    hospital_id: number;

    @Column({ name: 'winner', type: 'int', default: 0, nullable: true })
    winner: number;

    @ManyToOne(() => Order, order => order.pharmacies)
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'pharmacy_id' })
    pharmacy: User;
}
