import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entity/order.entity'; 
import { UserData } from 'src/entity/userdata.entity'; // Import UserData entity
import { BaseService } from 'src/common/services/base.service';
import { OrdersPharmacies } from 'src/entity/orders-pharmacies.entity';
import { Request } from 'express';
import { User } from 'src/entity/user.entity';
import { AddAcountDto } from './dto/delivery-men.dto';
import pLimit from 'p-limit';
import { UserPayData } from 'src/entity/userPayData.entity';
import { Faq } from 'src/entity/faq.entity';

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

    @InjectRepository(UserPayData)
    private userPayDataRepository: Repository<UserPayData>,

    @InjectRepository(Faq)
    private faqRepository: Repository<Faq>,

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

  // async getOrdersByDeliveryMen(req: any) {
  //   const { id } = req.user;
  //   const deliveryMenId = id;
    
  //   const query = this.orderRepository
  //     .createQueryBuilder('order')
  //     .leftJoinAndSelect('order.user', 'user')
  //     .leftJoinAndSelect('order.userData', 'user_data')
  //     .where('order.delivery_men = :deliveryMenId AND order.user_order_status = :status', { deliveryMenId , status: 7 });

  //   const data = await query
  //     .select([
  //       'order.id',
  //       'order.user_id',
  //       'order.create_date',
  //       'order.user_order_status',
  //       'order.delivery_men',
  //       'order.latitude',
  //       'order.longitude',
  //       'order.country',
  //       'order.city_id',
  //       'order.create_date',
  //     ])
  //     .getMany();

  //   try {
  //     const result = await Promise.all(data.map(async (order) => {
  //       const { latitude, longitude, user_order_status, ...orderWithoutLocation } = order;
  //       const pharmacies = await this.ordersPharmaciesRepository
  //       .createQueryBuilder('op')
  //       .leftJoinAndSelect('op.pharmacy', 'pharmacy')
  //       .select([
  //         'op.id',
  //         'op.order_id',
  //         'op.status_id',
  //         'pharmacy.id',
  //         'pharmacy.latitude',
  //         'pharmacy.longitude',
  //       ])
  //       .where('op.winner = :winner', { winner: 1 })
  //       .andWhere('op.order_id = :orderId', { orderId: order.id })
  //       .getOne();

  //     if (!pharmacies) {
  //       throw new NotFoundException('Pharmacy details not found');
  //     }

  //       const [user, pharmacy, pharmacieslocation, location, distanceInfo] = await Promise.all([
  //         this.getUserDetails(order.user_id, 4),
  //         this.getUserDetails(pharmacies.pharmacy.id, 3),
  //         this.baseService.getLocationFromLatLong(pharmacies.pharmacy.latitude, pharmacies.pharmacy.longitude),
  //         this.baseService.getLocationFromLatLong(latitude, longitude),
  //         this.baseService.calculateDistance(
  //           pharmacies.pharmacy.latitude,
  //           pharmacies.pharmacy.longitude,
  //           latitude,
  //           longitude
  //         )
  //       ]);
        
  //       const orderStatus = user_order_status === 7 ? 'Delivered' : '';
        
  //       return {
  //         order_id: order.id,
  //         created_date: order.create_date,
  //         user_details: user,
  //         pharmacy_details: pharmacy,
  //         pharmacy_location: pharmacieslocation,
  //         current_location: location,
  //         distance_to_pharmacy: distanceInfo.distance,
  //         estimated_time: distanceInfo.duration,
  //         status: orderStatus
  //       };
  //     }));

  //     return { 
  //       status: 200, 
  //       message: 'Orders fetched successfully', 
  //       data: result 
  //     };
  //   } catch (error) {
  //     console.error('Error processing orders:', error);
  //     return {
  //       status: 500,
  //       message: 'Error processing orders',
  //       error: error.message
  //     };
  //   }
  // }
  async getOrdersByDeliveryMen(req: any) {
    const { id } = req.user;
    const deliveryMenId = id;
  
    const query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.userData', 'user_data')
      .where('order.delivery_men = :deliveryMenId AND order.user_order_status = :status', { deliveryMenId, status: 7 });
  
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
  
    const limit = pLimit(3); // max 3 concurrent tasks
  
    try {
      const result = await Promise.all(data.map(order => 
        limit(async () => {
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
        })
      ));
  
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
        .leftJoinAndSelect('order.deliveryMen','deliveryMen')
        .where('order.id = :orderId', { orderId });

      const order = await query
        .select([
          'order.id',
          'order.user_id',
          'order.user_order_status',
          'order.delivery_men',
          'order.latitude',
          'deliveryMen.id',
          'deliveryMen.longitude',
          'deliveryMen.latitude',
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
      order['deliveryMen_latitude'] = order.deliveryMen?.latitude? parseFloat(order.deliveryMen.latitude): null;
      order['deliveryMen_longitude'] = order.deliveryMen?.longitude? parseFloat(order.deliveryMen.longitude): null;
      user['location'] = location;
      pharmacy['location'] = pharmaciesLocation;
      pharmacy['latitude'] = pharmacies.pharmacy.latitude;
      pharmacy['longitude'] = pharmacies.pharmacy.longitude;
      user['latitude'] = latitude;
      user['longitude'] = longitude;
      delete order.deliveryMen
      // delete order.latitude;
      // delete order.longitude;
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

  async addAccount(addAccountDto: AddAcountDto, req: any) {
    const { id } = req.user;
    const { account_number, pay_system, pay_type , IFSC, customer_id, number } = addAccountDto;
    if(pay_type === 'bankaccount'){
      if(!account_number || !IFSC || !customer_id){
        throw new BadRequestException('Please provide Account Number, IFSC and Customer ID');
      }
    await this.userPayDataRepository.save({
      user_id: id,
      pay_system: pay_system,
      pay_type: pay_type,
      field_key: 'account_number',
      field_value: account_number,
      role_id: 6
    });
    await this.userPayDataRepository.save({
      user_id: id,
      pay_system: pay_system,
      pay_type: pay_type,
      field_key: 'IFSC',
      field_value: IFSC,
      role_id: 6
    });
    await this.userPayDataRepository.save({
      user_id: id,
      pay_system: pay_system,
      pay_type: pay_type,
      field_key: 'customer_id',
      field_value: customer_id,
      role_id: 6
    });
  }else if(pay_type==='tillnumbers'){
    if(!number){
      throw new BadRequestException('Please provide Number');
    }
    await this.userPayDataRepository.save({
      user_id: id,
      pay_system: pay_system,
      pay_type: pay_type,
      field_key: 'number',
      field_value: number,
    });

  }else if(pay_type==='paybill'){
    if(!number){
      throw new BadRequestException('Please provide Number');
    }
    await this.userPayDataRepository.save({
      user_id: id,
      pay_system: pay_system,
      pay_type: pay_type,
      field_key: 'number',
      field_value: number,
    });

  }else if(pay_type==='phone'){
    if(!number){
      throw new BadRequestException('Please provide Number');
    }
    await this.userPayDataRepository.save({
      user_id: id,
      pay_system: pay_system,
      pay_type: pay_type,
      field_key: 'number',
      field_value: number,
    });
  }else{
    throw new BadRequestException('Please provide a valid pay type');
  }
    return {
      status: 200,
      message: "Account details added successfully",
    };
  }

  async getAccounts(req: any) {
    try {
      const { id } = req.user;
      const records = await this.userPayDataRepository.find({ where: { user_id: id } });
    
      const grouped: Record<string, any> = {};
    
      for (const item of records) {
        const { pay_type, pay_system, field_key, field_value,priority } = item;
    
        if (!grouped[pay_type]) {
          grouped[pay_type] = { pay_type, pay_system };
        }
    
        grouped[pay_type][field_key] = field_value;
        grouped[pay_type]['priority'] = priority;
      }
    
      const data = Object.values(grouped);
    
      return {
        status: 200,
        message: "Account details fetched successfully",
        data
      };
    } catch (error) {
      throw new Error(`Failed to get account details: ${error.message}`);
      
    }
   
  }

  
  async updateAccountPriority(req: any, body: any) {
    try {
      const { id } = req.user;
      const  {pay_type , priority }  = body;
      const records = await this.userPayDataRepository.find({ where: { user_id: id, pay_type } });

      if (!records.length) {
        throw new NotFoundException('Account details not found');
      }

      await this.userPayDataRepository.update({ user_id: id, pay_type }, { priority: priority });
      return {
        status: 200,
        message: "Account priority updated successfully",
      };

    } catch (error) {
      throw new Error(`Failed to get account details: ${error.message}`);
      
    }
   
  }


  async deleteAccount(req: any, body: any) {
    try {
      const { id } = req.user;
      const { account_number, pay_system, pay_type , IFSC, customer_id, number } = body;
      if(pay_type === 'bankaccount'){
        if(!account_number || !IFSC || !customer_id){
          throw new BadRequestException('Please provide Account Number, IFSC and Customer ID');
        }
      await this.userPayDataRepository.delete({ user_id: id, pay_type, field_key: 'account_number', field_value: account_number });
      await this.userPayDataRepository.delete({ user_id: id, pay_type, field_key: 'IFSC', field_value: IFSC });
      await this.userPayDataRepository.delete({ user_id: id, pay_type, field_key: 'customer_id', field_value: customer_id });
    }else if(pay_type==='tillnumbers'){
      if(!number){
        throw new BadRequestException('Please provide Number');
      }
      await this.userPayDataRepository.delete({ user_id: id, pay_type, field_key: 'number', field_value: number });
  
    }else if(pay_type==='paybill'){
      if(!number){
        throw new BadRequestException('Please provide Number');
      }
      await this.userPayDataRepository.delete({ user_id: id, pay_type, field_key: 'number', field_value: number });
  
    }else if(pay_type==='phone'){
      if(!number){
        throw new BadRequestException('Please provide Number');
      }
      await this.userPayDataRepository.delete({ user_id: id, pay_type, field_key: 'number', field_value: number });
    }else{
      throw new BadRequestException('Please provide a valid pay type');
    }
      return {
        status: 200,
        message: "Account details deleted successfully",
      };
    } catch (error) {
      throw new Error(`Failed to delete account details: ${error.message}`);
      
    }
  }


  async getFaq(req: any, lang: any) {
    const {id , role_id} = req.user;
    const data = await this.faqRepository.find({where:{lang: lang.lang, role_id: role_id}, select:["question","answer","lang","sorting"]});
    if (!data) {
      throw new NotFoundException('FAQ not found');
    }
    return {
      status: 200,
      message: "FAQ fetched successfully",
      data: data
    };
  }

  async getReport(req: any) {
    const data = [{
      totalEarning: 645.99,
      totalOrders: 100,
      avgTime: "23hrs 45mins",
      rating: 4.5,
    }]
    return {
      status: 200,
      message: "Report fetched successfully",
      data: data
    };  
  }

  async getPaymentList(req: any) {
    const data = [
      {
      orderNumber: 7924,
      amount:18,
      date: "2023-Feb-01",
      time:"12:30 PM",
      },
      {
      orderNumber: 8524,
      amount:10,
      date: "2023-Mar-16",
      time:"2:08 PM",
      },
      {
      orderNumber: 9624,
      amount:12,
      date: "2023-May-12",
      time:"8:16 PM",
      },
  ]

  return {
    status: 200,
    message: "Payment list fetched successfully",
    data: data
  };

  }

  
}
