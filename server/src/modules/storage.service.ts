import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  constructor(private readonly config: ConfigService) {}

  async createUploadUrl(spaceSlug: string, fileName: string, mimeType: string) {
    const bucket = this.cleanEnv('S3_BUCKET');
    const endpoint = this.cleanEnv('S3_ENDPOINT');
    const accessKeyId = this.cleanEnv('S3_ACCESS_KEY_ID');
    const secretAccessKey = this.cleanEnv('S3_SECRET_ACCESS_KEY');
    const publicBaseUrl = this.cleanEnv('S3_PUBLIC_BASE_URL');
    if (!bucket || !endpoint || !accessKeyId || !secretAccessKey || !publicBaseUrl) {
      throw new ServiceUnavailableException('Object storage is not configured');
    }

    const normalizedEndpoint = this.normalizeEndpoint(endpoint);
    const client = new S3Client({
      region: this.cleanEnv('S3_REGION') || 'auto',
      endpoint: normalizedEndpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const safeName = String(fileName || `upload-${Date.now()}`).replace(/[^a-zA-Z0-9._-]/g, '-');
    const objectKey = `${spaceSlug}/${Date.now()}-${safeName}`;
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
    const normalizedPublicBaseUrl = publicBaseUrl.replace(/\/$/, '');
    return {
      objectKey,
      uploadUrl,
      publicUrl: `${normalizedPublicBaseUrl}/${objectKey}`,
      expiresIn: 300,
    };
  }

  private cleanEnv(key: string) {
    return String(this.config.get<string>(key) || '').trim();
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
