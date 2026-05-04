import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AdminAuthController } from './modules/admin-auth.controller';
import { AdminAuthGuard } from './modules/admin-auth.guard';
import { AuthService } from './modules/auth.service';
import { AdminController } from './modules/admin.controller';
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
  controllers: [PublicController, AdminAuthController, AdminController],
  providers: [AdminAuthGuard, AuthService, ContentService, PrismaService, StorageService],
})
export class AppModule {}
