import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly client: S3Client;

  constructor(private readonly config: ConfigService) {
    this.client = new S3Client({
      region: this.config.get<string>('S3_REGION') ?? 'us-east-1',
      endpoint: this.config.get<string>('S3_ENDPOINT'),
      forcePathStyle: true,
      credentials: {
        accessKeyId: this.config.get<string>('S3_ACCESS_KEY_ID') ?? '',
        secretAccessKey: this.config.get<string>('S3_SECRET_ACCESS_KEY') ?? '',
      },
    });
  }

  async createUploadUrl(spaceSlug: string, fileName: string, mimeType: string) {
    const bucket = this.config.get<string>('S3_BUCKET') ?? 'love1';
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
    const objectKey = `${spaceSlug}/${Date.now()}-${safeName}`;
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: 300 });
    const publicBaseUrl = this.config.get<string>('S3_PUBLIC_BASE_URL') ?? '';
    return {
      objectKey,
      uploadUrl,
      publicUrl: publicBaseUrl ? `${publicBaseUrl}/${objectKey}` : objectKey,
      expiresIn: 300,
    };
  }
}
