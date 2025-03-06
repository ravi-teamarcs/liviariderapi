import { Controller, Get, Param, Query, Req, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { DeliveryMenService } from './delivery-men.service';
import { AuthGuard } from 'src/guard/auth.guard';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

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

}
