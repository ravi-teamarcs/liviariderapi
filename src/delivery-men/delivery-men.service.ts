import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
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

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
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
        'order.create_date',
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
        .getOne();

      if (!pharmacies) {
        throw new NotFoundException('Pharmacy details not found');
      }

        const [user, pharmacy, pharmacieslocation, location, distanceInfo] = await Promise.all([
          this.getUserDetails(order.user_id, 4),
          this.getUserDetails(pharmacies.pharmacy.id, 3),
          this.baseService.getLocationFromLatLong(pharmacies.pharmacy.latitude, pharmacies.pharmacy.longitude),
          this.baseService.getLocationFromLatLong(latitude, longitude),
          this.baseService.calculateDistance(
            pharmacies.pharmacy.latitude,
            pharmacies.pharmacy.longitude,
            latitude,
            longitude
          )
        ]);
        
        const orderStatus = user_order_status === 7 ? 'Delivered' : '';
        
        return {
          order_id: order.id,
          created_date: order.create_date,
          user_details: user,
          pharmacy_details: pharmacy,
          pharmacy_location: pharmacieslocation,
          current_location: location,
          distance_to_pharmacy: distanceInfo.distance,
          estimated_time: distanceInfo.duration,
          status: orderStatus
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

      const [user, pharmacy, pharmaciesLocation, location, distanceInfo] = await Promise.all([
        this.getUserDetails(order.user_id, 4),
        this.getUserDetails(pharmacies.pharmacy.id, 3),
        this.baseService.getLocationFromLatLong(pharmacies.pharmacy.latitude, pharmacies.pharmacy.longitude),
        this.baseService.getLocationFromLatLong(latitude, longitude),
        this.baseService.calculateDistance(
          pharmacies.pharmacy.latitude,
          pharmacies.pharmacy.longitude,
          latitude,
          longitude
        )
      ]);
      
      const orderStatus = user_order_status === 7 ? 'Delivered' : '';
      
      user['location'] = location;
      pharmacy['location'] = pharmaciesLocation;

      return {
        status: 200,
        message: "Order details fetched successfully",
        data: {
        ...order,
        status: orderStatus,
        pharmacy: pharmacy,
        userData: user,
        distance_to_pharmacy: distanceInfo.distance,
        estimated_time: distanceInfo.duration
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
    details['avatar'] = data.avatar
    return {
      status: 200,
      message: "Profile details fetched successfully",
      data: details
    };
  }

  // async uploadProfilePhoto(req: any, files: {profileImage?: MulterFile }) {
  //   const {id} = req.user;
  //   const {profileImage} = files;
  //   const image = await this.baseService.uploadFile(profileImage);
  //   const update = await this.userRepository.update(id, {avatar: image});
  
  // }
 
  async uploadProfilePhoto(req, file: MulterFile) {
    try {
        const { id } = req.user;
        if(!id) {
          throw new BadRequestException('User not found');
        }   
        const frontFile = file

        if (!frontFile) {
            throw new BadRequestException('Please provide both front and back ID photos with correct field names');
        }

        // Create user_data entries for both files
        // const userDataEntries = [
        //     {
        //         user_id: id,
        //         field_key: 'photo_id_number_frontend',
        //         field_value: 'uploads/'+frontFile.filename,
        //         role_id: 6
        //     },
        // ];
        const profile = await this.userRepository.update(id,{
          avatar: 'uploads/'+frontFile.filename
        })

        // Save to user_data table
        // await this.userRepository.save(profile);
        
        return {
            status: 200,
            message: 'Profilephotos uploaded successfully',
        };
    } catch (error) {
        throw new InternalServerErrorException('Error saving files data: ' + error.message);
    }
}
}
