import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsInt, IsNumber, IsOptional, IsString } from "class-validator";

export class AddAcountDto {
    @ApiProperty({ example: '123456789789'})
    @IsString()
    @IsOptional()
    account_number?: string; 

    @ApiProperty({ example: 'mpesa'})
    @IsString()
    @IsOptional()
    pay_system?: string;

    @ApiProperty({ example: 'bankaccount'})
    @IsString()
    pay_type: string;

    @ApiProperty({ example: '123456789789'})
    @IsString()
    @IsOptional()
    IFSC?: string;

    @ApiProperty({ example: '123456789789'})
    @IsString()
    @IsOptional()
    customer_id?: string;

    @ApiProperty({ example: '123456789789'})
    @IsString()
    @IsOptional()
    number?: string;

}

export class UpdateAcountPriorityDto {

    @ApiProperty({ example: 'bankaccount'})
    @IsString()
    @IsOptional()
    pay_type?: string;

    @ApiProperty({ example: 1, required: false, default: 0, enum: [0, 1] })
    @IsOptional()
    @IsIn([0, 1])
    priority?: number;


}

export class Faq{
    @ApiProperty({ example: 'en'})
    @IsString()
    lang:string;
}

export class IsOnline{
    @ApiProperty({ example: '1'})
    @IsNumber()
    isOnline:number;
}