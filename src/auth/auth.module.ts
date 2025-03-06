import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entity/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { UserOtp } from '../entity/userotp.entity';
import { UserData } from 'src/entity/userdata.entity';
import { Counties } from 'src/entity/countries.entity';
import { AuthGuard } from 'src/guard/auth.guard';
import { multerConfig } from 'src/config/multer.config';
import { MulterModule } from '@nestjs/platform-express';
import { UserRole } from 'src/entity/user-role.entity';
import { Role } from 'src/entity/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserOtp, UserData, Counties,UserRole, Role ]),
  MulterModule.register(multerConfig),
  JwtModule.register({
    secret: process.env.JWT_SECRET || 'raider',
    signOptions: { expiresIn: process.env.EXPIRESIN || '1h' },
  }),],
  providers: [AuthService],
  controllers: [AuthController]
})
export class AuthModule { }
