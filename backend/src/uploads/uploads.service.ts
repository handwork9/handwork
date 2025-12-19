import { Injectable, Logger, BadRequestException, Inject, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ scope: Scope.REQUEST })
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly uploadDir: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(REQUEST) private readonly request: Request,
  ) {
    // Get upload directory from env or use default
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR') || path.join(process.cwd(), 'uploads');
    
    // Ensure upload directories exist
    this.ensureDirectoryExists(this.uploadDir);
    this.ensureDirectoryExists(path.join(this.uploadDir, 'products'));
    this.ensureDirectoryExists(path.join(this.uploadDir, 'avatars'));
    this.ensureDirectoryExists(path.join(this.uploadDir, 'temp'));
  }

  /**
   * Get the base URL for uploads based on the request or config
   */
  private getBaseUrl(): string {
    // Check for configured base URL first (for production with CDN)
    const configuredUrl = this.configService.get<string>('UPLOAD_BASE_URL');
    if (configuredUrl) {
      return configuredUrl;
    }

    // Build URL from request host (works for both localhost and IP access)
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
    // Check if it's a data URI
    const dataUriMatch = base64String.match(/^data:([^;]+);base64,(.+)$/);
    
    if (dataUriMatch) {
      const mimeType = dataUriMatch[1];
      const data = dataUriMatch[2];
      const extension = this.getExtensionFromMimeType(mimeType);
      return { mimeType, data, extension };
    }
    
    // If no data URI prefix, assume it's raw base64 JPEG
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

    // If it has a data URI prefix, validate it
    if (base64String.startsWith('data:')) {
      const isValid = validPrefixes.some(prefix => base64String.startsWith(prefix));
      if (!isValid) {
        throw new BadRequestException('Invalid image format. Supported formats: JPEG, PNG, GIF, WebP');
      }
    }

    // Check if the base64 string is too large (limit to ~5MB of base64 which is ~3.75MB file)
    const maxBase64Length = 5 * 1024 * 1024 * 1.37; // ~5MB file in base64
    if (base64String.length > maxBase64Length) {
      throw new BadRequestException('Image is too large. Maximum size is 5MB');
    }
  }

  /**
   * Upload a base64 encoded image and save to local storage
   * Returns the URL to access the uploaded file
   */
  async uploadBase64Image(base64String: string, folder: string = 'products'): Promise<{ url: string; filename: string; size: number }> {
    this.validateImageBase64(base64String);
    
    const { data, extension } = this.parseBase64(base64String);
    
    // Generate unique filename
    const filename = `${uuidv4()}.${extension}`;
    const folderPath = path.join(this.uploadDir, folder);
    const filePath = path.join(folderPath, filename);

    // Ensure folder exists
    this.ensureDirectoryExists(folderPath);

    // Decode and write file
    const buffer = Buffer.from(data, 'base64');
    
    try {
      await fs.promises.writeFile(filePath, buffer);
      this.logger.log(`Uploaded image: ${filename} (${buffer.length} bytes)`);
      
      const baseUrl = this.getBaseUrl();
      return {
        url: `${baseUrl}/${folder}/${filename}`,
        filename,
        size: buffer.length,
      };
    } catch (error) {
      this.logger.error(`Failed to write file: ${error.message}`);
      throw new BadRequestException('Failed to save image');
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
      // Extract path from URL
      const urlPath = new URL(url).pathname;
      const filePath = path.join(this.uploadDir, urlPath.replace('/uploads/', ''));
      
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        this.logger.log(`Deleted file: ${filePath}`);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`);
      return false;
    }
  }
}
