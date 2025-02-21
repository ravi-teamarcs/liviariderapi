import { BadRequestException, ForbiddenException, HttpException, HttpStatus, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto, VerifyOtpDto } from './dto/login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entity/user.entity';
import * as crypto from "crypto";
import * as jwt from 'jsonwebtoken';
import { JwtService } from '@nestjs/jwt';
import { UserOtp } from '../entity/userotp.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(UserOtp) private UserOtpRepository: Repository<UserOtp>,
    private configService: ConfigService,
    private jwtService: JwtService, // Inject JwtService to generate JWT tokens
  ) { }

  async register(registerDto: RegisterDto) {

    //const hashedPassword = crypto.createHash("md5").update(registerDto.password).digest("hex");
    // const user = this.userModel.create({
    //   ...registerDto,
    // //  password: hashedPassword,
    // });
    // await this.userModel.save(user);

    return { message: 'User registered successfully!', status: 200 };
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

      // const hashedPassword = crypto.createHash('md5').update(loginDto.password).digest('hex');
      const hashedPassword = loginDto.password
      if (hashedPassword !== user.password) {
        throw new UnauthorizedException(
          'You have entered an invalid password',
        );
      }

      return { message: 'OTP sent successfully', email: user.id, status:200 };

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

}
// const user = await this.UserRepository.findOne({ where: { email: loginDto.email, isActive: true } });
// if (!user) {
//   throw new Error("Invalid Email");
// }
// const hashedPassword = crypto.createHash("md5").update(loginDto.password).digest("hex");
// if (hashedPassword !== user.password) {
//   throw new Error("Invalid Password");
// }