import { Injectable, Logger, BadRequestException, Inject, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as AWS from 'aws-sdk';

@Injectable({ scope: Scope.REQUEST })
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly uploadDir: string;
  private readonly s3: AWS.S3 | null;
  private readonly s3Bucket: string;
  private readonly useS3: boolean;

  constructor(
    private readonly configService: ConfigService,
    @Inject(REQUEST) private readonly request: Request,
  ) {
    // Get upload directory from env or use default (for local fallback)
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR') || path.join(process.cwd(), 'uploads');
    
    // Initialize S3 if credentials are configured
    const awsAccessKeyId = this.configService.get<string>('services.aws.accessKeyId');
    const awsSecretAccessKey = this.configService.get<string>('services.aws.secretAccessKey');
    const awsRegion = this.configService.get<string>('services.aws.region') || 'us-east-1';
    this.s3Bucket = this.configService.get<string>('services.aws.s3Bucket') || 'handwork-uploads';
    
    // Use S3 if credentials are provided
    this.useS3 = !!(awsAccessKeyId && awsSecretAccessKey);
    
    if (this.useS3) {
      this.s3 = new AWS.S3({
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretAccessKey,
        region: awsRegion,
      });
      this.logger.log('S3 storage initialized - uploads will be stored in S3');
    } else {
      this.s3 = null;
      this.logger.log('S3 not configured - using local storage (not recommended for production)');
      
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
   * Get the base URL for uploads based on storage type
   */
  private getBaseUrl(folder: string = 'products'): string {
    if (this.useS3) {
      // Return S3 URL
      return \`https://\${this.s3Bucket}.s3.amazonaws.com\`;
    }
    
    // Check for configured base URL first (for production with CDN)
    const configuredUrl = this.configService.get<string>('UPLOAD_BASE_URL');
    if (configuredUrl) {
      return configuredUrl;
    }

    // Build URL from request host (works for both localhost and IP access)
    const protocol = this.request.protocol || 'http';
    const host = this.request.get('host') || 'localhost:3000';
    return \`\${protocol}://\${host}/uploads\`;
  }

  private ensureDirectoryExists(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      this.logger.log(\`Created upload directory: \${dir}\`);
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
   * Upload to S3
   */
  private async uploadToS3(
    buffer: Buffer, 
    filename: string, 
    folder: string, 
    mimeType: string
  ): Promise<{ url: string; filename: string; size: number }> {
    if (!this.s3) {
      throw new BadRequestException('S3 is not configured');
    }

    const key = \`\${folder}/\${filename}\`;
    
    const params: AWS.S3.PutObjectRequest = {
      Bucket: this.s3Bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ACL: 'public-read', // Make the file publicly accessible
      CacheControl: 'max-age=31536000', // Cache for 1 year
    };

    try {
      await this.s3.upload(params).promise();
      const url = \`https://\${this.s3Bucket}.s3.amazonaws.com/\${key}\`;
      this.logger.log(\`Uploaded to S3: \${url} (\${buffer.length} bytes)\`);
      
      return {
        url,
        filename,
        size: buffer.length,
      };
    } catch (error) {
      this.logger.error(\`S3 upload failed: \${error.message}\`);
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

    // Ensure folder exists
    this.ensureDirectoryExists(folderPath);

    try {
      await fs.promises.writeFile(filePath, buffer);
      this.logger.log(\`Uploaded locally: \${filename} (\${buffer.length} bytes)\`);
      
      const baseUrl = this.getBaseUrl(folder);
      return {
        url: \`\${baseUrl}/\${folder}/\${filename}\`,
        filename,
        size: buffer.length,
      };
    } catch (error) {
      this.logger.error(\`Local upload failed: \${error.message}\`);
      throw new BadRequestException('Failed to save image');
    }
  }

  /**
   * Upload a base64 encoded image
   * Uses S3 in production, local storage in development
   */
  async uploadBase64Image(base64String: string, folder: string = 'products'): Promise<{ url: string; filename: string; size: number }> {
    this.validateImageBase64(base64String);
    
    const { data, extension, mimeType } = this.parseBase64(base64String);
    
    // Generate unique filename
    const filename = \`\${uuidv4()}.\${extension}\`;
    
    // Decode base64 to buffer
    const buffer = Buffer.from(data, 'base64');
    
    // Upload to S3 or local based on configuration
    if (this.useS3) {
      return this.uploadToS3(buffer, filename, folder, mimeType);
    } else {
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
          this.logger.warn(\`Failed to upload one image: \${error.message}\`);
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
      if (this.useS3 && url.includes('.s3.amazonaws.com')) {
        // Delete from S3
        const urlObj = new URL(url);
        const key = urlObj.pathname.substring(1); // Remove leading slash
        
        await this.s3!.deleteObject({
          Bucket: this.s3Bucket,
          Key: key,
        }).promise();
        
        this.logger.log(\`Deleted from S3: \${key}\`);
        return true;
      } else {
        // Delete from local storage
        const urlPath = new URL(url).pathname;
        const filePath = path.join(this.uploadDir, urlPath.replace('/uploads/', ''));
        
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
          this.logger.log(\`Deleted file: \${filePath}\`);
          return true;
        }
        return false;
      }
    } catch (error) {
      this.logger.error(\`Failed to delete file: \${error.message}\`);
      return false;
    }
  }

  /**
   * Check if using S3 storage
   */
  isUsingS3(): boolean {
    return this.useS3;
  }

  /**
   * Get storage info for debugging
   */
  getStorageInfo(): { type: 'S3' | 'Local'; bucket?: string; uploadDir?: string } {
    if (this.useS3) {
      return { type: 'S3', bucket: this.s3Bucket };
    }
    return { type: 'Local', uploadDir: this.uploadDir };
  }
}
