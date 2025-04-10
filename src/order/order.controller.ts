import {
  Controller,
  Get,
  Post,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  ValidationPipe,
  UsePipes,
  UseGuards,
  Req,
  Patch,
  Body,
} from '@nestjs/common';
import { OrderService } from './order.service';
import {
  AnyFilesInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { multerConfig } from 'src/config/multer.config';
import { AuthGuard } from 'src/guard/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { UpdateOrderStatusDto } from './dto/update-status.dto';

declare module 'express' {
  interface Request {
    user: any;
  }
}

// Define the Multer file type
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

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  async getOrders() {
    return await this.orderService.getOrders();
  }

  @Get('/getAssignedOrders')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async getAssignedOrders(@Req() req: Request) {
    return await this.orderService.getAssignedOrders(req);
  }

  // @Post('upload')
  // @UseInterceptors(FilesInterceptor('file', 10, multerConfig))
  // @UseInterceptors(AnyFilesInterceptor())
  // @UsePipes(ValidationPipe)
  // @UseGuards(AuthGuard)
  // async uploadFiles(@Req() req: Request,@UploadedFiles() files: MulterFile[]) {
  //     try {
  //         if (!files || files.length === 0) {
  //             throw new BadRequestException('No files uploaded');
  //         }

  //         return await this.orderService.saveFilesData(req, files);
  //     } catch (error) {
  //         throw new BadRequestException(error.message);
  //     }
  // }
  @Post('status')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async updateOrderStatus(
    @Req() req: Request,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return await this.orderService.updateOrderStatus(dto);
  }
}
