import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity'; // Import User entity
import { UserData } from './userdata.entity';
import { OrdersPharmacies } from './orders-pharmacies.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number; // Foreign key for User (the one who placed the order)

  @Column()
  delivery_men: number; // Foreign key for DeliveryMen (User as delivery man)

  @Column()
  country: string;

  @Column()
  city_id: number;

  @Column('decimal', { precision: 10, scale: 6 })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 6 })
  longitude: number;

  @Column()
  create_date: Date;

  @Column()
  user_order_status: number;

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, (user) => user.deliveryMenOrders)
  @JoinColumn({ name: 'delivery_men' })
  deliveryMen: User;

  @OneToMany(() => UserData, (userData) => userData.order)
  @JoinColumn({ name: 'user_id' })
  userData: UserData[];

  @OneToMany(() => OrdersPharmacies, (orderPharmacy) => orderPharmacy.order)
  pharmacies: OrdersPharmacies[];
}
