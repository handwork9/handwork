import { Injectable, Logger, BadRequestException, Inject, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable({ scope: Scope.REQUEST })
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly uploadDir: string;
  private readonly useCloudinary: boolean;

  constructor(
    private readonly configService: ConfigService,
    @Inject(REQUEST) private readonly request: Request,
  ) {
    // Get upload directory from env or use default (for local fallback)
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR') || path.join(process.cwd(), 'uploads');
    
    // Initialize Cloudinary if credentials are configured
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');
    
    // Use Cloudinary if credentials are provided
    this.useCloudinary = !!(cloudName && apiKey && apiSecret);
    
    if (this.useCloudinary) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      this.logger.log('Cloudinary storage initialized - uploads will be stored in cloud');
    } else {
      this.logger.log('Cloudinary not configured - using local storage (not recommended for production)');
      
      // Ensure local upload directories exist
      this.ensureDirectoryExists(this.uploadDir);
      this.ensureDirectoryExists(path.join(this.uploadDir, 'products'));
      this.ensureDirectoryExists(path.join(this.uploadDir, 'avatars'));
      this.ensureDirectoryExists(path.join(this.uploadDir, 'temp'));
      this.ensureDirectoryExists(path.join(this.uploadDir, 'chat'));
      this.ensureDirectoryExists(path.join(this.uploadDir, 'delivery-proof'));
      this.ensureDirectoryExists(path.join(this.uploadDir, 'disputes'));
      this.ensureDirectoryExists(path.join(this.uploadDir, 'support'));
    }
  }

  /**
   * Get the base URL for local uploads
   */
  private getLocalBaseUrl(): string {
    const configuredUrl = this.configService.get<string>('UPLOAD_BASE_URL');
    if (configuredUrl) {
      return configuredUrl;
    }

    const protocol = this.request.protocol || 'http';
    const host = this.request.get('host') || 'localhost:3000';
    return `${protocol}://${host}/uploads`;
  }

  private ensureDirectoryExists(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      this.logger.log(`Created upload directory: ${dir}`);
    }
  }

  /**
   * Parse base64 data URI and extract mime type and data
   */
  private parseBase64(base64String: string): { mimeType: string; data: string; extension: string } {
    const dataUriMatch = base64String.match(/^data:([^;]+);base64,(.+)$/);
    
    if (dataUriMatch) {
      const mimeType = dataUriMatch[1];
      const data = dataUriMatch[2];
      const extension = this.getExtensionFromMimeType(mimeType);
      return { mimeType, data, extension };
    }
    
    return { 
      mimeType: 'image/jpeg', 
      data: base64String, 
      extension: 'jpg' 
    };
  }

  private getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/heic': 'heic',
      'image/heif': 'heif',
    };
    return mimeToExt[mimeType] || 'jpg';
  }

  /**
   * Validate that the base64 data is a valid image
   */
  private validateImageBase64(base64String: string): void {
    const validPrefixes = [
      'data:image/jpeg',
      'data:image/jpg',
      'data:image/png',
      'data:image/gif',
      'data:image/webp',
      'data:image/heic',
      'data:image/heif',
    ];

    if (base64String.startsWith('data:')) {
      const isValid = validPrefixes.some(prefix => base64String.startsWith(prefix));
      if (!isValid) {
        throw new BadRequestException('Invalid image format. Supported formats: JPEG, PNG, GIF, WebP');
      }
    }

    const maxBase64Length = 5 * 1024 * 1024 * 1.37;
    if (base64String.length > maxBase64Length) {
      throw new BadRequestException('Image is too large. Maximum size is 5MB');
    }
  }

  /**
   * Upload to Cloudinary
   */
  private async uploadToCloudinary(
    base64String: string, 
    folder: string
  ): Promise<{ url: string; filename: string; size: number }> {
    const publicId = `${folder}/${uuidv4()}`;
    
    try {
      const result: UploadApiResponse = await cloudinary.uploader.upload(base64String, {
        public_id: publicId,
        folder: 'handwork',
        resource_type: 'image',
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
      });
      
      this.logger.log(`Uploaded to Cloudinary: ${result.secure_url} (${result.bytes} bytes)`);
      
      return {
        url: result.secure_url,
        filename: result.public_id,
        size: result.bytes,
      };
    } catch (error) {
      this.logger.error(`Cloudinary upload failed: ${error.message}`);
      throw new BadRequestException('Failed to upload image to cloud storage');
    }
  }

  /**
   * Upload to local storage
   */
  private async uploadToLocal(
    buffer: Buffer, 
    filename: string, 
    folder: string
  ): Promise<{ url: string; filename: string; size: number }> {
    const folderPath = path.join(this.uploadDir, folder);
    const filePath = path.join(folderPath, filename);

    this.ensureDirectoryExists(folderPath);

    try {
      await fs.promises.writeFile(filePath, buffer);
      this.logger.log(`Uploaded locally: ${filename} (${buffer.length} bytes)`);
      
      const baseUrl = this.getLocalBaseUrl();
      return {
        url: `${baseUrl}/${folder}/${filename}`,
        filename,
        size: buffer.length,
      };
    } catch (error) {
      this.logger.error(`Local upload failed: ${error.message}`);
      throw new BadRequestException('Failed to save image');
    }
  }

  /**
   * Upload a base64 encoded image
   * Uses Cloudinary in production, local storage in development
   */
  async uploadBase64Image(base64String: string, folder: string = 'products'): Promise<{ url: string; filename: string; size: number }> {
    this.validateImageBase64(base64String);
    
    // Upload to Cloudinary or local based on configuration
    if (this.useCloudinary) {
      // Cloudinary accepts the full data URI
      const dataUri = base64String.startsWith('data:') 
        ? base64String 
        : `data:image/jpeg;base64,${base64String}`;
      return this.uploadToCloudinary(dataUri, folder);
    } else {
      const { data, extension } = this.parseBase64(base64String);
      const filename = `${uuidv4()}.${extension}`;
      const buffer = Buffer.from(data, 'base64');
      return this.uploadToLocal(buffer, filename, folder);
    }
  }

  /**
   * Upload multiple base64 images
   */
  async uploadMultipleBase64Images(images: string[], folder: string = 'products'): Promise<{ urls: string[]; count: number }> {
    if (images.length > 10) {
      throw new BadRequestException('Maximum 10 images allowed per upload');
    }

    const results = await Promise.all(
      images.map(async (image) => {
        try {
          const result = await this.uploadBase64Image(image, folder);
          return result.url;
        } catch (error) {
          this.logger.warn(`Failed to upload one image: ${error.message}`);
          return null;
        }
      })
    );

    const successfulUrls = results.filter((url): url is string => url !== null);

    return {
      urls: successfulUrls,
      count: successfulUrls.length,
    };
  }

  /**
   * Delete an uploaded file
   */
  async deleteFile(url: string): Promise<boolean> {
    try {
      if (this.useCloudinary && url.includes('cloudinary.com')) {
        // Extract public_id from Cloudinary URL
        const match = url.match(/\/handwork\/([^.]+)/);
        if (match) {
          const publicId = `handwork/${match[1]}`;
          await cloudinary.uploader.destroy(publicId);
          this.logger.log(`Deleted from Cloudinary: ${publicId}`);
          return true;
        }
        return false;
      } else {
        // Delete from local storage
        const urlPath = new URL(url).pathname;
        const filePath = path.join(this.uploadDir, urlPath.replace('/uploads/', ''));
        
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
          this.logger.log(`Deleted file: ${filePath}`);
          return true;
        }
        return false;
      }
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`);
      return false;
    }
  }

  /**
   * Check if using cloud storage
   */
  isUsingCloudStorage(): boolean {
    return this.useCloudinary;
  }

  /**
   * Get storage info for debugging
   */
  getStorageInfo(): { type: 'Cloudinary' | 'Local'; uploadDir?: string } {
    if (this.useCloudinary) {
      return { type: 'Cloudinary' };
    }
    return { type: 'Local', uploadDir: this.uploadDir };
  }
}
