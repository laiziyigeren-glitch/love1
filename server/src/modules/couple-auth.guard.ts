import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';

@Injectable()
export class CoupleAuthGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly jwt: JwtService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authorization = String(request.headers.authorization || '');
    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Missing couple token');
    }

    try {
      const payload = await this.jwt.verifyAsync(token, {
        secret: this.auth.getCoupleJwtSecret(),
      });
      if (payload?.role !== 'couple') {
        throw new Error('Invalid role');
      }
      request.couple = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid couple token');
    }
  }
}

