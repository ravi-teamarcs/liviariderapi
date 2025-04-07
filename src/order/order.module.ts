import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from 'src/entity/order.entity';
import { UserData } from 'src/entity/userdata.entity';
import { OrdersPharmacies } from 'src/entity/orders-pharmacies.entity';
import { User } from 'src/entity/user.entity';
import { MulterModule } from '@nestjs/platform-express';
import { multerConfig } from 'src/config/multer.config';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OrderGateway } from './order.gateway';
import { AuthToken } from 'src/entity/auth-token.entity';
import { FirebaseService } from 'src/firebase/firebase.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, UserData, OrdersPharmacies, User, AuthToken]),
    MulterModule.register(multerConfig),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
    ConfigModule
  ],
  controllers: [OrderController],
  providers: [OrderService,OrderGateway,FirebaseService]
})
export class OrderModule {}
