import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
  ],
  controllers: [PublicController, AdminController],
  providers: [ContentService, PrismaService, StorageService],
})
export class AppModule {}
