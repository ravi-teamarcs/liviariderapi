import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Query, Req, UploadedFiles, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { DeliveryMenService } from './delivery-men.service';
import { AuthGuard } from 'src/guard/auth.guard';
import { AnyFilesInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { multerConfig } from 'src/config/multer.config';
import { AddAcountDto, Faq, UpdateAcountPriorityDto } from './dto/delivery-men.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
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

@Controller('delivery-men')
export class DeliveryMenController {
  constructor(private readonly deliveryMenService: DeliveryMenService) {}

  @Get('/orders')
  @UseInterceptors(AnyFilesInterceptor())
  @UsePipes(ValidationPipe)
  @UseGuards(AuthGuard)
  async getOrdersByDeliveryMen(
    @Req() req: Request,
  ) {
    return this.deliveryMenService.getOrdersByDeliveryMen(req);
  }

  @Get('/orders/:id')
  @UseInterceptors(AnyFilesInterceptor())
  @UsePipes(ValidationPipe)
  @UseGuards(AuthGuard)
  async getOrdersDetails(
    @Param('id') id: number,
    @Req() req: Request,
  ) {
    return this.deliveryMenService.getOrdersDetails(id, req);
  }

  @Get('/profile')
  @UseInterceptors(AnyFilesInterceptor())
  @UsePipes(ValidationPipe)
  @UseGuards(AuthGuard)
  async getProfileDetails(
    @Req() req: Request,
  ) {
    return this.deliveryMenService.getProfileDetails(req);
  }

  @Post('/upload-files')
  @UsePipes(ValidationPipe)
  @UseGuards(AuthGuard)
  @UseInterceptors(FileFieldsInterceptor([
      { name: 'profileImg', maxCount: 1 }
  ], multerConfig))
  async uploadFiles(@Req() req: Request, @UploadedFiles() files: { 
    profileImg?: MulterFile[],
  }) {
      try {
          if (!files.profileImg?.[0]) {
              throw new BadRequestException('Please upload profile photo');
          }

          return await this.deliveryMenService.uploadProfilePhoto(req, files.profileImg[0]);
      } catch (error) {
          throw new BadRequestException(error.message);
      }
  }

  @Post('/addAccount')
  @UsePipes(ValidationPipe)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async addAccount(
    @Body() addAccountDto: AddAcountDto,
    @Req() req: Request,
  ){
    return await this.deliveryMenService.addAccount(addAccountDto, req);
  }

  @Post('/GetAccountDetails')
  @UsePipes(ValidationPipe)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async getAccounts(
    @Req() req: Request,
  ){
    try {
      return await this.deliveryMenService.getAccounts(req);
    } catch (error) {
      throw new BadRequestException(error.message);
      
    }
  }


  @Post('/updateAccountPriority')
  @UsePipes(ValidationPipe)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async updateAccountPriority(
    @Body() priority: UpdateAcountPriorityDto,
    @Req() req: Request,
  ){
    try {
      return await this.deliveryMenService.updateAccountPriority(req, priority);
    } catch (error) {
      throw new BadRequestException(error.message);
      
    }
  }


  @Delete('/deleteAccount')
  @UsePipes(ValidationPipe)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async deleteAccount(
    @Body() account: AddAcountDto,
    @Req() req: Request,
  ){
    try {
      return await this.deliveryMenService.deleteAccount(req, account);
    } catch (error) {
      throw new BadRequestException(error.message);
      
    }
  }

  @Post('/faq')
  @UsePipes(ValidationPipe)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async getFaq(
    @Body() lang: Faq,
    @Req() req: Request,
  ){
    try {
      return await this.deliveryMenService.getFaq(req, lang);
    } catch (error) {
      throw new BadRequestException(error.message);
      
    }
  
  }

  @Get('/report')
  @UsePipes(ValidationPipe)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async getReport(
    @Req() req: Request,
  ){
    try {
      return await this.deliveryMenService.getReport(req);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('/paymentList')
  @UsePipes(ValidationPipe)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async getPaymentList(
    @Req() req: Request,
  ){
    try {
      return await this.deliveryMenService.getPaymentList(req);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
