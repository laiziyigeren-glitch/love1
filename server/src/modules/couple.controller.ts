import { BadRequestException, Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ContentService } from './content.service';
import { AiAssistantService } from './ai-assistant.service';
import { CoupleAuthGuard } from './couple-auth.guard';
import { StorageService, type UploadPathOptions } from './storage.service';
import { Profile, ThemeConfig, type HomeSettings } from './types';

@Controller('couple/spaces/:slug')
@UseGuards(CoupleAuthGuard)
export class CoupleController {
  constructor(
    private readonly content: ContentService,
    private readonly storage: StorageService,
    private readonly ai: AiAssistantService,
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

  @Post('avatar-upload')
  async uploadAvatar(
    @Param('slug') slug: string,
    @Body()
    body: {
      fileName: string;
      mimeType: string;
      dataUrl: string;
    },
  ) {
    const match = String(body.dataUrl || '').match(/^data:([^;,]+);base64,(.+)$/);
    if (!match) {
      throw new BadRequestException('Invalid avatar payload');
    }
    const [, mimeType, base64] = match;
    const uploaded = await this.storage.uploadContent(
      slug,
      body.fileName || `avatar-${Date.now()}.jpg`,
      body.mimeType || mimeType || 'image/jpeg',
      Buffer.from(base64, 'base64'),
      { purpose: 'avatar' },
    );
    const profile = await this.content.updatePrimaryProfile(slug, { avatarUrl: uploaded.publicUrl });
    return {
      profile,
      publicUrl: uploaded.publicUrl,
    };
  }

  @Patch('theme-background')
  updateThemeBackground(@Param('slug') slug: string, @Body() body: { backgroundUrl: string }) {
    return this.content.updateThemeBackground(slug, body.backgroundUrl);
  }

  @Patch('anniversary-page')
  updateAnniversaryPage(
    @Param('slug') slug: string,
    @Body()
    body: {
      startDate?: string;
      startTitle?: string;
      firstMeetDate?: string;
      showCountdown?: boolean;
    },
  ) {
    return this.content.updateAnniversaryPageSettings(slug, body);
  }

  @Patch('settings')
  updateSettings(
    @Param('slug') slug: string,
    @Body()
    body: {
      profile?: Partial<Profile>;
      settings?: Partial<HomeSettings>;
      theme?: Partial<ThemeConfig>;
    },
  ) {
    return this.content.saveCoupleSettings(slug, body);
  }

  @Post('ai/chat')
  chatWithAi(
    @Param('slug') slug: string,
    @Body() body: { conversationId?: string; message: string },
  ) {
    return this.ai.chat(slug, body);
  }

  @Post('ai/brief')
  getAiBrief(@Param('slug') slug: string) {
    return this.ai.getBrief(slug);
  }

  @Post('ai/actions/:id/confirm')
  confirmAiAction(@Param('slug') slug: string, @Param('id') id: string) {
    return this.ai.confirmAction(slug, id);
  }

  @Post('ai/actions/:id/reject')
  rejectAiAction(@Param('slug') slug: string, @Param('id') id: string) {
    return this.ai.rejectAction(slug, id);
  }

  @Post('ai/rebuild-knowledge')
  rebuildAiKnowledge(@Param('slug') slug: string) {
    return this.ai.rebuildKnowledge(slug);
  }
}
