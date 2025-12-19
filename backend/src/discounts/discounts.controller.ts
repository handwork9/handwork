import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { DiscountsService } from './discounts.service';
import { CreateDiscountDto, UpdateDiscountDto, DiscountQueryDto, ApplyPromoCodeDto } from './dto';

interface AuthenticatedRequest {
  user: { id: string; role: string };
}

@ApiTags('Discounts')
@Controller('discounts')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FARMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a discount for a product (Farmer only)' })
  @ApiResponse({ status: 201, description: 'Discount created successfully' })
  async create(@Request() req: AuthenticatedRequest, @Body() dto: CreateDiscountDto) {
    const discount = await this.discountsService.create(req.user.id, dto);
    return {
      success: true,
      message: 'Discount created successfully',
      data: discount,
    };
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FARMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all discounts by farmer' })
  async findAllByFarmer(@Request() req: AuthenticatedRequest, @Query() query: DiscountQueryDto) {
    const result = await this.discountsService.findAllByFarmer(req.user.id, query);
    return {
      success: true,
      data: result.discounts,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FARMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get discount statistics for farmer' })
  async getStats(@Request() req: AuthenticatedRequest) {
    const stats = await this.discountsService.getDiscountStats(req.user.id);
    return {
      success: true,
      data: stats,
    };
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get active discount for a product (Public)' })
  async findByProduct(@Param('productId') productId: string) {
    const discount = await this.discountsService.findByProduct(productId);
    return {
      success: true,
      data: discount,
    };
  }

  @Post('apply-promo')
  @ApiOperation({ summary: 'Apply a promo code to a product' })
  async applyPromoCode(@Body() dto: ApplyPromoCodeDto) {
    const result = await this.discountsService.applyPromoCode(dto);
    return {
      success: true,
      message: 'Promo code applied successfully',
      data: result,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FARMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific discount' })
  async findOne(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    const discount = await this.discountsService.findOne(id, req.user.id);
    return {
      success: true,
      data: discount,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FARMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a discount' })
  async update(@Request() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateDiscountDto) {
    const discount = await this.discountsService.update(id, req.user.id, dto);
    return {
      success: true,
      message: 'Discount updated successfully',
      data: discount,
    };
  }

  @Patch(':id/pause')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FARMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pause a discount' })
  async pause(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    const discount = await this.discountsService.pause(id, req.user.id);
    return {
      success: true,
      message: 'Discount paused successfully',
      data: discount,
    };
  }

  @Patch(':id/resume')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FARMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resume a paused discount' })
  async resume(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    const discount = await this.discountsService.resume(id, req.user.id);
    return {
      success: true,
      message: 'Discount resumed successfully',
      data: discount,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FARMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a discount' })
  async remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.discountsService.remove(id, req.user.id);
    return {
      success: true,
      message: 'Discount deleted successfully',
    };
  }
}
