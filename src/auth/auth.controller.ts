import { Controller, Post, Body, Get, Param, UsePipes, ValidationPipe, HttpCode, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto, RegisterVerifyOTP, VerifyOtpDto } from './dto/login.dto';
import { ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from 'src/guard/auth.guard';
import { AnyFilesInterceptor } from '@nestjs/platform-express';


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

    @HttpCode(200)
    @ApiOperation({ summary: 'resets OTP by mobile' })
    @Post('resendotp')
    @UsePipes(ValidationPipe)
    @ApiOperation({ summary: 'login' })
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

    @HttpCode(200)
    @ApiOperation({ summary: 'verify otp using mobile' })
    @Post('verifyotp')
    @UsePipes(ValidationPipe)
    @ApiOperation({ summary: 'login' })
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

    @HttpCode(200)
    @ApiOperation({ summary: 'Register new user' })
    @Post('register')
    @UsePipes(ValidationPipe)
    @ApiOperation({ summary: 'login' })
    async register(@Body() registerDto: RegisterDto) {
        return await this.authService.register(registerDto);
    }

    @HttpCode(200)
    @ApiOperation({ summary: 'Register new user' })
    @Post('register/verifyOtp')
    @UsePipes(ValidationPipe)
    @ApiOperation({ summary: 'VerifyOTP after register' })
    async registerVerifyOTP(@Body() RegisterVerifyOTP: RegisterVerifyOTP) {
        return await this.authService.RegisterVerifyOTP(RegisterVerifyOTP);
    }

    @HttpCode(200)
    @ApiOperation({ summary: 'Get Active Country ' })
    @ApiConsumes('multipart/form-data')
    @Get('getActiveCountry')
    @ApiOperation({ summary: 'Get Active Country' })
    async GetActiveCountry() {
        return await this.authService.GetActiveCountry();
    }
}
