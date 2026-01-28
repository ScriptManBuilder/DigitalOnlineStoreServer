import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';

export interface FileUploadResult {
  url: string;
  filename: string;
}

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);
  private readonly storageType: string;

  constructor(private configService: ConfigService) {
    this.storageType = this.configService.get('STORAGE_TYPE', 'local');

    // Инициализация Cloudinary если настроен
    if (this.storageType === 'cloudinary') {
      cloudinary.config({
        cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
        api_key: this.configService.get('CLOUDINARY_API_KEY'),
        api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
      });
      this.logger.log('✅ Cloudinary configured');
    } else {
      this.logger.log('📁 Using local file storage');
    }
  }

  /**
   * Сохранить файл и получить URL
   */
  async uploadFile(file: Express.Multer.File, folder: string): Promise<FileUploadResult> {
    if (this.storageType === 'cloudinary') {
      return this.uploadToCloudinary(file, folder);
    }

    // Локальное хранение (разработка)
    return {
      url: `/uploads/${folder}/${file.filename}`,
      filename: file.filename,
    };
  }

  /**
   * Удалить файл по URL
   */
  async deleteFile(fileUrl: string | null): Promise<void> {
    if (!fileUrl) return;

    // Cloudinary
    if (fileUrl.includes('cloudinary.com')) {
      return this.deleteFromCloudinary(fileUrl);
    }

    // Локальное удаление
    const filePath = path.join(process.cwd(), fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  /**
   * Загрузка в Cloudinary
   */
  private async uploadToCloudinary(file: Express.Multer.File, folder: string): Promise<FileUploadResult> {
    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `digital-shop/${folder}`,
            resource_type: 'auto',
            transformation: [
              { width: 1200, height: 1200, crop: 'limit' },
              { quality: 'auto' },
              { fetch_format: 'auto' },
            ],
          },
          (error, result) => {
            if (error || !result) {
              this.logger.error('❌ Cloudinary upload failed:', error);
              reject(new Error('Failed to upload file to Cloudinary'));
            } else {
              this.logger.log(`✅ Uploaded to Cloudinary: ${result.secure_url}`);
              resolve({
                url: result.secure_url,
                filename: result.public_id,
              });
            }
          }
        );

        // Отправляем buffer напрямую в поток
        uploadStream.end(file.buffer);
      });
    } catch (error) {
      this.logger.error('❌ Cloudinary upload failed:', error);
      throw new Error('Failed to upload file to Cloudinary');
    }
  }

  /**
   * Удаление из Cloudinary
   */
  private async deleteFromCloudinary(fileUrl: string): Promise<void> {
    try {
      // Извлекаем public_id из URL
      const urlParts = fileUrl.split('/');
      const filename = urlParts[urlParts.length - 1].split('.')[0];
      const folder = urlParts.slice(-3, -1).join('/');
      const publicId = `${folder}/${filename}`;

      await cloudinary.uploader.destroy(publicId);
      this.logger.log(`🗑️ Deleted from Cloudinary: ${publicId}`);
    } catch (error) {
      this.logger.error('❌ Cloudinary delete failed:', error);
    }
  }
}
