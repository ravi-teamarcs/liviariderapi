// update-order.dto.ts

import { IsNumber, IsString } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsNumber()
  orderId: number;

  @IsString()
  status: string;
}
