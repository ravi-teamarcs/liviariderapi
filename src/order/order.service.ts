import { Injectable, InternalServerErrorException,OnModuleInit  } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserData } from 'src/entity/userdata.entity';
import { Order } from 'src/entity/order.entity';
import { OrdersPharmacies } from 'src/entity/orders-pharmacies.entity';
import { User } from 'src/entity/user.entity';
import { DeliveryBoyWithDistance } from './interfaces/delivery-boy.interface';
import axios from 'axios';
import { Request } from 'express';
import * as amqp from 'amqplib';
import { Cron } from '@nestjs/schedule';

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
        private userRepository: Repository<User>
    ) {}
    
    private readonly QUEUE_NAME = 'new_orders';

    // async onModuleInit() {
    //     const connection = await amqp.connect('amqp://localhost');
    //     const channel = await connection.createChannel();
    //     await channel.assertQueue(this.QUEUE_NAME);
    //     console.log(channel)
    //     console.log('Listening for new orders...');

    //     channel.consume(this.QUEUE_NAME, async (msg) => {
    //         if (msg !== null) {
    //             const orderData = JSON.parse(msg.content.toString());
    //             console.log('New order received:', orderData);
    //             await this.getOrders();
    //             channel.ack(msg);
    //         }
    //     });
    // }

    // async onModuleInit() {
    //     try {
    //         const connection = await amqp.connect('amqp://localhost');
    //         console.log('✅ Connected to RabbitMQ successfully');
    
    //         const channel = await connection.createChannel();
    //         await channel.assertQueue('new_orders');
            
    //         console.log(`✅ Listening for messages in queue: new_orders`);
    //         channel.consume('new_orders', async (msg) => {
    //             if (msg !== null) {
    //                 console.log('✅ Received message:', msg.content.toString());
    
    //                 const orderData = JSON.parse(msg.content.toString());
    //                 console.log('Processing Order:', orderData);
    
    //                 await this.getOrders(); // Ensure this function runs successfully
    //                 console.log('✅ getOrders() function executed successfully');
    
    //                 channel.ack(msg);
    //             } else {
    //                 console.warn('⚠️ Received NULL message');
    //             }
    //         });
    //     } catch (error) {
    //         console.error('❌ Error connecting to RabbitMQ:', error);
    //     }
    // }

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

        if (newOrders?.delivery_men===null) {
            console.log('New order detected!');
            await this.getOrders();
        }
    }


    
    
    

    async calculateDistance(
        origin: { lat: number; lng: number },
        destination: { lat: number; lng: number }
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
                    mode: 'driving'
                }
            });

            if (
                response.data?.rows?.[0]?.elements?.[0]?.distance &&
                response.data.rows[0].elements[0].duration
            ) {
                const element = response.data.rows[0].elements[0];
                return {
                    distance: element.distance.value / 1000, // Convert meters to kilometers
                    duration: element.duration.value // Duration in seconds
                };
            }

            console.warn('No valid response from Google Maps API, using Haversine distance');
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
        destination: { lat: number; lng: number }
    ): { distance: number; duration: number } {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRad(destination.lat - origin.lat);
        const dLon = this.toRad(destination.lng - origin.lng);
        const lat1 = this.toRad(origin.lat);
        const lat2 = this.toRad(destination.lat);

        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;

        // Rough estimate: assume average speed of 30 km/h
        const duration = (distance / 30) * 3600; // Convert hours to seconds

        return { distance, duration };
    }

    async findNearestDeliveryBoys(
        pharmacyLat: number,
        pharmacyLng: number,
        maxDistance: number = 5000, // 5km radius
        limit: number = 1
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
            WHERE ur.role_id = 6
            GROUP BY u.id
        `);

        // Calculate distance for each delivery boy
        const deliveryBoysWithDistance = await Promise.all(
            deliveryBoys.map(async (deliveryBoy) => {
                try {
                    const distanceResult = await this.calculateDistance(
                        { lat: pharmacyLat, lng: pharmacyLng },
                        { lat: parseFloat(deliveryBoy.latitude), lng: parseFloat(deliveryBoy.longitude) }
                    );

                    return {
                        deliveryBoy,
                        distance: distanceResult.distance,
                        duration: distanceResult.duration,
                        durationText: this.formatDuration(distanceResult.duration)
                    };
                } catch (error) {
                    console.error(`Error calculating distance for user ${deliveryBoy.id}:`, error);
                    return null;
                }
            })
        );

        // Filter out failed calculations and sort by distance
        const validDeliveryBoys = deliveryBoysWithDistance
            .filter((item): item is DeliveryBoyWithDistance => item !== null)
            .filter(item => item.distance <= maxDistance)
            .sort((a, b) => a.distance - b.distance)
            .slice(0, limit)
            .map((item, index) => ({
                ...item,
                rank: index + 1
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
                Number(pharmacies[0].pharmacy.longitude)
            );

            if (!nearestDeliveryBoys.length) {
                return "There are no delivery boys available";
            } else {
                const selectedDeliveryBoy = nearestDeliveryBoys[0];
                const deliveryId = selectedDeliveryBoy.deliveryBoy.id;

                const assign = await this.orderRepository.update(order.id, { delivery_men: deliveryId });
                if (assign.affected === 0) {
                    return {
                        status: 400,
                        message: "Failed to assign order",
                    };
                }else{
                    return {
                        status: 200,
                        message: "Order assigned successfully",
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
                                user_data: selectedDeliveryBoy.deliveryBoy.user_data
                            }
                        }
                    };
                }

             
            }
        } else {
            return { status: 200, message: "There is no new order to assign" };
        }
    }

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

    async getAssignedOrders(req: Request) {
        const { id } = req?.user;
        const result = await this.orderRepository.find({
            where: {
                delivery_men: id,
                user_order_status:4,
            },
            order: {
                id: 'DESC',
            },
        });
        await Promise.all(result.map(async (order) => {
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
        }));
        return { status: 200, message: 'Assigned orders fetched successfully', data: result};
    }

    // async saveFileData(file: MulterFile) {
    //     try {
    //         // const fileUrl = `${process.env.IMAGE_BASE_URL}uploads/${file.filename}`;
            
    //         return {
    //             status: 200,
    //             message: 'File uploaded successfully',
    //             data: {
    //                 originalName: file.originalname,
    //                 filename: file.filename,
    //                 // fileUrl: fileUrl,
    //                 size: file.size,
    //                 mimeType: file.mimetype
    //             }
    //         };
    //     } catch (error) {
    //         throw new InternalServerErrorException('Error saving file data: ' + error.message);
    //     }
    // }
}
