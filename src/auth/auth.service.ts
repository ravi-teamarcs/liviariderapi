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
import {method, salt} from '../common/constants/config.json' 
import { BaseService } from 'src/common/services/base.service';
import { UserData } from 'src/entity/userdata.entity';
import { Counties } from 'src/entity/countries.entity';


@Injectable()
export class AuthService {
  private baseService: BaseService;
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(UserOtp) private UserOtpRepository: Repository<UserOtp>,
    @InjectRepository(UserData) private userDataRepository: Repository<UserData>,
    @InjectRepository(Counties) private countryRepository: Repository<Counties>,
    private configService: ConfigService,
    private jwtService: JwtService, 
    
  ) { this.baseService = new BaseService(salt, method); }

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

    try {
      const savedUser = await this.userRepository.save(newUser);
      const userExists = await this.userRepository.findOne({ where: { id: newUser.id } });

      if (!userExists) {
          throw new Error('User does not exist');
      }
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


    const payload = { id };
    // const accessToken = jwt.sign(payload, `${process.env.JWT_SECRET || 'raider'}`, { expiresIn: `${process.env.ACCESSEXPIRESIN || '0.25h'}` });
    // const referenceToken = jwt.sign(payload, `${process.env.JWT_SECRET || 'raider'}`, { expiresIn: `${process.env.REFEXPIRESIN || '1d'}` });
    const accessToken = this.jwtService.sign(payload, { secret: `${process.env.JWT_SECRET || 'raider'}`, expiresIn: `${process.env.ACCESSEXPIRESIN || '0.25h'}` });
    const referenceToken = this.jwtService.sign(payload, { secret: `${process.env.JWT_SECRET || 'raider'}`, expiresIn: `${process.env.REFEXPIRESIN || '1d'}` });



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


  // async login(loginDto: LoginDto) {

  //   const otp = crypto.randomInt(1000, 9999).toString();

  //   try {
  //     let isNew = true;
  //     const userhasotp = await this.UserOtpRepository.findOne({ where: { email: loginDto.email } })
  //     if (userhasotp) {
  //       userhasotp.otp = otp;
  //       await this.UserOtpRepository.save(userhasotp);  // Save the updated OTP
  //       isNew=false;
  //     }
  //     else {
  //       const userOtp = this.UserOtpRepository.create({
  //         email: loginDto.email,
  //         otp: otp,
  //       });

  //       await this.UserOtpRepository.save(userOtp);

  //       const user = this.UserRepository.create({
  //         email: userOtp.email,
  //       });
  //       await this.UserRepository.save(user);

  //     }
  //     return { email: loginDto.email, status: 200, isNew: isNew };
  //   } catch (error) {
  //     console.error('Error saving OTP:', error);
  //     throw new HttpException('Failed to store OTP', HttpStatus.INTERNAL_SERVER_ERROR);
  //   }


  // }
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
    const { id, otp } = VerifyOtpDto;
    
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


    const payload = { id };
    // const accessToken = jwt.sign(payload, `${process.env.JWT_SECRET || 'raider'}`, { expiresIn: `${process.env.ACCESSEXPIRESIN || '0.25h'}` });
    // const referenceToken = jwt.sign(payload, `${process.env.JWT_SECRET || 'raider'}`, { expiresIn: `${process.env.REFEXPIRESIN || '1d'}` });
    const accessToken = this.jwtService.sign(payload, { secret: `${process.env.JWT_SECRET || 'raider'}`, expiresIn: `${process.env.ACCESSEXPIRESIN || '0.25h'}` });
    const referenceToken = this.jwtService.sign(payload, { secret: `${process.env.JWT_SECRET || 'raider'}`, expiresIn: `${process.env.REFEXPIRESIN || '1d'}` });



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

  async resendOtp(id: number) {

    const otp = crypto.randomInt(1000, 9999).toString();

    try {

      const existingOtp = await this.UserOtpRepository.findOne({ where: { user_id : id } })
      if (existingOtp) {
        existingOtp.otp = otp;
        await this.UserOtpRepository.save(existingOtp);
      } 
      else {

        // const userOtp = this.UserOtpRepository.create({
        //   id,
        //   otp,
        // });
        // await this.UserOtpRepository.save(userOtp);
      }


      return { message: 'OTP resent successfully!', status: 200 };
    } catch (error) {
      console.error('Error resending OTP:', error);
      throw new Error('Failed to resend OTP');
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
}
// const user = await this.UserRepository.findOne({ where: { email: loginDto.email, isActive: true } });
// if (!user) {
//   throw new Error("Invalid Email");
// }
// const hashedPassword = crypto.createHash("md5").update(loginDto.password).digest("hex");
// if (hashedPassword !== user.password) {
//   throw new Error("Invalid Password");
// }