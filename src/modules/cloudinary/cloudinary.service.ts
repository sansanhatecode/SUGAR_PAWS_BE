import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import type { Express } from 'express';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  private hasBuffer(file: unknown): file is Express.Multer.File {
    return (
      typeof file === 'object' &&
      file !== null &&
      'buffer' in file &&
      Buffer.isBuffer((file as { buffer?: unknown }).buffer)
    );
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.hasBuffer(file)) {
        return reject(new Error('File buffer is missing'));
      }
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'sugar_paws' },
        (error, result: UploadApiResponse | undefined) => {
          if (error) {
            return reject(
              new Error(error.message || 'Cloudinary upload error'),
            );
          }
          if (!result) {
            return reject(new Error('No result returned from Cloudinary'));
          }
          resolve(result.secure_url);
        },
      );
      Readable.from(file.buffer).pipe(uploadStream);
    });
  }
}
