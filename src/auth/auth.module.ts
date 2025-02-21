import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../Entity/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { UserOtp } from '../Entity/userotp.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserOtp]),
  JwtModule.register({
    secret: process.env.JWT_SECRET || 'raider',
    signOptions: { expiresIn: process.env.EXPIRESIN || '1h' },
  }),],
  providers: [AuthService],
  controllers: [AuthController]
})
export class AuthModule { }
