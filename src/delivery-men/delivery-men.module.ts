import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryMenController } from './delivery-men.controller';
import { DeliveryMenService } from './delivery-men.service';
import { Order } from '../entity/order.entity';
import { UserData } from '../entity/userdata.entity';
import { BaseService } from 'src/common/services/base.service';
import { AuthGuard } from 'src/guard/auth.guard';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([Order, UserData]),
  JwtModule.register({
    secret: process.env.JWT_SECRET || 'raider',
    signOptions: { expiresIn: process.env.EXPIRESIN || '1h' },
  }),],
  controllers: [DeliveryMenController],
  providers: [DeliveryMenService, BaseService, AuthGuard],
})
export class DeliveryMenModule {}