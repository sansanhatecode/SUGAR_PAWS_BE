import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';
import type { Express } from 'express';
import { ApiResponse } from 'src/common/response.types';

@Controller('cloudinary')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ApiResponse<{ url: string }>> {
    if (!file) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'No file uploaded',
      };
    }
    const url = await this.cloudinaryService.uploadImage(file);
    return {
      statusCode: HttpStatus.OK,
      message: 'Image uploaded successfully',
      data: {
        url,
      },
    };
  }

  @Post('upload-multiple')
  @UseInterceptors(FilesInterceptor('images', 10)) // Maximum 10 files
  async uploadMultipleImages(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<ApiResponse<{ urls: string[] }>> {
    if (!files || files.length === 0) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'No files uploaded',
      };
    }

    try {
      const uploadPromises = files.map((file) =>
        this.cloudinaryService.uploadImage(file),
      );
      const urls = await Promise.all(uploadPromises);

      return {
        statusCode: HttpStatus.CREATED,
        message: `${urls.length} images uploaded successfully`,
        data: {
          urls,
        },
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to upload images',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
