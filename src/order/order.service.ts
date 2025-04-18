import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserData } from 'src/entity/userdata.entity';
import { Order } from 'src/entity/order.entity';
import { OrdersPharmacies } from 'src/entity/orders-pharmacies.entity';
import { User } from 'src/entity/user.entity';
import { DeliveryBoyWithDistance } from './interfaces/delivery-boy.interface';
import axios from 'axios';
import { Request } from 'express';
import * as amqp from 'amqplib';
import { Cron } from '@nestjs/schedule';
import { AuthToken } from 'src/entity/auth-token.entity';
import { FirebaseService } from 'src/firebase/firebase.service';
import { UpdateOrderStatusDto } from './dto/update-status.dto';

declare module 'express' {
  interface Request {
    user: any;
  }
}

// Define the Multer file type
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
// export class OrderService implements OnModuleInit {
export class OrderService {
  constructor(
    @InjectRepository(UserData)
    private userDataRepository: Repository<UserData>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrdersPharmacies)
    private ordersPharmaciesRepository: Repository<OrdersPharmacies>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(AuthToken)
    private authTokenRepository: Repository<AuthToken>,
    private fireBaseService: FirebaseService,
  ) {}

  private readonly QUEUE_NAME = 'new_orders';
  @Cron('*/5 * * * * *')
  async checkForNewOrders() {
    const newOrders = await this.orderRepository.findOne({
      where: {
        delivery_men: null,
      },
      order: {
        id: 'DESC',
      },
    });

    if (newOrders?.delivery_men === null) {
      console.log('New order detected!');
      await this.getOrders();
    }
  }
  async calculateDistance(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
  ): Promise<{ distance: number; duration: number }> {
    try {
      if (!process.env.GOOGLE_MAPS_API_KEY) {
        return this.calculateHaversineDistance(origin, destination);
      }

      const url = `${process.env.GOOGLE_MAPS_API_DISTANCE_URL}`;
      const response = await axios.get(url, {
        params: {
          origins: `${origin.lat},${origin.lng}`,
          destinations: `${destination.lat},${destination.lng}`,
          key: process.env.GOOGLE_MAPS_API_KEY,
          mode: 'driving',
        },
      });

      if (
        response.data?.rows?.[0]?.elements?.[0]?.distance &&
        response.data.rows[0].elements[0].duration
      ) {
        const element = response.data.rows[0].elements[0];
        return {
          distance: element.distance.value / 1000, // Convert meters to kilometers
          duration: element.duration.value, // Duration in seconds
        };
      }

      console.warn(
        'No valid response from Google Maps API, using Haversine distance',
      );
      return this.calculateHaversineDistance(origin, destination);
    } catch (error) {
      console.error('Error calculating distance:', error);
      return this.calculateHaversineDistance(origin, destination);
    }
  }

  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }

  private calculateHaversineDistance(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
  ): { distance: number; duration: number } {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(destination.lat - origin.lat);
    const dLon = this.toRad(destination.lng - origin.lng);
    const lat1 = this.toRad(origin.lat);
    const lat2 = this.toRad(destination.lat);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Rough estimate: assume average speed of 30 km/h
    const duration = (distance / 30) * 3600; // Convert hours to seconds

    return { distance, duration };
  }

  async findNearestDeliveryBoys(
    pharmacyLat: number,
    pharmacyLng: number,
    maxDistance: number = 10000, // 10km radius
    limit: number = 1,
  ): Promise<DeliveryBoyWithDistance[]> {
    // Get all delivery boys using a raw query
    const deliveryBoys = await this.userRepository.query(`
            SELECT 
                u.id,
                u.login_email,
                u.phone_number,
                u.latitude,
                u.longitude,
                ur.role_id,
                GROUP_CONCAT(ud.field_value) as user_data
            FROM users u
            INNER JOIN user_role ur ON ur.user_id = u.id
            LEFT JOIN user_data ud ON ud.user_id = u.id
            WHERE ur.role_id = 6 AND u.online = 1
            GROUP BY u.id
        `);

    // Calculate distance for each delivery boy
    const deliveryBoysWithDistance = await Promise.all(
      deliveryBoys.map(async (deliveryBoy) => {
        try {
          const distanceResult = await this.calculateDistance(
            { lat: pharmacyLat, lng: pharmacyLng },
            {
              lat: parseFloat(deliveryBoy.latitude),
              lng: parseFloat(deliveryBoy.longitude),
            },
          );

          return {
            deliveryBoy,
            distance: distanceResult.distance,
            duration: distanceResult.duration,
            durationText: this.formatDuration(distanceResult.duration),
          };
        } catch (error) {
          console.error(
            `Error calculating distance for user ${deliveryBoy.id}:`,
            error,
          );
          return null;
        }
      }),
    );

    // Filter out failed calculations and sort by distance
    const validDeliveryBoys = deliveryBoysWithDistance
      .filter((item): item is DeliveryBoyWithDistance => item !== null)
      .filter((item) => item.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));

    return validDeliveryBoys;
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours} hr ${minutes} min`;
    }
    return `${minutes} min`;
  }

  async getOrders() {
    const order = await this.orderRepository.findOne({
      where: {
        delivery_men: null,
      },
      order: {
        id: 'DESC',
      },
    });

    if (order?.delivery_men == null || order?.delivery_men == 0) {
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

      const nearestDeliveryBoys = await this.findNearestDeliveryBoys(
        Number(pharmacies[0].pharmacy.latitude),
        Number(pharmacies[0].pharmacy.longitude),
      );

      if (!nearestDeliveryBoys.length) {
        return 'There are no delivery boys available';
      } else {
        const selectedDeliveryBoy = nearestDeliveryBoys[0];
        const deliveryId = selectedDeliveryBoy.deliveryBoy.id;

        const assign = await this.orderRepository.update(order.id, {
          delivery_men: deliveryId,
        });
        if (assign.affected === 0) {
          return {
            status: 400,
            message: 'Failed to assign order',
          };
        } else {
          const deliveryBoyData = await this.authTokenRepository.findOne({
            where: { user_id: deliveryId },
            select: ['push_token'],
          });

          if (deliveryBoyData?.push_token) {
            await this.fireBaseService.sendNotification(
              order.id,
              deliveryBoyData.push_token,
              'New Delivery Assigned',
              `You have a new order assigned. Please check your app.`,
            );
          }
          return {
            status: 200,
            message: 'Order assigned successfully',
            order,
            pharmacies,
            nearestDeliveryBoy: {
              deliveryBoy: {
                id: selectedDeliveryBoy.deliveryBoy.id,
                login_email: selectedDeliveryBoy.deliveryBoy.login_email,
                phone_number: selectedDeliveryBoy.deliveryBoy.phone_number,
                latitude: selectedDeliveryBoy.deliveryBoy.latitude,
                longitude: selectedDeliveryBoy.deliveryBoy.longitude,
                role_id: selectedDeliveryBoy.deliveryBoy.role_id,
                user_data: selectedDeliveryBoy.deliveryBoy.user_data,
              },
            },
          };
        }
      }
    } else {
      return { status: 200, message: 'There is no new order to assign' };
    }
  }

  async getUserDetails(id: number, role: number) {
    const userDataArray = await this.userDataRepository
      .createQueryBuilder('userData')
      .where('userData.user_id = :id AND userData.role_id = :role', {
        id,
        role,
      })
      .getMany();

    const userData = userDataArray.reduce((acc, curr) => {
      acc[curr.field_key] = curr.field_value;
      return acc;
    }, {});

    return userData;
  }

  async getAssignedOrders(req: Request) {
    const { id } = req?.user;
    const result = await this.orderRepository.find({
      where: {
        delivery_men: id,
        user_order_status: In([4, 5]),
      },
      order: {
        id: 'DESC',
      },
    });
    await Promise.all(
      result.map(async (order) => {
        const userData = await this.getUserDetails(order.user_id, 4);
        order.userData = Array.isArray(userData) ? userData : [userData];
        delete order.user_id;
        delete order.delivery_men;
        delete order.user_order_status;
        delete order.country;
        delete order.city_id;
        delete order.latitude;
        delete order.longitude;
        // order.status = 'Assigned Order'
      }),
    );
    return {
      status: 200,
      message: 'Assigned orders fetched successfully',
      data: result,
    };
  }

  async updateOrderStatus(dto: UpdateOrderStatusDto) {
    try {
      const { orderId, status } = dto;

      const order = await this.orderRepository.findOne({
        where: { id: orderId },
      });
      if (!order) {
        throw new BadRequestException({
          message: 'Order not found',
          status: false,
        });
      }

      const orderStatusCodeMap: Record<string, number> = {
        on_delivery: 5,
        order_cancelled: 6,
        order_received: 7,
      };

      function getOrderStatusCode(status: string): number | undefined {
        return orderStatusCodeMap[status];
      }

      // Example:
      const code = getOrderStatusCode(status); // returns 5
      console.log("Code",code)
      await this.orderRepository.update(
        { id: order.id },
        { user_order_status: code },
      );

      return { message: 'status updated successfully', status: true };
    } catch (error) {
      throw new InternalServerErrorException({
        message: error.message,
        status: false,
      });
    }
  }
}
