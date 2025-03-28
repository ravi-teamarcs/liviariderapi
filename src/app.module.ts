import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

//import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { ApiKeyMiddleware } from './API_KEY_CHECK/api-key.middleware';
import { JwtModule } from '@nestjs/jwt';
import { DeliveryMenController } from './delivery-men/delivery-men.controller';
import { DeliveryMenService } from './delivery-men/delivery-men.service';
import { Order } from './entity/order.entity';
import { DeliveryMenModule } from './delivery-men/delivery-men.module';
import { UserData } from './entity/userdata.entity';
import { BaseService } from './common/services/base.service';
import { AuthGuard } from './guard/auth.guard';
import { Counties } from './entity/countries.entity';
import mongoose from 'mongoose';
// import { DeliveryMen } from './entity/delivery-men.entity';
import { OrderModule } from './order/order.module';
import { ScheduleModule } from '@nestjs/schedule';
import { Faq } from './entity/faq.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [join(process.cwd(), 'dist/**/*.entity.js')],
      synchronize: false,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Order, UserData, Counties, Faq]),
    JwtModule.register({
      global: false,
    }),
    AuthModule,
    DeliveryMenModule,
    OrderModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    mongoose.set('debug', true);
    // consumer
    //   .apply(ApiKeyMiddleware)  
    //   .forRoutes('*'); 
  }
}
