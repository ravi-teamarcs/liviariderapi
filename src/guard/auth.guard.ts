import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      console.log('Token Received:', token);  // Log the token to check if it's passed correctly
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'raider',  // Make sure the secret matches the one used to sign the token
      });
      console.log('Token Payload:', payload);  // Log the decoded payload to check its validity
      request['user'] = payload;  // Attach user payload to request
      return true;
    } catch (error) {
      console.error('Token verification error:', error);  // Log error for debugging
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
