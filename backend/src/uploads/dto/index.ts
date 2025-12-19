import { IsString, IsOptional, IsArray, ArrayMaxSize, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadBase64Dto {
  @ApiProperty({ 
    description: 'Base64 encoded image data (with or without data URI prefix)',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...'
  })
  @IsString()
  @IsNotEmpty()
  base64: string;

  @ApiProperty({ required: false, description: 'Folder to store the image in' })
  @IsString()
  @IsOptional()
  folder?: string;
}

export class UploadMultipleBase64Dto {
  @ApiProperty({ 
    description: 'Array of base64 encoded images',
    type: [String],
    maxItems: 10
  })
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  images: string[];

  @ApiProperty({ required: false, description: 'Folder to store the images in' })
  @IsString()
  @IsOptional()
  folder?: string;
}

export class UploadResponseDto {
  @ApiProperty({ description: 'URL of the uploaded file' })
  url: string;

  @ApiProperty({ description: 'File name' })
  filename: string;

  @ApiProperty({ description: 'File size in bytes' })
  size: number;
}

export class MultipleUploadResponseDto {
  @ApiProperty({ description: 'Array of uploaded file URLs' })
  urls: string[];

  @ApiProperty({ description: 'Number of files uploaded' })
  count: number;
}
