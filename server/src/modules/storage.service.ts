import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CopyObjectCommand, DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export type UploadPurpose =
  | 'avatar'
  | 'background'
  | 'about'
  | 'login'
  | 'page-header'
  | 'album'
  | 'video-poster'
  | 'music-audio'
  | 'music-cover'
  | 'music-playlist-cover'
  | 'heart-garden-cover'
  | 'heart-garden-html'
  | 'misc';

export type UploadPathOptions = {
  purpose?: UploadPurpose | string;
  folder?: string;
  group?: string;
};

@Injectable()
export class StorageService {
  constructor(private readonly config: ConfigService) {}

  async createUploadUrl(spaceSlug: string, fileName: string, mimeType: string, options: UploadPathOptions = {}) {
    const { bucket, client } = this.getStorageClient();
    const safeName = String(fileName || `upload-${Date.now()}`).replace(/[^a-zA-Z0-9._-]/g, '-');
    const objectKey = `${this.resolveFolder(spaceSlug, mimeType, options)}/${Date.now()}-${safeName}`;
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      ContentType: mimeType,
    });

    let uploadUrl: string;
    try {
      uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 });
    } catch (error) {
      console.error('Failed to create object storage upload URL.', error);
      throw new ServiceUnavailableException('Object storage upload URL failed');
    }
    return {
      objectKey,
      uploadUrl,
      publicUrl: this.getPublicUrl(objectKey),
      expiresIn: 300,
    };
  }

  async moveObjectToUploadFolder(sourceKey: string, mimeType: string, spaceSlug: string, options: UploadPathOptions = {}) {
    const safeSourceKey = String(sourceKey || '').trim();
    if (!safeSourceKey) return null;
    const fileName = safeSourceKey.split('/').filter(Boolean).pop() || `upload-${Date.now()}`;
    const targetKey = `${this.resolveFolder(spaceSlug, mimeType, options)}/${fileName}`;
    return this.moveObject(safeSourceKey, targetKey);
  }

  async moveObject(sourceKey: string, targetKey: string) {
    const safeSourceKey = String(sourceKey || '').trim();
    const safeTargetKey = String(targetKey || '').trim();
    if (!safeSourceKey || !safeTargetKey || safeSourceKey === safeTargetKey) {
      return safeSourceKey ? { objectKey: safeSourceKey, publicUrl: this.getPublicUrl(safeSourceKey) } : null;
    }
    const { bucket, client } = this.getStorageClient();
    try {
      await client.send(new CopyObjectCommand({
        Bucket: bucket,
        Key: safeTargetKey,
        CopySource: `${bucket}/${safeSourceKey.split('/').map(encodeURIComponent).join('/')}`,
      }));
      await client.send(new DeleteObjectCommand({
        Bucket: bucket,
        Key: safeSourceKey,
      }));
      return {
        objectKey: safeTargetKey,
        publicUrl: this.getPublicUrl(safeTargetKey),
      };
    } catch (error) {
      console.error('Failed to move object storage file.', { sourceKey: safeSourceKey, targetKey: safeTargetKey, error });
      return null;
    }
  }

  objectKeyFromPublicUrl(url: string | null | undefined) {
    const text = String(url || '').trim();
    if (!text) return '';
    const publicBaseUrl = this.cleanEnv('S3_PUBLIC_BASE_URL').replace(/\/$/, '');
    if (!publicBaseUrl || !text.startsWith(`${publicBaseUrl}/`)) return '';
    const rawKey = text.slice(publicBaseUrl.length + 1);
    return rawKey.split('/').map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    }).join('/');
  }

  getPublicUrl(objectKey: string) {
    const normalizedPublicBaseUrl = this.cleanEnv('S3_PUBLIC_BASE_URL').replace(/\/$/, '');
    return `${normalizedPublicBaseUrl}/${String(objectKey || '').split('/').map(encodeURIComponent).join('/')}`;
  }

  resolveFolder(spaceSlug: string, mimeType: string, options: UploadPathOptions = {}) {
    const slug = this.cleanSegment(spaceSlug, 'default');
    const folder = this.cleanSegment(options.folder, '默认');
    const group = this.cleanSegment(options.group, folder);
    const purpose = String(options.purpose || '').trim();
    const type = String(mimeType || '').toLowerCase();

    switch (purpose) {
      case 'avatar':
        return `${slug}/images/avatars`;
      case 'background':
        return `${slug}/images/backgrounds`;
      case 'about':
        return `${slug}/images/about`;
      case 'login':
        return `${slug}/images/login`;
      case 'page-header':
        return `${slug}/images/page-headers/${group}`;
      case 'album':
        return type.startsWith('video/') ? `${slug}/videos/album/${folder}` : `${slug}/images/album/${folder}`;
      case 'video-poster':
        return `${slug}/videos/posters/${folder}`;
      case 'music-audio':
        return `${slug}/music/songs/${folder}`;
      case 'music-cover':
        return `${slug}/music/covers/${folder}`;
      case 'music-playlist-cover':
        return `${slug}/music/playlists/${folder}`;
      case 'heart-garden-cover':
        return `${slug}/heart-garden/covers/${group}`;
      case 'heart-garden-html':
        return `${slug}/heart-garden/html/${group}`;
      default:
        if (type.startsWith('video/')) return `${slug}/videos/misc`;
        if (type.startsWith('audio/')) return `${slug}/music/misc`;
        if (type.startsWith('image/')) return `${slug}/images/misc`;
        return `${slug}/files/misc`;
    }
  }

  private cleanEnv(key: string) {
    return String(this.config.get<string>(key) || '').trim();
  }

  private getStorageClient() {
    const bucket = this.cleanEnv('S3_BUCKET');
    const endpoint = this.cleanEnv('S3_ENDPOINT');
    const accessKeyId = this.cleanEnv('S3_ACCESS_KEY_ID');
    const secretAccessKey = this.cleanEnv('S3_SECRET_ACCESS_KEY');
    const publicBaseUrl = this.cleanEnv('S3_PUBLIC_BASE_URL');
    if (!bucket || !endpoint || !accessKeyId || !secretAccessKey || !publicBaseUrl) {
      throw new ServiceUnavailableException('Object storage is not configured');
    }
    const client = new S3Client({
      region: this.cleanEnv('S3_REGION') || 'auto',
      endpoint: this.normalizeEndpoint(endpoint),
      forcePathStyle: true,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    return { bucket, client };
  }

  private cleanSegment(value: string | null | undefined, fallback: string) {
    const text = String(value || '').trim()
      .replace(/[\\/]+/g, '-')
      .replace(/[\x00-\x1f\x7f?#%:*|"<>]/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80);
    return text || fallback;
  }

  private normalizeEndpoint(endpoint: string) {
    try {
      const url = new URL(endpoint);
      return url.origin;
    } catch (error) {
      console.error('Invalid object storage endpoint.', { endpoint });
      throw new ServiceUnavailableException('Object storage endpoint is invalid');
    }
  }
}
