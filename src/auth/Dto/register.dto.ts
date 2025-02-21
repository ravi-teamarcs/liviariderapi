import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsEmail, Matches } from 'class-validator';

export class RegisterDto {

    @IsNotEmpty()
    @IsString()
    @Transform(({ value }) => value.toLowerCase())
    email: string;

    @IsNotEmpty()
    @Matches(/^\d{10}$|^\d{12}$/, {
        message: 'Mobile number must be either 10 or 12 digits',
    })
    mobile: string;

  
}
