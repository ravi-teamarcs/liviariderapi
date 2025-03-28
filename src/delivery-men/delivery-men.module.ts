import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryMenController } from './delivery-men.controller';
import { DeliveryMenService } from './delivery-men.service';
import { Order } from '../entity/order.entity';
import { UserData } from '../entity/userdata.entity';
import { BaseService } from 'src/common/services/base.service';
import { AuthGuard } from 'src/guard/auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { OrdersPharmacies } from 'src/entity/orders-pharmacies.entity';
import { User } from 'src/entity/user.entity';
import { UserPayData } from 'src/entity/userPayData.entity';
import { Faq } from 'src/entity/faq.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User ,Order, UserData, OrdersPharmacies, UserPayData, Faq]),
  JwtModule.register({
    secret: process.env.JWT_SECRET || 'raider',
    signOptions: { expiresIn: process.env.EXPIRESIN || '1h' },
  }),],
  controllers: [DeliveryMenController],
  providers: [DeliveryMenService, BaseService, AuthGuard],
})
export class DeliveryMenModule {}