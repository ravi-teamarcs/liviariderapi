import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsEmail, Matches } from 'class-validator';

export class RegisterDto {

    @ApiProperty({ example: 'Jhon' })
    @IsNotEmpty()
    @IsString()
    @Transform(({ value }) => value.toLowerCase())
    firstName: string;

    @ApiProperty({ example: 'singh' })
    @IsNotEmpty()
    @IsString()
    @Transform(({ value }) => value.toLowerCase())
    lastName: string;

    @ApiProperty({ example: 'firstName.lastName@domain.com' })
    @IsNotEmpty()
    @IsString()
    @Transform(({ value }) => value.toLowerCase())
    email: string;

    @ApiProperty({ example: '1234567890' })
    @IsNotEmpty()
    @Matches(/^\d{10}$|^\d{12}$/, {
        message: 'Mobile number must be either 10 or 12 digits',
    })
    mobile: string;

    @ApiProperty({ example: 'Password' })
    @IsNotEmpty()
    @IsString()
    password: string;

  
}
