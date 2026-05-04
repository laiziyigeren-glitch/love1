import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ContentService } from './content.service';
import { CoupleAuthGuard } from './couple-auth.guard';
import { StorageService, type UploadPathOptions } from './storage.service';

@Controller('couple/spaces/:slug')
@UseGuards(CoupleAuthGuard)
export class CoupleController {
  constructor(
    private readonly content: ContentService,
    private readonly storage: StorageService,
  ) {}

  @Post('media/upload-url')
  createUploadUrl(@Param('slug') slug: string, @Body() body: { fileName: string; mimeType: string } & UploadPathOptions) {
    return this.storage.createUploadUrl(slug, body.fileName, body.mimeType, body);
  }

  @Post('media/complete')
  completeMediaUpload(
    @Param('slug') slug: string,
    @Body()
    body: {
      objectKey: string;
      url: string;
      thumbnailUrl?: string;
      mimeType: string;
      size: number;
      title?: string;
      albumTitle?: string;
      location?: string;
      takenAt?: string;
      tags?: string[];
      visibility?: 'PUBLIC' | 'PRIVATE';
    },
  ) {
    return this.content.completeMediaUpload(slug, body);
  }

  @Patch('avatar')
  updateAvatar(@Param('slug') slug: string, @Body() body: { avatarUrl: string }) {
    return this.content.updatePrimaryAvatar(slug, body.avatarUrl);
  }

  @Patch('theme-background')
  updateThemeBackground(@Param('slug') slug: string, @Body() body: { backgroundUrl: string }) {
    return this.content.updateThemeBackground(slug, body.backgroundUrl);
  }
}
