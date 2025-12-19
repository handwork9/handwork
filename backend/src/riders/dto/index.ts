import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { VehicleType } from '../../common/enums';

export class RegisterRiderDto {
  @ApiProperty({ example: 'Lagos' })
  @IsString()
  state: string;

  @ApiProperty({ example: 'Ikeja', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ enum: VehicleType })
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @ApiProperty({ example: 'ABC-123XY', required: false })
  @IsString()
  @IsOptional()
  vehiclePlate?: string;

  @ApiProperty({ example: 'Honda CBR', required: false })
  @IsString()
  @IsOptional()
  vehicleModel?: string;

  @ApiProperty({ example: 'DRV-12345', required: false })
  @IsString()
  @IsOptional()
  licenseNumber?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  licenseImage?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  idCardImage?: string;
}

export class UpdateRiderLocationDto {
  @ApiProperty({ example: 6.5244 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({ example: 3.3792 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;
}

export class UpdateRiderStatusDto {
  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isOnline?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;
}
