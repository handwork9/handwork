import {
  Controller,
  Post,
  Body,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadsService } from './uploads.service';
import { UploadBase64Dto, UploadMultipleBase64Dto, UploadResponseDto, MultipleUploadResponseDto } from './dto';

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
  private readonly logger = new Logger(UploadsController.name);

  constructor(private readonly uploadsService: UploadsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('image')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload a single base64 encoded image' })
  @ApiBody({ type: UploadBase64Dto })
  async uploadSingleImage(@Body() dto: UploadBase64Dto): Promise<UploadResponseDto> {
    this.logger.log(`Uploading single image to folder: ${dto.folder || 'products'}`);
    return this.uploadsService.uploadBase64Image(dto.base64, dto.folder);
  }

  @UseGuards(JwtAuthGuard)
  @Post('images')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload multiple base64 encoded images (max 10)' })
  @ApiBody({ type: UploadMultipleBase64Dto })
  async uploadMultipleImages(@Body() dto: UploadMultipleBase64Dto): Promise<MultipleUploadResponseDto> {
    this.logger.log(`Uploading ${dto.images.length} images to folder: ${dto.folder || 'products'}`);
    return this.uploadsService.uploadMultipleBase64Images(dto.images, dto.folder);
  }
}
