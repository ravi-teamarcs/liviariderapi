import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entity/order.entity'; 
import { UserData } from 'src/entity/userdata.entity'; // Import UserData entity
import { BaseService } from 'src/common/services/base.service';

@Injectable()
export class DeliveryMenService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,

    @InjectRepository(UserData)
    private userDataRepository: Repository<UserData>, // Inject UserData repository
    
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
      .where('order.delivery_men = :deliveryMenId', { deliveryMenId });

    const data = await query
      .select([
        'order.id',
        'order.user_id',
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
        const { latitude, longitude, ...orderWithoutLocation } = order;
        
        const [user, location] = await Promise.all([
          this.getUserDetails(order.user_id, 4),
          this.baseService.getLocationFromLatLong(latitude, longitude)
        ]);

        return {
          ...orderWithoutLocation,
          location,
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
 
}
