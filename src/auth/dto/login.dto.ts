import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsNumber, Matches, IsEmail, IsIn } from 'class-validator';

// export class LoginDto {
//   // @IsString()
//   // @IsNotEmpty()
//   // email: string;

//   // @IsString()
//   // @IsNotEmpty()
//    //@IsNotEmpty()
//   // password: string;

//   @ApiProperty({ example: '2541234567890' })
//   @IsNotEmpty()
//   @Matches(/^\d{10}$|^\d{12}$/, {
//     message: 'Mobile number must be either 10 or 12 digits',
//   })
//   mobile: string;
// }

export class LoginDto {
  @ApiProperty({ example: 'firstName.lastName@domain.com' })
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @ApiProperty({ example: 'Password' })
  @IsNotEmpty()
  @IsString()
  password: string;
}

export class VerifyOtpDto {
  @ApiProperty({example:'xxxxxxxx'})
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @ApiProperty({example:'xxxx'})
  @IsString()
  @IsNotEmpty()
  otp: string;
}

export class RegisterVerifyOTP {
  @ApiProperty({example:'xxxxxxxx'})
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @ApiProperty({example:'xxxx'})
  @IsString()
  @IsNotEmpty()
  emailOtp: string;

  @ApiProperty({example:'xxxx'})
  @IsString()
  @IsNotEmpty()
  phoneOtp: string;
}

export class ResendOtpDto {
  @ApiProperty({ example: '1' })
  @IsNotEmpty()
  id: number;

  @ApiProperty({ example: 'login' })
  @IsNotEmpty()
  @IsString()
  @IsIn(['login', 'register'])
  action: string;
}