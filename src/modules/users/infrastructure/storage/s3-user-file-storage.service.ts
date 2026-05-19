import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { FileStorage } from '../../../products/application/ports/file-storage.port';
import { AppLogger } from '../../../../common/logger/logger.service';

@Injectable()
export class S3UserFileStorageService implements FileStorage {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly region: string;
  private readonly usersPrefix: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLogger,
  ) {
    this.bucket = this.configService.getOrThrow<string>('aws.bucket');
    this.region = this.configService.getOrThrow<string>('aws.region');
    this.usersPrefix = this.configService.get<string>('aws.usersPrefix') || 'users';

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('aws.accessKeyId'),
        secretAccessKey: this.configService.getOrThrow<string>('aws.secretAccessKey'),
      },
    });
  }

  async save(file?: Express.Multer.File): Promise<string | undefined> {
    if (!file) {
      return undefined;
    }

    const fileExtension = extname(file.originalname || '').toLowerCase();
    const objectKey = `${this.usersPrefix}/${randomUUID()}${fileExtension}`;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: objectKey,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${objectKey}`;
    } catch (error) {
      this.logger.error(S3UserFileStorageService.name, 'S3 upload failed', error);
      throw new InternalServerErrorException('Failed to upload image to S3');
    }
  }
}
