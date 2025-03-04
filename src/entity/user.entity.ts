import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { UserData } from './userdata.entity'; // Import UserData entity
import { Order } from './order.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

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

  @Column({ type: 'varchar', nullable: true })
  latitude: string;

  @Column({ type: 'varchar', nullable: true })
  longitude: string;

  // One-to-many relationship with orders where the user is the customer
  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  // One-to-many relationship with orders where the user is the delivery man
  @OneToMany(() => Order, (order) => order.deliveryMen)
  deliveryMenOrders: Order[];

  // One-to-many relationship with UserData
  @OneToMany(() => UserData, (userData) => userData.user_id)
  userData: UserData[];
}
