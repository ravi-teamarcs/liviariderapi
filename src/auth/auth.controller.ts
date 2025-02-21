import { Controller, Post, Body, Get, Param, UsePipes, ValidationPipe, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto, VerifyOtpDto } from './dto/login.dto';
import { ApiOperation } from '@nestjs/swagger';


@Controller('auth') // The base route for authentication-related actions
export class AuthController {
    constructor(private readonly authService: AuthService) { }


    @HttpCode(200)
    @Post('login')
    @UsePipes(ValidationPipe)
    @ApiOperation({ summary: 'login' })
    async login(@Body() loginDto: LoginDto) {
        return await this.authService.login(loginDto);
    }

    @ApiOperation({ summary: 'resets OTP by mobile' })
    @Post('resendotp')
    async resendOtp(@Body() user_id: number) {
        try {
            const result = await this.authService.resendOtp(user_id);
            return result;
        } catch (error) {
            return {
                message: error.message,
                status: 400,
            };
        }
    }

    @ApiOperation({ summary: 'verify otp using mobile' })
    @Post('verifyotp')
    async verifyOTP(@Body() compareOtpDto: VerifyOtpDto) {
        try {
            const result = await this.authService.verifyOTP(compareOtpDto);
            return result;
        } catch (error) {
            return {
                message: error.message,
                status: 400,
            };
        }
    }

    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }


}
