import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from './prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async login(email: string, password: string) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPassword = String(password || '');
    const adminEmail = String(this.config.get<string>('ADMIN_EMAIL') || 'admin@love.local').trim().toLowerCase();
    const adminPassword = String(this.config.get<string>('ADMIN_PASSWORD') || 'ChangeMe123!');

    if (!normalizedEmail || !normalizedPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    let verified = false;
    if (user?.passwordHash) {
      verified = await argon2.verify(user.passwordHash, normalizedPassword).catch(() => false);
    }

    if (!verified && normalizedEmail === adminEmail && normalizedPassword === adminPassword) {
      verified = true;
    }

    if (!verified) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.jwt.signAsync(
      {
        sub: user?.id ?? 'env-admin',
        email: normalizedEmail,
        role: 'admin',
      },
      {
        secret: this.getJwtSecret(),
        expiresIn: '7d',
      },
    );

    return {
      accessToken,
      email: normalizedEmail,
      expiresIn: 7 * 24 * 60 * 60,
    };
  }

  getJwtSecret() {
    return (
      this.config.get<string>('ADMIN_JWT_SECRET') ||
      this.config.get<string>('ADMIN_PASSWORD') ||
      'love1-local-admin-secret'
    );
  }
}

