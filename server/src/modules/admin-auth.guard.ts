import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly jwt: JwtService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authorization = String(request.headers.authorization || '');
    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Missing admin token');
    }

    try {
      const payload = await this.jwt.verifyAsync(token, {
        secret: this.auth.getJwtSecret(),
      });
      if (payload?.role !== 'admin') {
        throw new Error('Invalid role');
      }
      request.admin = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid admin token');
    }
  }
}
