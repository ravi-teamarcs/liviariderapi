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
}

