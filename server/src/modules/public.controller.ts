import { Controller, Get, Header, Param } from '@nestjs/common';
import { ContentService } from './content.service';
import { AiAssistantService } from './ai-assistant.service';

@Controller('public/spaces/:slug')
export class PublicController {
  constructor(
    private readonly content: ContentService,
    private readonly ai: AiAssistantService,
  ) {}

  @Get('bootstrap')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  getBootstrap(@Param('slug') slug: string) {
    return this.content.getBootstrap(slug);
  }

  @Get('anniversaries')
  getAnniversaries(@Param('slug') slug: string) {
    return this.content.listAnniversaries(slug);
  }

  @Get('albums/items')
  getAlbumItems(@Param('slug') slug: string) {
    return this.content.listAlbumItems(slug);
  }

  @Get('letters')
  getLetters(@Param('slug') slug: string) {
    return this.content.listLetters(slug);
  }

  @Get('music/songs')
  getSongs(@Param('slug') slug: string) {
    return this.content.listSongs(slug);
  }

  @Get('ai/config')
  getAiConfig(@Param('slug') slug: string) {
    return this.ai.getPublicConfig(slug);
  }
}
