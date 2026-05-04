import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AdminAuthController } from './modules/admin-auth.controller';
import { AdminAuthGuard } from './modules/admin-auth.guard';
import { AuthService } from './modules/auth.service';
import { AdminController } from './modules/admin.controller';
import { CoupleAuthController } from './modules/couple-auth.controller';
import { CoupleAuthGuard } from './modules/couple-auth.guard';
import { CoupleController } from './modules/couple.controller';
import { HealthController } from './modules/health.controller';
import { PublicController } from './modules/public.controller';
import { ContentService } from './modules/content.service';
import { PrismaService } from './modules/prisma.service';
import { StorageService } from './modules/storage.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../.env', '.env'],
    }),
    JwtModule.register({}),
  ],
  controllers: [HealthController, PublicController, AdminAuthController, AdminController, CoupleAuthController, CoupleController],
  providers: [AdminAuthGuard, CoupleAuthGuard, AuthService, ContentService, PrismaService, StorageService],
})
export class AppModule {}
