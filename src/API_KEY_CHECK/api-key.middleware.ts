// api-key.middleware.ts
import { Injectable, NestMiddleware, HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ApiKeyMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        const apiKey = req.headers['x-api-key']; // Get the API key from the header


        if (!apiKey || apiKey !== process.env.API_KEY) {
            throw new UnauthorizedException('Invalid API Key');
        }

        next();  // Continue processing the request if the API key is valid
    }
}
