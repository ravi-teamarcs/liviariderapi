import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class ForgotPasswordPhoneDto {
    @ApiProperty({ example: '254' })
    @IsNotEmpty()
    @IsString()
    phone_code: string;

    @ApiProperty({ example: '1234567890' })
    @IsNotEmpty()
    @Matches(/^\d{10}$|^\d{12}$/, {
        message: 'Mobile number must be 10 or 12 digits',
    })
    mobile: string;
}

export class VerifyOtpForPasswordDto {
    @ApiProperty({ example: 1 })
    @IsNotEmpty()
    id: number;

    @ApiProperty({ example: '1234' })
    @IsString()
    @IsNotEmpty()
    otp: string;
}

export class ResetPasswordDto {
    @ApiProperty({ example: 1 })
    @IsNotEmpty()
    id: number;

    @ApiProperty({ example: 'newPassword123' })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @ApiProperty({ example: 'newPassword123' })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    confirmPassword: string;
}
