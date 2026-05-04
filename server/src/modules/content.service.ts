import { Injectable, NotFoundException } from '@nestjs/common';
import { MediaType, Prisma, PublishStatus, Visibility } from '@prisma/client';
import { Anniversary, HeartGardenProject, HomeSettings, LoveLetter, Profile, Song, SpaceData, ThemeConfig } from './types';
import { PrismaService } from './prisma.service';
import { StorageService } from './storage.service';

@Injectable()
export class ContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async getBootstrap(slug: string) {
    const space = await this.getSpace(slug);
    const [albumItems, counts] = await Promise.all([
      this.listAlbumItems(slug),
      this.getCounts(space.id),
    ]);

    const anniversaries = space.anniversaries.map((item) => this.mapAnniversary(item));
    const result: SpaceData & {
      nextAnniversary: ReturnType<ContentService['getNextAnniversary']>;
      counts: Awaited<ReturnType<ContentService['getCounts']>>;
    } = {
      slug: space.slug,
      name: space.name,
      subtitle: space.subtitle ?? '',
      profiles: space.profiles.map((item) => ({
        id: item.id,
        name: item.name,
        nickname: item.nickname ?? '',
        avatarUrl: item.avatarUrl ?? '',
        bio: item.bio ?? '',
      })),
      site: {
        heroTitle: space.siteConfig?.heroTitle ?? space.name,
        heroText: space.siteConfig?.heroText ?? '',
        story: space.siteConfig?.story ?? '',
        stats: this.asStats(space.siteConfig?.stats),
        settings: this.asHomeSettings(space.siteConfig?.settings),
      },
      theme: {
        primaryColor: space.themeConfig?.primaryColor ?? '#e8748a',
        accentColor: space.themeConfig?.accentColor ?? '#d4956a',
        backgroundUrl: space.themeConfig?.backgroundUrl ?? '',
        effects: this.asEffects(space.themeConfig?.effects),
      },
      anniversaries,
      albumItems,
      letters: space.loveLetters.map((item) => ({
        id: item.id,
        title: item.title,
        body: item.body,
        signature: item.signature ?? '',
        letterDate: item.letterDate ? this.formatDate(item.letterDate) : '',
        status: item.status,
      })),
      songs: space.songs.map((item) => ({
        id: item.id,
        title: item.title,
        artist: item.artist,
        duration: item.duration,
        coverUrl: item.coverUrl ?? '',
        audioUrl: item.audioUrl ?? '',
        lyric: item.lyric ?? '',
        favorite: item.favorite,
      })),
      nextAnniversary: this.getNextAnniversary(anniversaries),
      counts,
    };

    return result;
  }

  async updateSite(slug: string, site: Partial<SpaceData['site']>) {
    const space = await this.getSpaceRef(slug);
    const current = await this.prisma.siteConfig.findUnique({ where: { spaceId: space.id } });
    const saved = await this.prisma.siteConfig.upsert({
      where: { spaceId: space.id },
      create: {
        spaceId: space.id,
        heroTitle: site.heroTitle ?? space.name,
        heroText: site.heroText ?? '',
        story: site.story ?? '',
        stats: site.stats ?? [],
        settings: site.settings ?? this.asHomeSettings(undefined),
      },
      update: {
        heroTitle: site.heroTitle ?? current?.heroTitle ?? space.name,
        heroText: site.heroText ?? current?.heroText ?? '',
        story: site.story ?? current?.story ?? '',
        stats: site.stats ?? current?.stats ?? [],
        settings: site.settings ?? current?.settings ?? this.asHomeSettings(undefined),
      },
    });

    return {
      heroTitle: saved.heroTitle,
      heroText: saved.heroText,
      story: saved.story,
      stats: this.asStats(saved.stats),
      settings: this.asHomeSettings(saved.settings),
    };
  }

  async updateTheme(slug: string, theme: Partial<ThemeConfig>) {
    const space = await this.getSpaceRef(slug);
    const current = await this.prisma.themeConfig.findUnique({ where: { spaceId: space.id } });
    const currentEffects = this.asEffects(current?.effects);
    const saved = await this.prisma.themeConfig.upsert({
      where: { spaceId: space.id },
      create: {
        spaceId: space.id,
        primaryColor: theme.primaryColor ?? '#e8748a',
        accentColor: theme.accentColor ?? '#d4956a',
        backgroundUrl: theme.backgroundUrl ?? '',
        effects: { ...currentEffects, ...(theme.effects ?? {}) },
      },
      update: {
        primaryColor: theme.primaryColor ?? current?.primaryColor ?? '#e8748a',
        accentColor: theme.accentColor ?? current?.accentColor ?? '#d4956a',
        backgroundUrl: theme.backgroundUrl ?? current?.backgroundUrl ?? '',
        effects: { ...currentEffects, ...(theme.effects ?? {}) },
      },
    });

    return {
      primaryColor: saved.primaryColor,
      accentColor: saved.accentColor,
      backgroundUrl: saved.backgroundUrl ?? '',
      effects: this.asEffects(saved.effects),
    };
  }

  async updateProfiles(slug: string, profiles: Profile[]) {
    const space = await this.getSpaceRef(slug);
    await this.prisma.$transaction([
      this.prisma.profile.deleteMany({ where: { spaceId: space.id } }),
      this.prisma.profile.createMany({
        data: profiles.map((item, index) => ({
          id: item.id || undefined,
          spaceId: space.id,
          name: item.name,
          nickname: item.nickname,
          avatarUrl: item.avatarUrl,
          bio: item.bio,
          sortOrder: index,
        })),
      }),
    ]);

    return this.prisma.profile.findMany({
      where: { spaceId: space.id },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async updatePrimaryAvatar(slug: string, avatarUrl: string) {
    const space = await this.getSpaceRef(slug);
    const current = await this.prisma.profile.findFirst({
      where: { spaceId: space.id },
      orderBy: { sortOrder: 'asc' },
    });

    if (current) {
      return this.prisma.profile.update({
        where: { id: current.id },
        data: { avatarUrl },
      });
    }

    return this.prisma.profile.create({
      data: {
        id: 'profile-couple',
        spaceId: space.id,
        name: space.name,
        nickname: '',
        avatarUrl,
        bio: '',
        sortOrder: 0,
      },
    });
  }

  async updateThemeBackground(slug: string, backgroundUrl: string) {
    const space = await this.getSpaceRef(slug);
    const currentTheme = await this.prisma.themeConfig.findUnique({ where: { spaceId: space.id } });
    const currentSite = await this.prisma.siteConfig.findUnique({ where: { spaceId: space.id } });
    const settings = {
      ...this.asHomeSettings(currentSite?.settings),
      themeCustomBackgroundUrl: backgroundUrl,
    };

    const theme = await this.prisma.themeConfig.upsert({
      where: { spaceId: space.id },
      create: {
        spaceId: space.id,
        primaryColor: '#e8748a',
        accentColor: '#d4956a',
        backgroundUrl,
        effects: this.asEffects(undefined),
      },
      update: {
        backgroundUrl,
      },
    });

    await this.prisma.siteConfig.upsert({
      where: { spaceId: space.id },
      create: {
        spaceId: space.id,
        heroTitle: space.name,
        heroText: '',
        story: '',
        stats: [],
        settings,
      },
      update: {
        settings,
      },
    });

    return {
      backgroundUrl: theme.backgroundUrl ?? currentTheme?.backgroundUrl ?? backgroundUrl,
      settings,
    };
  }

  async updateAnniversaryPageSettings(
    slug: string,
    anniversaryPage: Partial<HomeSettings['anniversaryPage']>,
  ) {
    const space = await this.getSpaceRef(slug);
    const currentSite = await this.prisma.siteConfig.findUnique({ where: { spaceId: space.id } });
    const currentSettings = this.asHomeSettings(currentSite?.settings);
    const settings = {
      ...currentSettings,
      anniversaryPage: {
        ...currentSettings.anniversaryPage,
        ...anniversaryPage,
        dailyQuotes: Array.isArray(anniversaryPage.dailyQuotes)
          ? anniversaryPage.dailyQuotes
          : currentSettings.anniversaryPage.dailyQuotes,
      },
    };

    await this.prisma.siteConfig.upsert({
      where: { spaceId: space.id },
      create: {
        spaceId: space.id,
        heroTitle: space.name,
        heroText: '',
        story: '',
        stats: [],
        settings,
      },
      update: {
        settings,
      },
    });

    return {
      anniversaryPage: settings.anniversaryPage,
      settings,
    };
  }

  async listAnniversaries(slug: string) {
    const space = await this.getSpaceRef(slug);
    const items = await this.prisma.anniversary.findMany({
      where: { spaceId: space.id },
      orderBy: [{ sortOrder: 'asc' }, { eventDate: 'asc' }],
    });
    return items.map((item) => this.mapAnniversary(item));
  }

  async upsertAnniversary(slug: string, item: Partial<Anniversary> & Pick<Anniversary, 'title' | 'eventDate'>) {
    const space = await this.getSpaceRef(slug);
    const data = {
      title: item.title,
      eventDate: this.parseDate(item.eventDate),
      type: item.type ?? 'custom',
      repeatYearly: item.repeatYearly ?? true,
      showCountdown: item.showCountdown ?? false,
      description: item.description ?? '',
    };

    const saved = item.id
      ? await this.prisma.anniversary.update({
          where: { id: item.id },
          data,
        })
      : await this.prisma.anniversary.create({
          data: {
            ...data,
            spaceId: space.id,
          },
        });

    return this.mapAnniversary(saved);
  }

  async deleteAnniversary(slug: string, id: string) {
    const space = await this.getSpaceRef(slug);
    const item = await this.prisma.anniversary.findFirst({
      where: {
        id,
        spaceId: space.id,
      },
      select: { id: true },
    });
    if (!item) {
      throw new NotFoundException(`Anniversary ${id} was not found`);
    }
    await this.prisma.anniversary.delete({ where: { id } });
    return { success: true };
  }

  async listAlbumItems(slug: string) {
    const space = await this.getSpaceRef(slug);
    const items = await this.prisma.albumItem.findMany({
      where: {
        album: {
          spaceId: space.id,
        },
      },
      include: {
        album: true,
        media: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { takenAt: 'desc' }],
    });

    return items.map((item) => ({
      id: item.id,
      title: item.title,
      album: item.album.title,
      mediaType: item.media.type,
      url: item.media.url,
      thumbnailUrl: item.media.thumbnailUrl ?? item.media.url,
      takenAt: item.takenAt ? this.formatDate(item.takenAt) : '',
      location: item.location ?? '',
      tags: this.asStringArray(item.tags),
      favorite: item.favorite,
      visibility: item.visibility,
    }));
  }

  async completeMediaUpload(
    slug: string,
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
    const space = await this.getSpaceRef(slug);
    const albumTitle = body.albumTitle || '默认相册';
    const album = await this.prisma.album.upsert({
      where: { id: `album-${space.id}-${albumTitle}` },
      create: {
        id: `album-${space.id}-${albumTitle}`,
        spaceId: space.id,
        title: albumTitle,
        description: '',
        coverUrl: body.url,
      },
      update: {
        coverUrl: body.url,
      },
    });

    const media = await this.prisma.mediaAsset.create({
      data: {
        spaceId: space.id,
        type: this.getMediaType(body.mimeType),
        objectKey: body.objectKey,
        url: body.url,
        thumbnailUrl: body.thumbnailUrl ?? body.url,
        mimeType: body.mimeType,
        size: body.size,
      },
    });

    const item = await this.prisma.albumItem.create({
      data: {
        albumId: album.id,
        mediaId: media.id,
        title: body.title || '新的回忆',
        description: '',
        takenAt: body.takenAt ? this.parseDate(body.takenAt) : new Date(),
        location: body.location ?? '',
        tags: body.tags ?? [],
        favorite: false,
        visibility: body.visibility === 'PRIVATE' ? Visibility.PRIVATE : Visibility.PUBLIC,
      },
      include: {
        album: true,
        media: true,
      },
    });

    return {
      id: item.id,
      title: item.title,
      album: item.album.title,
      mediaType: item.media.type,
      url: item.media.url,
      thumbnailUrl: item.media.thumbnailUrl ?? item.media.url,
      takenAt: item.takenAt ? this.formatDate(item.takenAt) : '',
      location: item.location ?? '',
      tags: this.asStringArray(item.tags),
      favorite: item.favorite,
      visibility: item.visibility,
    };
  }

  async deleteAlbumItem(slug: string, id: string) {
    const space = await this.getSpaceRef(slug);
    const item = await this.prisma.albumItem.findFirst({
      where: {
        id,
        album: { spaceId: space.id },
      },
      select: { id: true },
    });
    if (!item) {
      throw new NotFoundException(`Album item ${id} was not found`);
    }
    await this.prisma.albumItem.delete({ where: { id } });
    return { success: true };
  }

  async updateAlbumItem(
    slug: string,
    id: string,
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
    const space = await this.getSpaceRef(slug);
    const current = await this.prisma.albumItem.findFirst({
      where: { id, album: { spaceId: space.id } },
      include: { album: true, media: true },
    });
    if (!current) {
      throw new NotFoundException(`Album item ${id} was not found`);
    }
    const albumTitle = body.albumTitle || current.album.title;
    let mediaUrl = current.media.url;
    let thumbnailUrl = current.media.thumbnailUrl ?? current.media.url;
    let mediaObjectKey = current.media.objectKey;

    if (albumTitle !== current.album.title) {
      try {
        const movedMedia = await this.storage.moveObjectToUploadFolder(current.media.objectKey, current.media.mimeType, slug, {
          purpose: 'album',
          folder: albumTitle,
        });
        if (movedMedia) {
          mediaObjectKey = movedMedia.objectKey;
          mediaUrl = movedMedia.publicUrl;
          if (!current.media.thumbnailUrl || current.media.thumbnailUrl === current.media.url) {
            thumbnailUrl = movedMedia.publicUrl;
          }
        }

        const thumbnailKey = this.storage.objectKeyFromPublicUrl(current.media.thumbnailUrl);
        if (thumbnailKey && thumbnailKey !== current.media.objectKey) {
          const movedThumbnail = await this.storage.moveObjectToUploadFolder(thumbnailKey, 'image/jpeg', slug, {
            purpose: 'video-poster',
            folder: albumTitle,
          });
          if (movedThumbnail) thumbnailUrl = movedThumbnail.publicUrl;
        }

        if (mediaObjectKey !== current.media.objectKey || mediaUrl !== current.media.url || thumbnailUrl !== (current.media.thumbnailUrl ?? current.media.url)) {
          await this.prisma.mediaAsset.update({
            where: { id: current.media.id },
            data: {
              objectKey: mediaObjectKey,
              url: mediaUrl,
              thumbnailUrl,
            },
          });
        }
      } catch (error) {
        console.error('Failed to reorganize album media object.', { albumItemId: id, albumTitle, error });
      }
    }

    const album = await this.prisma.album.upsert({
      where: { id: `album-${space.id}-${albumTitle}` },
      create: {
        id: `album-${space.id}-${albumTitle}`,
        spaceId: space.id,
        title: albumTitle,
        description: '',
        coverUrl: thumbnailUrl,
      },
      update: {
        coverUrl: thumbnailUrl,
      },
    });
    const item = await this.prisma.albumItem.update({
      where: { id },
      data: {
        albumId: album.id,
        title: body.title ?? current.title,
        location: body.location ?? current.location,
        takenAt: body.takenAt ? this.parseDate(body.takenAt) : current.takenAt,
        tags: body.tags ?? this.asStringArray(current.tags),
        favorite: body.favorite ?? current.favorite,
        visibility: body.visibility === 'PRIVATE' ? Visibility.PRIVATE : Visibility.PUBLIC,
      },
      include: { album: true, media: true },
    });
    return {
      id: item.id,
      title: item.title,
      album: item.album.title,
      mediaType: item.media.type,
      url: item.media.url,
      thumbnailUrl: item.media.thumbnailUrl ?? item.media.url,
      takenAt: item.takenAt ? this.formatDate(item.takenAt) : '',
      location: item.location ?? '',
      tags: this.asStringArray(item.tags),
      favorite: item.favorite,
      visibility: item.visibility,
    };
  }

  async listLetters(slug: string) {
    const space = await this.getSpaceRef(slug);
    const items = await this.prisma.loveLetter.findMany({
      where: { spaceId: space.id },
      orderBy: { sortOrder: 'asc' },
    });

    return items.map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      signature: item.signature ?? '',
      letterDate: item.letterDate ? this.formatDate(item.letterDate) : '',
      status: item.status,
    }));
  }

  async upsertLetter(slug: string, item: Partial<LoveLetter> & Pick<LoveLetter, 'title' | 'body'>) {
    const space = await this.getSpaceRef(slug);
    const data = {
      title: item.title,
      body: item.body,
      signature: item.signature ?? '',
      letterDate: item.letterDate ? this.parseDate(item.letterDate) : null,
      status: (item.status ?? 'PUBLISHED') as PublishStatus,
    };
    const saved = item.id
      ? await this.updateOwnedLetter(space.id, item.id, data)
      : await this.prisma.loveLetter.create({
          data: {
            ...data,
            spaceId: space.id,
          },
        });

    return {
      id: saved.id,
      title: saved.title,
      body: saved.body,
      signature: saved.signature ?? '',
      letterDate: saved.letterDate ? this.formatDate(saved.letterDate) : '',
      status: saved.status,
    };
  }

  async deleteLetter(slug: string, id: string) {
    const space = await this.getSpaceRef(slug);
    const item = await this.prisma.loveLetter.findFirst({
      where: { id, spaceId: space.id },
      select: { id: true },
    });
    if (!item) {
      throw new NotFoundException(`Letter ${id} was not found`);
    }
    await this.prisma.loveLetter.delete({ where: { id } });
    return { success: true };
  }

  async listSongs(slug: string) {
    const space = await this.getSpaceRef(slug);
    const items = await this.prisma.song.findMany({
      where: { spaceId: space.id },
      orderBy: [{ favorite: 'desc' }, { title: 'asc' }],
    });

    return items.map((item) => ({
      id: item.id,
      title: item.title,
      artist: item.artist,
      duration: item.duration,
      coverUrl: item.coverUrl ?? '',
      audioUrl: item.audioUrl ?? '',
      lyric: item.lyric ?? '',
      favorite: item.favorite,
    }));
  }

  async upsertSong(slug: string, item: Partial<Song> & Pick<Song, 'title' | 'artist'>) {
    const space = await this.getSpaceRef(slug);
    const data = {
      title: item.title,
      artist: item.artist,
      duration: item.duration ?? 0,
      coverUrl: item.coverUrl ?? '',
      audioUrl: item.audioUrl ?? '',
      lyric: item.lyric ?? '',
      favorite: item.favorite ?? false,
    };
    const saved = item.id
      ? await this.updateOwnedSong(space.id, item.id, data)
      : await this.prisma.song.create({
          data: {
            ...data,
            spaceId: space.id,
          },
        });

    return {
      id: saved.id,
      title: saved.title,
      artist: saved.artist,
      duration: saved.duration,
      coverUrl: saved.coverUrl ?? '',
      audioUrl: saved.audioUrl ?? '',
      lyric: saved.lyric ?? '',
      favorite: saved.favorite,
    };
  }

  async deleteSong(slug: string, id: string) {
    const space = await this.getSpaceRef(slug);
    const item = await this.prisma.song.findFirst({
      where: { id, spaceId: space.id },
      select: { id: true },
    });
    if (!item) {
      throw new NotFoundException(`Song ${id} was not found`);
    }
    await this.prisma.song.delete({ where: { id } });
    return { success: true };
  }

  private async getSpace(slug: string) {
    const space = await this.prisma.coupleSpace.findUnique({
      where: { slug },
      include: {
        profiles: { orderBy: { sortOrder: 'asc' } },
        siteConfig: true,
        themeConfig: true,
        anniversaries: { orderBy: [{ sortOrder: 'asc' }, { eventDate: 'asc' }] },
        loveLetters: {
          where: { status: { not: PublishStatus.HIDDEN } },
          orderBy: { sortOrder: 'asc' },
        },
        songs: { orderBy: [{ favorite: 'desc' }, { title: 'asc' }] },
      },
    });
    if (!space) {
      throw new NotFoundException(`Space ${slug} was not found`);
    }
    return space;
  }

  private async getSpaceRef(slug: string) {
    const space = await this.prisma.coupleSpace.findUnique({
      where: { slug },
      select: { id: true, slug: true, name: true },
    });
    if (!space) {
      throw new NotFoundException(`Space ${slug} was not found`);
    }
    return space;
  }

  private async getCounts(spaceId: string) {
    const [anniversaries, photos, letters, songs] = await Promise.all([
      this.prisma.anniversary.count({ where: { spaceId } }),
      this.prisma.albumItem.count({ where: { album: { spaceId } } }),
      this.prisma.loveLetter.count({ where: { spaceId } }),
      this.prisma.song.count({ where: { spaceId } }),
    ]);

    return { anniversaries, photos, letters, songs };
  }

  private async updateOwnedLetter(
    spaceId: string,
    id: string,
    data: {
      title: string;
      body: string;
      signature: string;
      letterDate: Date | null;
      status: PublishStatus;
    },
  ) {
    const item = await this.prisma.loveLetter.findFirst({
      where: { id, spaceId },
      select: { id: true },
    });
    if (!item) {
      throw new NotFoundException(`Letter ${id} was not found`);
    }
    return this.prisma.loveLetter.update({ where: { id }, data });
  }

  private async updateOwnedSong(
    spaceId: string,
    id: string,
    data: {
      title: string;
      artist: string;
      duration: number;
      coverUrl: string;
      audioUrl: string;
      lyric: string;
      favorite: boolean;
    },
  ) {
    const item = await this.prisma.song.findFirst({
      where: { id, spaceId },
      select: { id: true },
    });
    if (!item) {
      throw new NotFoundException(`Song ${id} was not found`);
    }
    return this.prisma.song.update({ where: { id }, data });
  }

  private mapAnniversary(item: {
    id: string;
    title: string;
    eventDate: Date;
    type: string;
    repeatYearly: boolean;
    showCountdown: boolean;
    description: string | null;
  }): Anniversary {
    return {
      id: item.id,
      title: item.title,
      eventDate: this.formatDate(item.eventDate),
      type: item.type,
      repeatYearly: item.repeatYearly,
      showCountdown: item.showCountdown,
      description: item.description ?? '',
    };
  }

  private getNextAnniversary(anniversaries: Anniversary[]) {
    const now = new Date();
    const upcoming = anniversaries
      .filter((item) => item.repeatYearly || this.parseDate(item.eventDate) >= now)
      .map((item) => {
        const source = this.parseDate(item.eventDate);
        const next = item.repeatYearly
          ? new Date(now.getFullYear(), source.getMonth(), source.getDate())
          : source;
        if (next < now && item.repeatYearly) {
          next.setFullYear(next.getFullYear() + 1);
        }
        return {
          id: item.id,
          title: item.title,
          date: this.formatDate(next),
          secondsUntil: Math.max(0, Math.floor((next.getTime() - now.getTime()) / 1000)),
        };
      })
      .sort((a, b) => a.secondsUntil - b.secondsUntil);

    return upcoming[0] ?? null;
  }

  private parseDate(value: string) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private formatDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getMediaType(mimeType: string) {
    if (mimeType.startsWith('video/')) return MediaType.VIDEO;
    if (mimeType.startsWith('audio/')) return MediaType.AUDIO;
    return MediaType.IMAGE;
  }

  private asStats(value: Prisma.JsonValue | undefined) {
    if (Array.isArray(value)) {
      return value as Array<{ label: string; value: string }>;
    }
    return [];
  }

  private asStringArray(value: Prisma.JsonValue | undefined) {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === 'string');
  }

  private asHomeSettings(value: Prisma.JsonValue | undefined): HomeSettings {
    const defaults: HomeSettings = {
      pageHeaders: {
        home: {
          title: '遇见你，是我最美丽的意外',
          subtitle: '感谢命运让我们相遇，从此，你的名字就是我最温暖的诗篇。',
          imageUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=640&q=80',
        },
        anniversary: {
          title: '把每个日子，都写成我们的纪念',
          subtitle: '第一次见面、在一起、每个节日，都在这里被认真收藏。',
          imageUrl: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=640&q=80',
        },
        album: {
          title: '把心动瞬间，藏进时光相册',
          subtitle: '照片和视频都来自我们的真实回忆，按时间慢慢发光。',
          imageUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=640&q=80',
        },
        music: {
          title: '把喜欢的歌，放进我们的音乐盒',
          subtitle: '每一首歌都有一个场景，也有一个想起你的理由。',
          imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=640&q=80',
        },
        settings: {
          title: '把这份浪漫，调成我们喜欢的样子',
          subtitle: '主题、音乐、纪念日和相册，都可以在这里慢慢定制。',
          imageUrl: 'https://images.unsplash.com/photo-1517534573028-3db0dab0d31c?auto=format&fit=crop&w=640&q=80',
        },
      },
      heartIndex: {
        value: 98,
        labels: ['05-26', '06-02', '06-09', '06-16', '06-23'],
        values: [60, 50, 45, 35, 5],
        quote: '愿每一天都比昨天更爱你一点点',
      },
      aboutImageUrl: 'https://images.unsplash.com/photo-1529634597503-139d3726fed5?auto=format&fit=crop&w=600&q=70',
      aboutImageVisible: true,
      moments: [
        { id: 'moment-first-meet', title: '第一次见面', date: '2022-05-20' },
        { id: 'moment-confirm', title: '确认关系', date: '2022-06-18' },
        { id: 'moment-travel', title: '第一次旅行', date: '2022-10-03' },
        { id: 'moment-sunrise', title: '一起看日出', date: '2023-01-01' },
      ],
      promises: [
        { id: 'promise-travel', icon: '🌍', text: '一起去看遍世界的美景' },
        { id: 'promise-pet', icon: '🐱', text: '一起养一只可爱的猫咪' },
        { id: 'promise-dream', icon: '✅', text: '一起实现彼此的梦想' },
        { id: 'promise-forever', icon: '⭐', text: '一起慢慢变老，直到永远' },
      ],
      mailbox: {
        text: '谢谢你出现在我的生命里，你让我的世界变得完整而美好。每一个和你在一起的日子，都是我最珍贵的收藏。',
        author: '致我最爱的人',
      },
      music: {
        bgmSongId: '',
        volume: 70,
        autoplay: false,
        moodPlaylists: [
          {
            id: 'mood-rainy',
            title: '下雨天的想念',
            description: '雨声里藏着对你的想念',
            coverUrl: '',
            songIds: [],
          },
        ],
      },
      privacy: {
        passwordEnabled: false,
        password: '520',
        privateAlbum: false,
        shareLinkEnabled: false,
      },
      coupleEntrance: {
        mark: '♡',
        imageUrl: '',
        title: '情侣入口',
        subtitle: '输入只属于你们的暗号，进入这座温柔收藏的小世界。',
        nameLabel: '浪漫账号',
        namePlaceholder: 'love',
        passwordLabel: '秘密暗号',
        passwordPlaceholder: '输入你们的密码',
        submitText: '进入我们的世界',
      },
      reminders: {
        anniversaryEnabled: true,
        anniversaryDays: 1,
        surpriseEnabled: true,
        dailyQuoteEnabled: true,
        dailyQuoteTime: '20:00',
      },
      anniversaryPage: {
        startDate: '2022-05-20T00:00',
        startTitle: '我们的开始',
        firstMeetDate: '2024-08-14T00:00',
        showCountdown: true,
        dailyQuotes: [
          {
            id: 'quote-1',
            text: '最好的日子，不在于惊天动地，而在于有你在身边的每一天。',
            author: 'You & Me',
          },
          {
            id: 'quote-2',
            text: '把普通的今天过好，就是我们最长情的纪念。',
            author: 'You & Me',
          },
          {
            id: 'quote-3',
            text: '愿每一个被记住的日子，都能成为下一次拥抱的理由。',
            author: 'You & Me',
          },
        ],
        note: '谢谢你出现在我的生命里，让平凡的日子变得闪闪发光。\n未来的每一个纪念日，我都想和你一起走过。',
      },
      heartGarden: {
        projects: this.defaultHeartGardenProjects(),
      },
    };

    if (!value || Array.isArray(value) || typeof value !== 'object') {
      return defaults;
    }
    const source = value as Partial<HomeSettings>;
    return {
      ...defaults,
      ...source,
      pageHeaders: {
        ...defaults.pageHeaders,
        ...(source.pageHeaders ?? {}),
      },
      heartIndex: { ...defaults.heartIndex, ...(source.heartIndex ?? {}) },
      moments: Array.isArray(source.moments) ? source.moments : defaults.moments,
      promises: Array.isArray(source.promises) ? source.promises : defaults.promises,
      mailbox: { ...defaults.mailbox, ...(source.mailbox ?? {}) },
      music: {
        ...defaults.music,
        ...(source.music ?? {}),
        bgmSongId: source.music?.bgmSongId ?? defaults.music.bgmSongId,
        volume: Number.isFinite(source.music?.volume) ? Number(source.music?.volume) : defaults.music.volume,
        autoplay: source.music?.autoplay ?? defaults.music.autoplay,
        moodPlaylists: Array.isArray(source.music?.moodPlaylists)
          ? source.music.moodPlaylists
          : defaults.music.moodPlaylists,
      },
      privacy: { ...defaults.privacy, ...(source.privacy ?? {}) },
      coupleEntrance: { ...defaults.coupleEntrance, ...(source.coupleEntrance ?? {}) },
      reminders: { ...defaults.reminders, ...(source.reminders ?? {}) },
      anniversaryPage: {
        ...defaults.anniversaryPage,
        ...(source.anniversaryPage ?? {}),
        dailyQuotes: Array.isArray(source.anniversaryPage?.dailyQuotes)
          ? source.anniversaryPage.dailyQuotes
          : defaults.anniversaryPage.dailyQuotes,
      },
      heartGarden: {
        ...defaults.heartGarden,
        ...(source.heartGarden ?? {}),
        projects: Array.isArray(source.heartGarden?.projects)
          ? source.heartGarden.projects
              .filter((project) => project?.type === 'html')
              .map((project) => ({
                ...project,
                type: 'html' as const,
                group: ['particle', 'confession', 'custom'].includes(project.group) ? project.group : 'custom',
                status: project.url || project.content ? 'ready' : 'pending',
              }))
          : defaults.heartGarden.projects,
      },
    };
  }

  private defaultHeartGardenProjects(): HeartGardenProject[] {
    return [
      {
        id: 'blue-particle-heart',
        title: '蓝色粒子爱心',
        type: 'html',
        group: 'particle',
        tag: '粒子',
        icon: '💙',
        description: '蓝色粒子慢慢聚成爱心，像夜色里亮起的一句想你。',
        url: '/heart-garden/蓝色粒子爱心/蓝色粒子爱心1.html',
        cover: '',
        status: 'ready',
      },
      {
        id: 'love-tree',
        title: '爱心树',
        type: 'html',
        group: 'confession',
        tag: '告白',
        icon: '🌳',
        description: '一棵慢慢生长出来的爱心树，适合在纪念日安静打开。',
        url: '/heart-garden/爱心树/index.html',
        cover: '',
        status: 'ready',
      },
      {
        id: 'red-diamond-heart',
        title: '红色爱心变幻钻石',
        type: 'html',
        group: 'particle',
        tag: '3D',
        icon: '💎',
        description: '红色心形与钻石质感变幻，热烈一点，也闪耀一点。',
        url: '/heart-garden/lovered-红色爱心变幻钻石/index.html',
        cover: '',
        status: 'ready',
      },
      {
        id: 'photo-wall-3d',
        title: '3D 照片墙',
        type: 'html',
        group: 'confession',
        tag: '照片',
        icon: '🖼️',
        description: '把回忆排成环绕式照片墙，像走进只属于你们的小展厅。',
        url: '/heart-garden/3d照片墙/3d照片墙.html',
        cover: '',
        status: 'ready',
      },
      {
        id: 'meteor-love',
        title: '爱心流星雨',
        type: 'html',
        group: 'particle',
        tag: '背景',
        icon: '🌠',
        description: '夜色里落下爱心流星，适合做一场不声张的浪漫。',
        url: '/heart-garden/爱心流星雨背景_超好看/爱心流星雨背景_超好看/love.html',
        cover: '',
        status: 'ready',
      },
      {
        id: 'for-my-love',
        title: '送给最爱的你',
        type: 'html',
        group: 'confession',
        tag: '表白',
        icon: '💌',
        description: '完整的告白小页面，像把一封信藏进花园深处。',
        url: '/heart-garden/送给最爱的你.html',
        cover: '',
        status: 'ready',
      },
      {
        id: 'love-particle-single',
        title: '爱心粒子',
        type: 'html',
        group: 'particle',
        tag: '轻量',
        icon: '✨',
        description: '轻巧的粒子爱心页面，打开很快，适合当随机惊喜。',
        url: '/heart-garden/爱心粒子.html',
        cover: '',
        status: 'ready',
      },
    ];
  }

  private asEffects(value: Prisma.JsonValue | undefined): ThemeConfig['effects'] {
    const defaults = {
      particles: true,
      petals: true,
      glass: true,
      blur: 72,
      brightness: 68,
    };
    if (!value || Array.isArray(value) || typeof value !== 'object') {
      return defaults;
    }
    return { ...defaults, ...(value as Partial<ThemeConfig['effects']>) };
  }
}

