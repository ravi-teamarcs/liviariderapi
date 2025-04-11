import { BadRequestException, ForbiddenException, HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto, RegisterVerifyOTP, VerifyOtpDto } from './dto/login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entity/user.entity';
import * as crypto from "crypto";
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { JwtService } from '@nestjs/jwt';
import { UserOtp } from '../entity/userotp.entity';
import { ConfigService } from '@nestjs/config';
import {method, salt} from '../common/constants/config.json';
import { BaseService } from 'src/common/services/base.service';
import { UserData } from 'src/entity/userdata.entity';
import { Counties } from 'src/entity/countries.entity';
import { ForgotPasswordPhoneDto, ResetPasswordDto, VerifyOtpForPasswordDto } from './dto/forgot-password.dto';
import { ResendOtpDto } from './dto/login.dto';
import { UserRole } from 'src/entity/user-role.entity';
import { Role } from 'src/entity/role.entity';
import { ROLE } from 'src/common/constants/config.json';
import { AuthToken } from 'src/entity/auth-token.entity';

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
export class AuthService {
  private baseService: BaseService;
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(UserOtp) private UserOtpRepository: Repository<UserOtp>,
    @InjectRepository(UserData) private userDataRepository: Repository<UserData>,
    @InjectRepository(Counties) private countryRepository: Repository<Counties>,
    @InjectRepository(UserRole) private userRoleRepository: Repository<UserRole>,
    @InjectRepository(Role) private roleRepository: Repository<Role>,
    @InjectRepository(AuthToken) private authTokenRepo: Repository<AuthToken>,
    private configService: ConfigService,
    private jwtService: JwtService, 
  ) { this.baseService = new BaseService(salt, method); }

  async verifyRole(roleId:number){
    const deliveryId = await this.roleRepository.findOne({ where: { name : ROLE} });
    const delivery = await this.userRoleRepository.findOne({ where: { role_id : deliveryId.id, user_id: roleId} });
    if(delivery){
      return true;
    }
    return false;
  }

  async register(registerDto: RegisterDto) {
    const saltRounds = 10;
    const user = await this.userRepository.findOne({
      where: { login_email: registerDto.email },
    });

    if (user) {
      throw new ForbiddenException('Email already exists');
    }
    const hashedPassword = this.baseService.hashPassword(registerDto.password);
    const newUser = this.userRepository.create({
      login_email: registerDto.email,
      password: hashedPassword,
      login_phone: registerDto.phone_code + registerDto.mobile,
      phone_code: registerDto.phone_code,
      phone_number: registerDto.mobile,
      status: true,
    });

    const role = await this.roleRepository.findOne({ where: { name : ROLE} });
   
    try {
      const savedUser = await this.userRepository.save(newUser);

      const userRole = this.userRoleRepository.create({
        role_id: role.id,
        user_id: savedUser.id
      });
      await this.userRoleRepository.save(userRole);
      // const userExists = await this.userRepository.findOne({ where: { id: newUser.id } });

      // if (!userExists) {
      //     throw new Error('User does not exist');
      // }
      const userDataRecords = [
        { user_id: newUser.id, role_id: 6, field_key: 'first_name', field_value: registerDto.firstName },
        { user_id: newUser.id, role_id: 6, field_key: 'last_name', field_value: registerDto.lastName }
    ];
    
    await this.userDataRepository.save(userDataRecords);
    const Emailotp = crypto.randomInt(1000, 9999).toString();
    const Phoneotp = crypto.randomInt(1000, 9999).toString();
      return { message: 'User registered successfully!', status: 200, user: savedUser };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Registration failed');
    }
  }

  async RegisterVerifyOTP(RegisterVerifyOTP: RegisterVerifyOTP) {
    const { id, emailOtp, phoneOtp } = RegisterVerifyOTP;
    
    const user = await this.userRepository.findOne({
      where: { id: id },
      select: [
        'id',
        'password',
        'status',
      ],
    });
    if (!user) {
      throw new NotFoundException('Invalid request. No user found.');
    }
    if (user && !user.status) {
      throw new ForbiddenException('Inactive user cannot login');
    }
    const userPhoneOtp = await this.UserOtpRepository.findOne({ where: { user_id: id, action:'signup_phone' }, select: [
      'otp',
    ], });
    const userEmailOtp = await this.UserOtpRepository.findOne({ where: { user_id: id, action:'signup_email' }, select: [
      'otp',
    ], });
    // if (!userOtp) {
    //   throw new Error("OTP not found for user");
    // }
    if (
      (this.configService.get('NODE_ENV') === 'DEV' ||
        this.configService.get('NODE_ENV') === 'UAT') &&
        phoneOtp !== '0000'
    ) {
      if (userPhoneOtp?.otp !== emailOtp) {
        // const userOtpData = await this.UserOtpRepository.findOneAndUpdate(
        //   { userId: _id },
        //   { $inc: { verifyOTPCount: -1 } },
        //   { new: true },
        // );

        // if (userOtpData.verifyOTPCount === 0) {
        //   const retryAfter = new Date().setHours(new Date().getHours() + 1);
        //   await this.userOtpModel.findOneAndUpdate(
        //     { userId: _id },
        //     { $set: { retryAfter: retryAfter } },
        //   );

        //   throw new BadRequestException({
        //     message: `OTP limit has exceeded since you made too many wrong attempts. Please try again after 1 hour.`,
        //     status: false,
        //   });
        // }

        throw new BadRequestException(`OTP Invalid`
          // `OTP Invalid, only ${userOtpData.verifyOTPCount} attempts left`,
        );
      } else if (userPhoneOtp.otp === emailOtp) {
        // const minutes = await this.getMinutesBetweenDates(
        //   new Date(userOtp.OTPExpiration),
        //   new Date(),
        // );

        // if (minutes > 5) {
        //   throw new BadRequestException('OTP expired');
        // }

        // await this.UserOtpRepository.deleteOne({ userId: _id });
      }
    } else if (
      (this.configService.get('NODE_ENV') === 'DEV' ||
        this.configService.get('NODE_ENV') === 'UAT') &&
        phoneOtp === '0000'
    ) {
      // await this.UserOtpRepository.deleteOne({ userId: _id });
    }
    else{
      if (userPhoneOtp.otp !== phoneOtp) {
        console.log(`${this.configService.get('NODE_ENV')}`)
        // const userOtpData = await this.UserOtpRepository.findOneAndUpdate(
        //   { userId: _id },
        //   { $inc: { verifyOTPCount: -1 } },
        //   { new: true },
        // );

        // if (userOtpData.verifyOTPCount === 0) {
        //   const retryAfter = new Date().setHours(new Date().getHours() + 1);
        //   await this.userOtpModel.findOneAndUpdate(
        //     { userId: _id },
        //     { $set: { retryAfter: retryAfter } },
        //   );

        //   throw new BadRequestException({
        //     message: `OTP limit has exceeded since you made too many wrong attempts. Please try again after 1 hour.`,
        //     status: false,
        //   });
        // }

        throw new BadRequestException(
          `OTP Invalid`
          // `OTP Invalid, only ${userOtpData.verifyOTPCount} attempts left`,
        );
      } else if (userPhoneOtp.otp === phoneOtp) {
        // const minutes = await this.getMinutesBetweenDates(
        //   new Date(userOtp.OTPExpiration),
        //   new Date(),
        // );

        if (true) {
          throw new BadRequestException('OTP expired');
        }

        // await this.UserOtpRepository.deleteOne({ userId: _id });
      }
    }


    if (
      (this.configService.get('NODE_ENV') === 'DEV' ||
        this.configService.get('NODE_ENV') === 'UAT') &&
        phoneOtp !== '0000'
    ) {
      if (userPhoneOtp?.otp !== emailOtp) {
        // const userOtpData = await this.UserOtpRepository.findOneAndUpdate(
        //   { userId: _id },
        //   { $inc: { verifyOTPCount: -1 } },
        //   { new: true },
        // );

        // if (userOtpData.verifyOTPCount === 0) {
        //   const retryAfter = new Date().setHours(new Date().getHours() + 1);
        //   await this.userOtpModel.findOneAndUpdate(
        //     { userId: _id },
        //     { $set: { retryAfter: retryAfter } },
        //   );

        //   throw new BadRequestException({
        //     message: `OTP limit has exceeded since you made too many wrong attempts. Please try again after 1 hour.`,
        //     status: false,
        //   });
        // }

        throw new BadRequestException(`OTP Invalid`
          // `OTP Invalid, only ${userOtpData.verifyOTPCount} attempts left`,
        );
      } else if (userPhoneOtp.otp === emailOtp) {
        // const minutes = await this.getMinutesBetweenDates(
        //   new Date(userOtp.OTPExpiration),
        //   new Date(),
        // );

        // if (minutes > 5) {
        //   throw new BadRequestException('OTP expired');
        // }

        // await this.UserOtpRepository.deleteOne({ userId: _id });
      }
    } else if (
      (this.configService.get('NODE_ENV') === 'DEV' ||
        this.configService.get('NODE_ENV') === 'UAT') &&
        phoneOtp === '0000'
    ) {
      // await this.UserOtpRepository.deleteOne({ userId: _id });
    }
    else{
      if (userPhoneOtp.otp !== phoneOtp) {
        console.log(`${this.configService.get('NODE_ENV')}`)
        // const userOtpData = await this.UserOtpRepository.findOneAndUpdate(
        //   { userId: _id },
        //   { $inc: { verifyOTPCount: -1 } },
        //   { new: true },
        // );

        // if (userOtpData.verifyOTPCount === 0) {
        //   const retryAfter = new Date().setHours(new Date().getHours() + 1);
        //   await this.userOtpModel.findOneAndUpdate(
        //     { userId: _id },
        //     { $set: { retryAfter: retryAfter } },
        //   );

        //   throw new BadRequestException({
        //     message: `OTP limit has exceeded since you made too many wrong attempts. Please try again after 1 hour.`,
        //     status: false,
        //   });
        // }

        throw new BadRequestException(
          `OTP Invalid`
          // `OTP Invalid, only ${userOtpData.verifyOTPCount} attempts left`,
        );
      } else if (userPhoneOtp.otp === phoneOtp) {
        // const minutes = await this.getMinutesBetweenDates(
        //   new Date(userOtp.OTPExpiration),
        //   new Date(),
        // );

        if (true) {
          throw new BadRequestException('OTP expired');
        }

        // await this.UserOtpRepository.deleteOne({ userId: _id });
      }
    }


    //email otp verification
    if (
      (this.configService.get('NODE_ENV') === 'DEV' ||
        this.configService.get('NODE_ENV') === 'UAT') &&
        emailOtp !== '0000'
    ) {
      if (userEmailOtp?.otp !== emailOtp) {
        // const userOtpData = await this.UserOtpRepository.findOneAndUpdate(
        //   { userId: _id },
        //   { $inc: { verifyOTPCount: -1 } },
        //   { new: true },
        // );

        // if (userOtpData.verifyOTPCount === 0) {
        //   const retryAfter = new Date().setHours(new Date().getHours() + 1);
        //   await this.userOtpModel.findOneAndUpdate(
        //     { userId: _id },
        //     { $set: { retryAfter: retryAfter } },
        //   );

        //   throw new BadRequestException({
        //     message: `OTP limit has exceeded since you made too many wrong attempts. Please try again after 1 hour.`,
        //     status: false,
        //   });
        // }

        throw new BadRequestException(`OTP Invalid`
          // `OTP Invalid, only ${userOtpData.verifyOTPCount} attempts left`,
        );
      } else if (userEmailOtp.otp === emailOtp) {
        // const minutes = await this.getMinutesBetweenDates(
        //   new Date(userOtp.OTPExpiration),
        //   new Date(),
        // );

        // if (minutes > 5) {
        //   throw new BadRequestException('OTP expired');
        // }

        // await this.UserOtpRepository.deleteOne({ userId: _id });
      }
    } else if (
      (this.configService.get('NODE_ENV') === 'DEV' ||
        this.configService.get('NODE_ENV') === 'UAT') &&
        emailOtp === '0000'
    ) {
      // await this.UserOtpRepository.deleteOne({ userId: _id });
    }
    else{
      if (userEmailOtp.otp !== emailOtp) {
        console.log(`${this.configService.get('NODE_ENV')}`)
        // const userOtpData = await this.UserOtpRepository.findOneAndUpdate(
        //   { userId: _id },
        //   { $inc: { verifyOTPCount: -1 } },
        //   { new: true },
        // );

        // if (userOtpData.verifyOTPCount === 0) {
        //   const retryAfter = new Date().setHours(new Date().getHours() + 1);
        //   await this.userOtpModel.findOneAndUpdate(
        //     { userId: _id },
        //     { $set: { retryAfter: retryAfter } },
        //   );

        //   throw new BadRequestException({
        //     message: `OTP limit has exceeded since you made too many wrong attempts. Please try again after 1 hour.`,
        //     status: false,
        //   });
        // }

        throw new BadRequestException(
          `OTP Invalid`
          // `OTP Invalid, only ${userOtpData.verifyOTPCount} attempts left`,
        );
      } else if (userEmailOtp.otp === emailOtp) {
        // const minutes = await this.getMinutesBetweenDates(
        //   new Date(userOtp.OTPExpiration),
        //   new Date(),
        // );

        if (true) {
          throw new BadRequestException('OTP expired');
        }

        // await this.UserOtpRepository.deleteOne({ userId: _id });
      }
    }


    if (
      (this.configService.get('NODE_ENV') === 'DEV' ||
        this.configService.get('NODE_ENV') === 'UAT') &&
        emailOtp !== '0000'
    ) {
      if (userEmailOtp?.otp !== emailOtp) {
        // const userOtpData = await this.UserOtpRepository.findOneAndUpdate(
        //   { userId: _id },
        //   { $inc: { verifyOTPCount: -1 } },
        //   { new: true },
        // );

        // if (userOtpData.verifyOTPCount === 0) {
        //   const retryAfter = new Date().setHours(new Date().getHours() + 1);
        //   await this.userOtpModel.findOneAndUpdate(
        //     { userId: _id },
        //     { $set: { retryAfter: retryAfter } },
        //   );

        //   throw new BadRequestException({
        //     message: `OTP limit has exceeded since you made too many wrong attempts. Please try again after 1 hour.`,
        //     status: false,
        //   });
        // }

        throw new BadRequestException(`OTP Invalid`
          // `OTP Invalid, only ${userOtpData.verifyOTPCount} attempts left`,
        );
      } else if (userEmailOtp.otp === emailOtp) {
        // const minutes = await this.getMinutesBetweenDates(
        //   new Date(userOtp.OTPExpiration),
        //   new Date(),
        // );

        // if (minutes > 5) {
        //   throw new BadRequestException('OTP expired');
        // }

        // await this.UserOtpRepository.deleteOne({ userId: _id });
      }
    } else if (
      (this.configService.get('NODE_ENV') === 'DEV' ||
        this.configService.get('NODE_ENV') === 'UAT') &&
        emailOtp === '0000'
    ) {
      // await this.UserOtpRepository.deleteOne({ userId: _id });
    }
    else{
      if (userEmailOtp.otp !== emailOtp) {
        console.log(`${this.configService.get('NODE_ENV')}`)
        // const userOtpData = await this.UserOtpRepository.findOneAndUpdate(
        //   { userId: _id },
        //   { $inc: { verifyOTPCount: -1 } },
        //   { new: true },
        // );

        // if (userOtpData.verifyOTPCount === 0) {
        //   const retryAfter = new Date().setHours(new Date().getHours() + 1);
        //   await this.userOtpModel.findOneAndUpdate(
        //     { userId: _id },
        //     { $set: { retryAfter: retryAfter } },
        //   );

        //   throw new BadRequestException({
        //     message: `OTP limit has exceeded since you made too many wrong attempts. Please try again after 1 hour.`,
        //     status: false,
        //   });
        // }

        throw new BadRequestException(
          `OTP Invalid`
          // `OTP Invalid, only ${userOtpData.verifyOTPCount} attempts left`,
        );
      } else if (userEmailOtp.otp === emailOtp) {
        // const minutes = await this.getMinutesBetweenDates(
        //   new Date(userOtp.OTPExpiration),
        //   new Date(),
        // );

        if (true) {
          throw new BadRequestException('OTP expired');
        }

        // await this.UserOtpRepository.deleteOne({ userId: _id });
      }
    }

    // if (otp !== userOtp.otp) {
    //   return {
    //     message: 'OTP is Invalid!',
    //     status: 400,
    //     matched: false
    //   };
    // }
    const roleId = await this.roleRepository.findOne({ where: { name: ROLE } });
    if (!roleId) {
      throw new NotFoundException('Role not found');
    }

    const assignRole = this.userRoleRepository.create({
      user_id: id,
      role_id: roleId.id
    });
    await this.userRoleRepository.save(assignRole);

    const payload = { id, role_id: roleId.id };
    // const accessToken = jwt.sign(payload, `${process.env.JWT_SECRET || 'raider'}`, { expiresIn: `${process.env.ACCESSEXPIRESIN || '0.25h'}` });
    // const referenceToken = jwt.sign(payload, `${process.env.JWT_SECRET || 'raider'}`, { expiresIn: `${process.env.REFEXPIRESIN || '1d'}` });
    const accessToken = this.jwtService.sign(payload, { secret: `${process.env.JWT_SECRET || 'raider'}`, expiresIn: `${process.env.ACCESSEXPIRESIN || '0.25h'}` });
    const referenceToken = this.jwtService.sign(payload, { secret: `${process.env.JWT_SECRET || 'raider'}`, expiresIn: `${process.env.REFEXPIRESIN || '1d'}` });



    return {
      status: 200,
      isValid:true,
      message: 'Register Successfully!',
      data:{
        accessToken,
        referenceToken,
      }
    };
  }

  async login(loginDto: LoginDto){
    const user = await this.userRepository.findOne({
      where: { login_email: loginDto.email },
      select: [
        'id',
        'password',
        'status',
      ],
    });
    if (!user) {
      throw new UnauthorizedException(
        'You have entered an invalid email or password',
      );
    }

    const isvalidDeliveryBoy = await this.verifyRole(user.id);
    if(!isvalidDeliveryBoy){
      throw new UnauthorizedException(
        'You have entered an invalid email or password',
      );
    }

    if (user && !user.status) {
      throw new ForbiddenException('Inactive user cannot login');
    }
    
    const hashedPassword = this.baseService.hashPassword(loginDto.password);

    if (hashedPassword !== user.password) {
      throw new UnauthorizedException(
        'You have entered an invalid password',
      );
    }

    return { message: 'OTP sent successfully', id: user.id, status:200 };

  }

  async verifyOTP(VerifyOtpDto: VerifyOtpDto) {
    const { id, otp, fcmToken } = VerifyOtpDto;
    
    const user = await this.userRepository.findOne({
      where: { id: id },
      select: [
        'id',
        'password',
        'status',
      ],
    });
    const role = await this.userRoleRepository.findOne({ where: { user_id: id }, select: [
      'role',
    ], });
    if (!user) {
      throw new NotFoundException('Invalid request. No user found.');
    }
    if (user && !user.status) {
      throw new ForbiddenException('Inactive user cannot login');
    }

    const userOtp = await this.UserOtpRepository.findOne({ where: { user_id: id }, select: [
      'otp',
    ], });
    // if (!userOtp) {
    //   throw new Error("OTP not found for user");
    // }
    if (
      (this.configService.get('NODE_ENV') === 'DEV' ||
        this.configService.get('NODE_ENV') === 'UAT') &&
        VerifyOtpDto.otp !== '0000'
    ) {
      if (userOtp?.otp !== VerifyOtpDto.otp) {
        // const userOtpData = await this.UserOtpRepository.findOneAndUpdate(
        //   { userId: _id },
        //   { $inc: { verifyOTPCount: -1 } },
        //   { new: true },
        // );

        // if (userOtpData.verifyOTPCount === 0) {
        //   const retryAfter = new Date().setHours(new Date().getHours() + 1);
        //   await this.userOtpModel.findOneAndUpdate(
        //     { userId: _id },
        //     { $set: { retryAfter: retryAfter } },
        //   );

        //   throw new BadRequestException({
        //     message: `OTP limit has exceeded since you made too many wrong attempts. Please try again after 1 hour.`,
        //     status: false,
        //   });
        // }

        throw new BadRequestException(`OTP Invalid`
          // `OTP Invalid, only ${userOtpData.verifyOTPCount} attempts left`,
        );
      } else if (userOtp.otp === VerifyOtpDto.otp) {
        // const minutes = await this.getMinutesBetweenDates(
        //   new Date(userOtp.OTPExpiration),
        //   new Date(),
        // );

        // if (minutes > 5) {
        //   throw new BadRequestException('OTP expired');
        // }

        // await this.UserOtpRepository.deleteOne({ userId: _id });
      }
    } else if (
      (this.configService.get('NODE_ENV') === 'DEV' ||
        this.configService.get('NODE_ENV') === 'UAT') &&
      VerifyOtpDto.otp === '0000'
    ) {
      // await this.UserOtpRepository.deleteOne({ userId: _id });
    }
    else{
      if (userOtp.otp !== VerifyOtpDto.otp) {
        console.log(`${this.configService.get('NODE_ENV')}`)
        // const userOtpData = await this.UserOtpRepository.findOneAndUpdate(
        //   { userId: _id },
        //   { $inc: { verifyOTPCount: -1 } },
        //   { new: true },
        // );

        // if (userOtpData.verifyOTPCount === 0) {
        //   const retryAfter = new Date().setHours(new Date().getHours() + 1);
        //   await this.userOtpModel.findOneAndUpdate(
        //     { userId: _id },
        //     { $set: { retryAfter: retryAfter } },
        //   );

        //   throw new BadRequestException({
        //     message: `OTP limit has exceeded since you made too many wrong attempts. Please try again after 1 hour.`,
        //     status: false,
        //   });
        // }

        throw new BadRequestException(
          `OTP Invalid`
          // `OTP Invalid, only ${userOtpData.verifyOTPCount} attempts left`,
        );
      } else if (userOtp.otp === VerifyOtpDto.otp) {
        // const minutes = await this.getMinutesBetweenDates(
        //   new Date(userOtp.OTPExpiration),
        //   new Date(),
        // );

        if (true) {
          throw new BadRequestException('OTP expired');
        }

        // await this.UserOtpRepository.deleteOne({ userId: _id });
      }
    }

    // if (otp !== userOtp.otp) {
    //   return {
    //     message: 'OTP is Invalid!',
    //     status: 400,
    //     matched: false
    //   };
    // }

    const payload = { id, role_id: role.role_id };
    console.log(payload);
    // const accessToken = jwt.sign(payload, `${process.env.JWT_SECRET || 'raider'}`, { expiresIn: `${process.env.ACCESSEXPIRESIN || '0.25h'}` });
    // const referenceToken = jwt.sign(payload, `${process.env.JWT_SECRET || 'raider'}`, { expiresIn: `${process.env.REFEXPIRESIN || '1d'}` });
    const accessToken = this.jwtService.sign(payload, { secret: `${process.env.JWT_SECRET || 'raider'}`, expiresIn: `${process.env.ACCESSEXPIRESIN || '365d'}` });
    const referenceToken = this.jwtService.sign(payload, { secret: `${process.env.JWT_SECRET || 'raider'}`, expiresIn: `${process.env.REFEXPIRESIN || '365d'}` });

    const accessTokenExpiry = new Date();
    accessTokenExpiry.setHours(accessTokenExpiry.getHours() + 0.25);

    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 1);

    const existing = await this.authTokenRepo.findOne({ where: { user_id: id } });

    if (existing) {
      // Update existing record
      await this.authTokenRepo.update(
        { user_id: id },
        {
          push_token: fcmToken,
          access_token: accessToken,
          expires_in_access_token: accessTokenExpiry,
          refresh_token: referenceToken,
          expires_in_refresh_token: refreshTokenExpiry,
          create_date: new Date(),
          role_id: role.role_id,
        }
      );
    } else {
      // Insert new record
      const tokenEntity = this.authTokenRepo.create({
        user_id: id,
        push_token: fcmToken,
        access_token: accessToken,
        expires_in_access_token: accessTokenExpiry,
        refresh_token: referenceToken,
        expires_in_refresh_token: refreshTokenExpiry,
        create_date: new Date(),
        role_id: role.role_id,
      });

      await this.authTokenRepo.save(tokenEntity);
    }

    return {
      status: 200,
      isValid:true,
      message: 'Login Successfully!',
      data:{
        accessToken,
        referenceToken,
      }
    };
  }

  async getMinutesBetweenDates(startTime, endTime) {
    const diff = endTime.getTime() - startTime.getTime();

    return diff / 60000;
  }

  async resendOtp(resendOtpDto: ResendOtpDto) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: resendOtpDto.id }
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.status) {
        throw new ForbiddenException('Account is inactive');
      }

      // For development environment, return 0000
      if (this.configService.get('NODE_ENV') === 'DEV' || 
          this.configService.get('NODE_ENV') === 'UAT') {
        const response = {
          status: 200,
          message: 'OTP sent successfully',
          data: {
            id: user.id,
            email_otp: '0000'
          }
        };

        if (resendOtpDto.action === 'register') {
          response.data['phone_otp'] = '0000';
        }

        return response;
      }

      // Generate new OTPs
      const emailOtp = crypto.randomInt(1000, 9999).toString();
      const phoneOtp = resendOtpDto.action === 'register' ? crypto.randomInt(1000, 9999).toString() : null;

      // Save Email OTP
      const existingEmailOtp = await this.UserOtpRepository.findOne({ 
        where: { 
          user_id: user.id,
          action: `${resendOtpDto.action}_email`
        } 
      });

      if (existingEmailOtp) {
        existingEmailOtp.otp = emailOtp;
        await this.UserOtpRepository.save(existingEmailOtp);
      } else {
        const userEmailOtp = this.UserOtpRepository.create({
          user_id: user.id,
          otp: emailOtp,
          action: `${resendOtpDto.action}_email`
        });
        await this.UserOtpRepository.save(userEmailOtp);
      }

      // For registration, also save Phone OTP
      if (resendOtpDto.action === 'register') {
        const existingPhoneOtp = await this.UserOtpRepository.findOne({ 
          where: { 
            user_id: user.id,
            action: `${resendOtpDto.action}_phone`
          } 
        });

        if (existingPhoneOtp) {
          existingPhoneOtp.otp = phoneOtp;
          await this.UserOtpRepository.save(existingPhoneOtp);
        } else {
          const userPhoneOtp = this.UserOtpRepository.create({
            user_id: user.id,
            otp: phoneOtp,
            action: `${resendOtpDto.action}_phone`
          });
          await this.UserOtpRepository.save(userPhoneOtp);
        }
      }

      // Here you would typically send the OTPs via email and SMS
      // TODO: Implement email and SMS sending logic

      return {
        status: 200,
        message: 'OTP sent successfully',
        data: {
          id: user.id,
          ...(this.configService.get('NODE_ENV') === 'DEV' && { 
            email_otp: emailOtp,
            ...(resendOtpDto.action === 'register' && { phone_otp: phoneOtp })
          })
        }
      };
    } catch (error) {
      throw error;
    }
  }

  async GetActiveCountry() {
    const countries = await this.countryRepository.find({ where: { status: 1 } });
    const result = countries.map(country => ({
      name: country.name,
      country_code: country.country_code,
      phone_code: country.phone_country_code,
      country_flag : `${process.env.IMAGE_BASE_URL}/images/flags/32x32/${country.country_code.toLowerCase()}.png`
    }));
    return { status: 200, message: 'Countries fetched successfully', data: result };
  }

  async saveFilesData(req, files: MulterFile[]) {
    try {
        const { id } = req.user;
        if(!id) {
          throw new BadRequestException('User not found');
        }

        // Check if we have both front and back files
        if (files.length !== 2) {
            throw new BadRequestException('Please upload both front and back ID photos');
        }

        const frontFile = files.find(file => file.fieldname === 'photo_id_number_frontend');
        const backFile = files.find(file => file.fieldname === 'photo_id_number_backend');

        if (!frontFile || !backFile) {
            throw new BadRequestException('Please provide both front and back ID photos with correct field names');
        }

        // Create user_data entries for both files
        const userDataEntries = [
            {
                user_id: id,
                field_key: 'photo_id_number_frontend',
                field_value: 'uploads/'+frontFile.filename,
                role_id: 6
            },
            {
                user_id: id,
                field_key: 'photo_id_number_backend',
                field_value: 'uploads/'+backFile.filename,
                role_id: 6
            }
        ];

        // Save to user_data table
        await this.userDataRepository.save(userDataEntries);
      
        return {
            status: 200,
            message: 'ID photos uploaded successfully',
            data: {
                totalFiles: files.length,
                files: {
                    frontId: {
                        filename: frontFile.filename,
                        fileUrl: `${process.env.IMAGE_UPLOAD_URL}uploads/${frontFile.filename}`
                    },
                    backId: {
                        filename: backFile.filename,
                        fileUrl: `${process.env.IMAGE_UPLOAD_URL}uploads/${backFile.filename}`
                    }
                }
            }
        };
    } catch (error) {
        throw new InternalServerErrorException('Error saving files data: ' + error.message);
    }
}

  async forgotPasswordPhone(forgotPasswordDto: ForgotPasswordPhoneDto) {
    try {
      const user = await this.userRepository.findOne({
        where: { phone_number: forgotPasswordDto.mobile }
      });

      if (!user) {
        throw new NotFoundException('No user found with this phone number');
      }

      if (!user.status) {
        throw new ForbiddenException('Account is inactive');
      }

      // Generate OTP
      const otp = crypto.randomInt(1000, 9999).toString();

      // Save OTP
      const existingOtp = await this.UserOtpRepository.findOne({ 
        where: { 
          user_id: user.id,
          action: 'forgot_password'
        } 
      });

      if (existingOtp) {
        existingOtp.otp = otp;
        await this.UserOtpRepository.save(existingOtp);
      } else {
        const userOtp = this.UserOtpRepository.create({
          user_id: user.id,
          otp: otp,
          action: 'forgot_password'
        });
        await this.UserOtpRepository.save(userOtp);
      }

      return {
        status: 200,
        message: 'OTP sent successfully',
        data: {
          id: user.id
        }
      };
    } catch (error) {
      throw error;
    }
  }

  async verifyOtpForPassword(verifyOtpDto: VerifyOtpForPasswordDto) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: verifyOtpDto.id }
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.status) {
        throw new ForbiddenException('Account is inactive');
      }

      // For development environment, allow bypass with 0000
      if (
        (this.configService.get('NODE_ENV') === 'DEV' ||
         this.configService.get('NODE_ENV') === 'UAT') &&
        verifyOtpDto.otp === '0000'
      ) {
        return {
          status: 200,
          message: 'OTP verified successfully',
          data: {
            id: user.id
          }
        };
      }

      const userOtp = await this.UserOtpRepository.findOne({
        where: {
          user_id: verifyOtpDto.id,
          action: 'forgot_password'
        }
      });

      if (!userOtp || userOtp.otp !== verifyOtpDto.otp) {
        throw new BadRequestException('Invalid OTP');
      }

      return {
        status: 200,
        message: 'OTP verified successfully',
        data: {
          id: user.id
        }
      };
    } catch (error) {
      throw error;
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    try {
      if (resetPasswordDto.password !== resetPasswordDto.confirmPassword) {
        throw new BadRequestException('Passwords do not match');
      }

      const user = await this.userRepository.findOne({
        where: { id: resetPasswordDto.id }
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.status) {
        throw new ForbiddenException('Account is inactive');
      }

      // Hash the new password
      const hashedPassword = this.baseService.hashPassword(resetPasswordDto.password);

      // Update password
      user.password = hashedPassword;
      await this.userRepository.save(user);

      // Delete the OTP
      await this.UserOtpRepository.delete({
        user_id: resetPasswordDto.id,
        action: 'forgot_password'
      });

      return {
        status: 200,
        message: 'Password updated successfully'
      };
    } catch (error) {
      throw error;
    }
  }
}