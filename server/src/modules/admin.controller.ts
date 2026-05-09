import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ContentService } from './content.service';
import { StorageService, type UploadPathOptions } from './storage.service';
import { AdminAuthGuard } from './admin-auth.guard';
import { AuthService } from './auth.service';
import { AiAssistantService } from './ai-assistant.service';
import { Anniversary, LoveLetter, Profile, Song, SpaceData, ThemeConfig } from './types';

@Controller('admin/spaces/:slug')
@UseGuards(AdminAuthGuard)
export class AdminController {
  constructor(
    private readonly content: ContentService,
    private readonly storage: StorageService,
    private readonly auth: AuthService,
    private readonly ai: AiAssistantService,
  ) {}

  @Get('dashboard')
  getDashboard(@Param('slug') slug: string) {
    return this.content.getBootstrap(slug);
  }

  @Patch('site-config')
  updateSite(@Param('slug') slug: string, @Body() body: Partial<SpaceData['site']>) {
    return this.content.updateSite(slug, body);
  }

  @Get('couple-access')
  getCoupleAccess(@Param('slug') slug: string) {
    return this.auth.getCoupleAccess(slug);
  }

  @Patch('couple-access')
  updateCoupleAccess(@Param('slug') slug: string, @Body() body: { name?: string; password?: string }) {
    return this.auth.updateCoupleAccess(slug, body);
  }

  @Patch('theme-config')
  updateTheme(@Param('slug') slug: string, @Body() body: Partial<ThemeConfig>) {
    return this.content.updateTheme(slug, body);
  }

  @Patch('profiles')
  updateProfiles(@Param('slug') slug: string, @Body() body: { profiles: Profile[] }) {
    return this.content.updateProfiles(slug, body.profiles);
  }

  @Get('anniversaries')
  listAnniversaries(@Param('slug') slug: string) {
    return this.content.listAnniversaries(slug);
  }

  @Post('anniversaries')
  saveAnniversary(@Param('slug') slug: string, @Body() body: Partial<Anniversary> & Pick<Anniversary, 'title' | 'eventDate'>) {
    return this.content.upsertAnniversary(slug, body);
  }

  @Delete('anniversaries/:id')
  deleteAnniversary(@Param('slug') slug: string, @Param('id') id: string) {
    return this.content.deleteAnniversary(slug, id);
  }

  @Get('albums/items')
  listAlbumItems(@Param('slug') slug: string) {
    return this.content.listAlbumItems(slug);
  }

  @Delete('albums/items/:id')
  deleteAlbumItem(@Param('slug') slug: string, @Param('id') id: string) {
    return this.content.deleteAlbumItem(slug, id);
  }

  @Patch('albums/items/:id')
  updateAlbumItem(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      albumTitle?: string;
      location?: string;
      takenAt?: string;
      tags?: string[];
      favorite?: boolean;
      visibility?: 'PUBLIC' | 'PRIVATE';
    },
  ) {
    return this.content.updateAlbumItem(slug, id, body);
  }

  @Get('letters')
  listLetters(@Param('slug') slug: string) {
    return this.content.listLetters(slug);
  }

  @Post('letters')
  saveLetter(@Param('slug') slug: string, @Body() body: Partial<LoveLetter> & Pick<LoveLetter, 'title' | 'body'>) {
    return this.content.upsertLetter(slug, body);
  }

  @Delete('letters/:id')
  deleteLetter(@Param('slug') slug: string, @Param('id') id: string) {
    return this.content.deleteLetter(slug, id);
  }

  @Get('music/songs')
  listSongs(@Param('slug') slug: string) {
    return this.content.listSongs(slug);
  }

  @Post('music/songs')
  saveSong(@Param('slug') slug: string, @Body() body: Partial<Song> & Pick<Song, 'title' | 'artist'>) {
    return this.content.upsertSong(slug, body);
  }

  @Delete('music/songs/:id')
  deleteSong(@Param('slug') slug: string, @Param('id') id: string) {
    return this.content.deleteSong(slug, id);
  }

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

  @Get('ai/config')
  getAiConfig(@Param('slug') slug: string) {
    return this.ai.getAdminConfig(slug);
  }

  @Patch('ai/config')
  saveAiConfig(@Param('slug') slug: string, @Body() body: {
    enabled?: boolean;
    provider?: string;
    baseUrl?: string;
    model?: string;
    apiKey?: string;
    assistantName?: string;
    openingMessage?: string;
    personality?: string;
    memoryEnabled?: boolean;
    actionEnabled?: boolean;
    allowCreateAnniversary?: boolean;
    allowCreateImportantMoment?: boolean;
    allowCreatePromise?: boolean;
    allowDraftLetter?: boolean;
    allowUpdateReminders?: boolean;
    dailyMessageLimit?: number;
    systemPromptOverride?: string;
  }) {
    return this.ai.saveAdminConfig(slug, body);
  }

  @Post('ai/test')
  testAiConfig(@Param('slug') slug: string) {
    return this.ai.testConfig(slug);
  }

  @Post('ai/rebuild-knowledge')
  rebuildAiKnowledge(@Param('slug') slug: string) {
    return this.ai.rebuildKnowledge(slug);
  }

  @Get('ai/knowledge')
  getAiKnowledge(@Param('slug') slug: string) {
    return this.ai.getKnowledge(slug);
  }

  @Get('ai/memories')
  listAiMemories(@Param('slug') slug: string) {
    return this.ai.listMemories(slug);
  }

  @Patch('ai/memories/:id')
  updateAiMemory(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Body() body: { content?: string; type?: string; confidence?: number },
  ) {
    return this.ai.updateMemory(slug, id, body);
  }

  @Delete('ai/memories/:id')
  deleteAiMemory(@Param('slug') slug: string, @Param('id') id: string) {
    return this.ai.deleteMemory(slug, id);
  }

  @Delete('ai/memories')
  clearAiMemories(@Param('slug') slug: string) {
    return this.ai.clearMemories(slug);
  }

  @Get('ai/actions')
  listAiActions(@Param('slug') slug: string) {
    return this.ai.listActions(slug);
  }
}
