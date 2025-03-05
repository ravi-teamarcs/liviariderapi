import { Controller, Post, Body, Get, Param, UsePipes, ValidationPipe, HttpCode, UseGuards, UseInterceptors, Req, UploadedFiles, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto, RegisterVerifyOTP, VerifyOtpDto } from './dto/login.dto';
import { ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from 'src/guard/auth.guard';
import { AnyFilesInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { multerConfig } from 'src/config/multer.config';
import { ForgotPasswordPhoneDto, ResetPasswordDto, VerifyOtpForPasswordDto } from './dto/forgot-password.dto';
import { ResendOtpDto } from './dto/login.dto';

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

    // @HttpCode(200)
    // @ApiOperation({ summary: 'resets OTP by mobile' })
    // @Post('resendotp')
    // @UsePipes(ValidationPipe)
    // @ApiOperation({ summary: 'login' })
    // async resendOtp(@Body() user_id: number) {
    //     try {
    //         const result = await this.authService.resendOtp(user_id);
    //         return result;
    //     } catch (error) {
    //         return {
    //             message: error.message,
    //             status: 400,
    //         };
    //     }
    // }

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
    @ApiOperation({ summary: 'Register' })
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

    @Post('upload')
    @UsePipes(ValidationPipe)
    @UseGuards(AuthGuard)
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'photo_id_number_frontend', maxCount: 1 },
        { name: 'photo_id_number_backend', maxCount: 1 }
    ], multerConfig))
    async uploadFiles(@Req() req: Request, @UploadedFiles() files: { 
        photo_id_number_frontend?: MulterFile[], 
        photo_id_number_backend?: MulterFile[] 
    }) {
        try {
            if (!files.photo_id_number_frontend?.[0] || !files.photo_id_number_backend?.[0]) {
                throw new BadRequestException('Please upload both front and back ID photos');
            }

            return await this.authService.saveFilesData(req, [
                files.photo_id_number_frontend[0],
                files.photo_id_number_backend[0]
            ]);
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    @Post('resend-otp')
    @HttpCode(200)
    @UsePipes(ValidationPipe)
    @ApiOperation({ summary: 'Resend OTP for login or registration' })
    async resendOtp(@Body() resendOtpDto: ResendOtpDto) {
        return await this.authService.resendOtp(resendOtpDto);
    }

    @Post('forgot-password/phone')
    @HttpCode(200)
    @UsePipes(ValidationPipe)
    @ApiOperation({ summary: 'Request password reset using phone number' })
    async forgotPasswordPhone(@Body() forgotPasswordDto: ForgotPasswordPhoneDto) {
        return await this.authService.forgotPasswordPhone(forgotPasswordDto);
    }

    @Post('forgot-password/verify-otp')
    @HttpCode(200)
    @UsePipes(ValidationPipe)
    @ApiOperation({ summary: 'Verify OTP for password reset' })
    async verifyOtpForPassword(@Body() verifyOtpDto: VerifyOtpForPasswordDto) {
        return await this.authService.verifyOtpForPassword(verifyOtpDto);
    }

    @Post('forgot-password/reset')
    @HttpCode(200)
    @UsePipes(ValidationPipe)
    @ApiOperation({ summary: 'Reset password after OTP verification' })
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
        return await this.authService.resetPassword(resetPasswordDto);
    }
}
