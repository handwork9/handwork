import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { CouponsService } from './coupons.service';
import {
  CreateCouponDto,
  UpdateCouponDto,
  ValidateCouponDto,
} from './dto';
import { AuthenticatedRequest } from '../auth/interfaces';
import { CouponStatus, CouponType } from '../database/entities/coupon.entity';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  // Admin endpoints
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() createCouponDto: CreateCouponDto) {
    return this.couponsService.create(createCouponDto);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll(
    @Query('status') status?: CouponStatus,
    @Query('type') type?: CouponType,
  ) {
    return this.couponsService.findAll({ status }, type);
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.couponsService.findOne(id);
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateCouponDto: UpdateCouponDto) {
    return this.couponsService.update(id, updateCouponDto);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.couponsService.delete(id);
  }

  @Get('admin/:id/usage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getCouponUsage(@Param('id') id: string) {
    return this.couponsService.getCouponUsage(id);
  }

  // User endpoints
  @Get('available')
  @UseGuards(JwtAuthGuard)
  getAvailableCoupons(@Request() req: AuthenticatedRequest) {
    return this.couponsService.getAvailableCoupons(req.user.id);
  }

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  async validateCoupon(
    @Request() req: AuthenticatedRequest,
    @Body() validateDto: ValidateCouponDto,
  ) {
    const result = await this.couponsService.validateCoupon(
      validateDto.code,
      req.user.id,
      validateDto.cartItems,
      validateDto.subtotal,
    );
    return result;
  }

  @Post('apply/:code')
  @UseGuards(JwtAuthGuard)
  async applyCoupon(
    @Request() req: AuthenticatedRequest,
    @Param('code') code: string,
    @Body() body: { orderId: string; discountAmount: number },
  ) {
    return this.couponsService.applyCoupon(
      code,
      req.user.id,
      body.orderId,
      body.discountAmount,
    );
  }

  @Get('code/:code')
  @UseGuards(JwtAuthGuard)
  async getCouponByCode(@Param('code') code: string) {
    const coupon = await this.couponsService.findByCode(code);
    if (!coupon) {
      return { valid: false, message: 'Coupon not found' };
    }
    // Return limited info for users
    return {
      valid: true,
      coupon: {
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        type: coupon.type,
        value: coupon.value,
        minOrderAmount: coupon.minOrderAmount,
        maxDiscountAmount: coupon.maxDiscountAmount,
        endDate: coupon.endDate,
      },
    };
  }

  @Get('my-usage')
  @UseGuards(JwtAuthGuard)
  getMyUsage(@Request() req: AuthenticatedRequest) {
    return this.couponsService.getUserCouponUsage(req.user.id);
  }
}
