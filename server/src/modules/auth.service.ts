import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
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

  async loginCouple(name: string, password: string) {
    const normalizedName = String(name || '').trim();
    const normalizedPassword = String(password || '');
    const envName = String(this.config.get<string>('COUPLE_LOGIN_NAME') || 'love').trim();
    const envPassword = String(this.config.get<string>('COUPLE_LOGIN_PASSWORD') || '5201314');
    const space = await this.prisma.coupleSpace.findUnique({
      where: { slug: 'default' },
      select: { accessName: true, accessPassword: true },
    });
    const coupleName = String(space?.accessName || envName).trim();
    const verifiedPassword = space?.accessPassword
      ? await this.verifyStoredCouplePassword(space.accessPassword, normalizedPassword)
      : normalizedPassword === envPassword;

    if (!normalizedName || !normalizedPassword || normalizedName !== coupleName || !verifiedPassword) {
      throw new UnauthorizedException('Invalid couple credentials');
    }

    const accessToken = await this.jwt.signAsync(
      {
        sub: 'couple',
        name: normalizedName,
        role: 'couple',
      },
      {
        secret: this.getCoupleJwtSecret(),
        expiresIn: '30d',
      },
    );

    return {
      accessToken,
      name: normalizedName,
      expiresIn: 30 * 24 * 60 * 60,
    };
  }

  async getCoupleAccess(slug: string) {
    const space = await this.prisma.coupleSpace.findUnique({
      where: { slug },
      select: { accessName: true, accessPassword: true },
    });
    const fallbackName = String(this.config.get<string>('COUPLE_LOGIN_NAME') || 'love').trim();

    return {
      name: space?.accessName || fallbackName,
      passwordSet: Boolean(space?.accessPassword),
    };
  }

  async updateCoupleAccess(slug: string, body: { name?: string; password?: string }) {
    const normalizedName = String(body.name || '').trim();
    const normalizedPassword = String(body.password || '');
    if (!normalizedName) {
      throw new BadRequestException('Couple login name is required');
    }

    const data: { accessName: string; accessPassword?: string } = {
      accessName: normalizedName,
    };
    if (normalizedPassword) {
      data.accessPassword = await argon2.hash(normalizedPassword);
    }

    await this.prisma.coupleSpace.update({
      where: { slug },
      data,
    });

    return this.getCoupleAccess(slug);
  }

  private async verifyStoredCouplePassword(storedPassword: string, password: string) {
    if (storedPassword.startsWith('$argon2')) {
      return argon2.verify(storedPassword, password).catch(() => false);
    }
    return storedPassword === password;
  }

  getJwtSecret() {
    return (
      this.config.get<string>('ADMIN_JWT_SECRET') ||
      this.config.get<string>('ADMIN_PASSWORD') ||
      'love1-local-admin-secret'
    );
  }

  getCoupleJwtSecret() {
    return (
      this.config.get<string>('COUPLE_JWT_SECRET') ||
      this.config.get<string>('ADMIN_JWT_SECRET') ||
      this.config.get<string>('ADMIN_PASSWORD') ||
      'love1-local-couple-secret'
    );
  }
}
