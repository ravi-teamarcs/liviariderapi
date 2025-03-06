import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entity/order.entity'; 
import { UserData } from 'src/entity/userdata.entity'; // Import UserData entity
import { BaseService } from 'src/common/services/base.service';
import { OrdersPharmacies } from 'src/entity/orders-pharmacies.entity';
import { Request } from 'express';
import { User } from 'src/entity/user.entity';

interface RequestWithUser extends Request {
  user: {
    id: number;
    role: string;
  }
}

@Injectable()
export class DeliveryMenService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,

    @InjectRepository(UserData)
    private userDataRepository: Repository<UserData>,

    @InjectRepository(OrdersPharmacies)
    private ordersPharmaciesRepository: Repository<OrdersPharmacies>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    private baseService: BaseService
  ) {  }

  // Method to get orders by delivery men
  // async getOrdersByDeliveryMen(req: any) {
  //   const { id } = req.user;
  //   const deliveryMenId = id;
  //   const query = this.orderRepository
  //     .createQueryBuilder('order')
  //     .leftJoinAndSelect('order.user', 'user')
  //     .leftJoinAndSelect('order.userData', 'user_data')
  //     .where('order.delivery_men = :deliveryMenId', { deliveryMenId });
  
  //   // if (startDate && endDate) {
  //   //   query.andWhere('order.create_date BETWEEN :startDate AND :endDate', {
  //   //     startDate,
  //   //     endDate,
  //   //   });
  //   // }
  
  //   const data = await query
  //     .select([
  //       'order.id',
  //       'order.user_id',
  //       'order.delivery_men',
  //       'order.latitude',
  //       'order.longitude',
  //       'order.country',
  //       'order.city_id',
  //       'order.create_date',
  //       // 'user.id AS user_id',
  //       // 'user.login_email',
  //       // 'user.phone_number',
  //       // 'user_data.field_value AS first_name',
  //       // 'user_data.field_value AS last_name',
  //     ])
  //     .getMany();
  
  //   const result = await Promise.all(data.map(async (order) => {
  //     const user = await this.baseService.getUserDetails(order.user_id, 4);
  //     const location = await this.baseService.getLocationFromLatLong(order.latitude, order.longitude);
  
  //     delete order.latitude,
  //     delete order.longitude
      
  //     return {
  //       ...order,
  //       location,
  //       userData: user,
  //     };
  //   }));
  //   return result;
  // }

  async getUserDetails(id: number, role: number) {
    const userDataArray = await this.userDataRepository
      .createQueryBuilder('userData')
      .where('userData.user_id = :id AND userData.role_id = :role', { id, role })
      .getMany();

    const userData = userDataArray.reduce((acc, curr) => {
      acc[curr.field_key] = curr.field_value;
      return acc;
    }, {});

    return userData;
  }

  async getOrdersByDeliveryMen(req: any) {
    const { id } = req.user;
    const deliveryMenId = id;
    
    const query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.userData', 'user_data')
      .where('order.delivery_men = :deliveryMenId AND order.user_order_status = :status', { deliveryMenId , status: 7 });

    const data = await query
      .select([
        'order.id',
        'order.user_id',
        'order.user_order_status',
        'order.delivery_men',
        'order.latitude',
        'order.longitude',
        'order.country',
        'order.city_id',
        'order.create_date',
      ])
      .getMany();

    try {
      const result = await Promise.all(data.map(async (order) => {
        const { latitude, longitude, user_order_status, ...orderWithoutLocation } = order;
        const pharmacies = await this.ordersPharmaciesRepository
        .createQueryBuilder('op')
        .leftJoinAndSelect('op.pharmacy', 'pharmacy')
        .select([
            'op.id',
            'op.order_id',
            'op.status_id',
            'pharmacy.id',
            'pharmacy.latitude',
            'pharmacy.longitude',
        ])
        .where('op.winner = :winner', { winner: 1 })
        .andWhere('op.order_id = :orderId', { orderId: order.id })
        .getMany();
        
        const orderStatus = user_order_status === 7 ? 'Delivered' : '';
        
        const [user, pharmacy , pharmacieslocation , location] = await Promise.all([
          this.getUserDetails(order.user_id, 4),
          this.getUserDetails(pharmacies[0].pharmacy.id, 3),
          this.baseService.getLocationFromLatLong(pharmacies[0].pharmacy.latitude, pharmacies[0].pharmacy.longitude),
          this.baseService.getLocationFromLatLong(latitude, longitude)
        ]);
        
        user['location'] = location;
        pharmacy['location'] = pharmacieslocation
        return {
          ...orderWithoutLocation,
          status: orderStatus,
          pharmacy: pharmacy,
          userData: user,
        };
      }));

      return { 
        status: 200, 
        message: 'Orders fetched successfully', 
        data: result 
      };
    } catch (error) {
      console.error('Error processing orders:', error);
      return {
        status: 500,
        message: 'Error processing orders',
        error: error.message
      };
    }
  }

  async getOrdersDetails(orderId: number, req: any) {
    try {
      const query = this.orderRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.user', 'user')
        .leftJoinAndSelect('order.userData', 'user_data')
        .where('order.id = :orderId', { orderId });

      const order = await query
        .select([
          'order.id',
          'order.user_id',
          'order.user_order_status',
          'order.delivery_men',
          'order.latitude',
          'order.longitude',
          'order.create_date'
        ])
        .getOne();

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      const { latitude, longitude, user_order_status, ...orderWithoutLocation } = order;
      
      const pharmacies = await this.ordersPharmaciesRepository
        .createQueryBuilder('op')
        .leftJoinAndSelect('op.pharmacy', 'pharmacy')
        .select([
          'op.id',
          'op.order_id',
          'op.status_id',
          'pharmacy.id',
          'pharmacy.latitude',
          'pharmacy.longitude',
        ])
        .where('op.winner = :winner', { winner: 1 })
        .andWhere('op.order_id = :orderId', { orderId: order.id })
        .getOne();

      if (!pharmacies) {
        throw new NotFoundException('Pharmacy details not found');
      }

      const orderStatus = user_order_status === 7 ? 'Delivered' : '';
      
      const [user, pharmacy, pharmaciesLocation, location] = await Promise.all([
        this.getUserDetails(order.user_id, 4),
        this.getUserDetails(pharmacies.pharmacy.id, 3),
        this.baseService.getLocationFromLatLong(pharmacies.pharmacy.latitude, pharmacies.pharmacy.longitude),
        this.baseService.getLocationFromLatLong(latitude, longitude)
      ]);
      
      user['location'] = location;
      pharmacy['location'] = pharmaciesLocation;

      return {
        status: 200,
        message:"Order details fetched successfully",
        data:{
          ...orderWithoutLocation,
        status: orderStatus,
        pharmacy: pharmacy,
        userData: user,
        }
      };
    } catch (error) {
      throw new Error(`Failed to get order details: ${error.message}`);
    }
  }

  async getProfileDetails(req: any) {
    const { id } = req.user;
    const data = await this.userRepository.findOne({where:{id: id}})
    const details = await this.getUserDetails(id, 6);
    details['phone_number'] = data.phone_number
    details['phone_code'] = data.phone_code
    return {
      status: 200,
      message: "Profile details fetched successfully",
      data: details
    };
  }
 
}
