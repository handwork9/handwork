import { Controller, Get, Put, Post, Delete, Body, UseGuards, Param, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiResponse, ApiParam } from '@nestjs/swagger';
import { UsersService, BuyerPremiumDto } from './users.service';
import { UpdateUserDto, UpdateDeviceTokenDto, UpdateLocationDto, ApplyAsFarmerDto, RequestAccountDeletionDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, Public } from '../common/decorators';
import { User } from '../database/entities/user.entity';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);
  
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser() user: User) {
    return this.sanitizeUser(user);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateUserDto) {
    this.logger.log(`Updating profile for user ${userId} with data: ${JSON.stringify(dto)}`);
    const user = await this.usersService.update(userId, dto);
    this.logger.log(`Profile updated successfully for user ${userId}, avatar: ${user.avatar}`);
    return this.sanitizeUser(user);
  }

  @Put('device-token')
  @ApiOperation({ summary: 'Update device token for push notifications' })
  async updateDeviceToken(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateDeviceTokenDto,
  ) {
    await this.usersService.updateDeviceToken(userId, dto.token);
    return { message: 'Device token updated' };
  }

  @Put('location')
  @ApiOperation({ summary: 'Update user location' })
  async updateLocation(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateLocationDto,
  ) {
    await this.usersService.updateLocation(userId, dto.lat, dto.lng);
    return { message: 'Location updated' };
  }

  @Get('premium/pricing')
  @ApiOperation({ summary: 'Get premium subscription pricing' })
  async getPremiumPricing() {
    return this.usersService.getPremiumPricing();
  }

  @Post('premium/subscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Subscribe to premium' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        tier: { type: 'string', enum: ['basic', 'gold', 'platinum'], example: 'gold' },
        duration: { type: 'string', enum: ['weekly', 'monthly', 'quarterly'], example: 'monthly' },
        paymentMethod: { type: 'string', enum: ['wallet', 'card'], example: 'wallet' },
      },
      required: ['tier', 'duration'],
    },
  })
  @ApiResponse({ status: 200, description: 'Successfully subscribed to premium' })
  async subscribeToPremium(
    @CurrentUser('id') userId: string,
    @Body() dto: BuyerPremiumDto,
  ) {
    return this.usersService.subscribeToPremium(userId, dto);
  }

  @Post('farmer/apply')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apply to become a farmer' })
  @ApiResponse({ status: 200, description: 'Application submitted successfully' })
  @ApiResponse({ status: 409, description: 'Already applied or already a farmer' })
  async applyAsFarmer(
    @CurrentUser('id') userId: string,
    @Body() dto: ApplyAsFarmerDto,
  ) {
    return this.usersService.applyAsFarmer(userId, dto);
  }

  @Get('farmer/application-status')
  @ApiOperation({ summary: 'Get farmer application status' })
  @ApiResponse({ status: 200, description: 'Application status' })
  async getFarmerApplicationStatus(@CurrentUser('id') userId: string) {
    return this.usersService.getFarmerApplicationStatus(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (public profile)' })
  async getUser(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return this.sanitizeUser(user);
  }

  @Public()
  @Post('lookup/phone')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Look up user by phone number for transfers' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        phone: { type: 'string', example: '08012345678' },
      },
      required: ['phone'],
    },
  })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async lookupUserByPhone(@Body('phone') phone: string) {
    // Normalize phone number to +234 format
    let normalizedPhone = phone.trim();
    
    // If phone starts with 0, replace with +234
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '+234' + normalizedPhone.substring(1);
    }
    // If phone starts with 234, add +
    else if (normalizedPhone.startsWith('234')) {
      normalizedPhone = '+' + normalizedPhone;
    }
    // If phone doesn't start with +, add +234
    else if (!normalizedPhone.startsWith('+')) {
      normalizedPhone = '+234' + normalizedPhone;
    }
    
    // Try normalized phone first
    let user = await this.usersService.findByPhone(normalizedPhone);
    
    // If not found, try original phone as fallback
    if (!user && normalizedPhone !== phone) {
      user = await this.usersService.findByPhone(phone);
    }
    if (!user) {
      return { found: false, user: null };
    }
    return {
      found: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
      },
    };
  }

  @Get('settings/security')
  @ApiOperation({ summary: 'Get security settings' })
  @ApiResponse({ status: 200, description: 'Security settings retrieved' })
  async getSecuritySettings(@CurrentUser() user: User) {
    return {
      loginAlertsEnabled: user.loginAlertsEnabled ?? true,
      isTwoFactorEnabled: user.isTwoFactorEnabled ?? false,
      isPinEnabled: user.isPinEnabled ?? false,
    };
  }

  @Put('settings/security/login-alerts')
  @ApiOperation({ summary: 'Update login alerts setting' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean', example: true },
      },
      required: ['enabled'],
    },
  })
  @ApiResponse({ status: 200, description: 'Login alerts setting updated' })
  async updateLoginAlerts(
    @CurrentUser('id') userId: string,
    @Body('enabled') enabled: boolean,
  ) {
    await this.usersService.updateLoginAlerts(userId, enabled);
    return { 
      message: enabled ? 'Login alerts enabled' : 'Login alerts disabled',
      loginAlertsEnabled: enabled,
    };
  }

  // ==================== ACCOUNT DELETION ENDPOINTS ====================

  @Post('account/delete-request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request account deletion' })
  @ApiResponse({ status: 200, description: 'Deletion request submitted' })
  @ApiResponse({ status: 403, description: 'Invalid password' })
  @ApiResponse({ status: 409, description: 'Already have pending request' })
  async requestAccountDeletion(
    @CurrentUser('id') userId: string,
    @Body() dto: RequestAccountDeletionDto,
  ) {
    return this.usersService.requestAccountDeletion(userId, dto);
  }

  @Get('account/delete-request/status')
  @ApiOperation({ summary: 'Get deletion request status' })
  @ApiResponse({ status: 200, description: 'Deletion request status' })
  async getDeletionRequestStatus(@CurrentUser('id') userId: string) {
    return this.usersService.getDeletionRequestStatus(userId);
  }

  @Delete('account/delete-request/:requestId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel deletion request' })
  @ApiParam({ name: 'requestId', description: 'Deletion request ID' })
  @ApiResponse({ status: 200, description: 'Request cancelled' })
  @ApiResponse({ status: 400, description: 'Can only cancel pending requests' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  async cancelDeletionRequest(
    @CurrentUser('id') userId: string,
    @Param('requestId') requestId: string,
  ) {
    return this.usersService.cancelDeletionRequest(userId, requestId);
  }

  // ==================== FREE DELIVERY PROMO ENDPOINTS ====================

  @Get('promo/free-delivery/status')
  @ApiOperation({ summary: 'Get free delivery promo status for current user' })
  @ApiResponse({ status: 200, description: 'Promo status returned' })
  async getFreeDeliveryPromoStatus(@CurrentUser('id') userId: string) {
    return this.usersService.getFreeDeliveryPromoStatus(userId);
  }

  @Post('promo/free-delivery/claim')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Claim free delivery promo (new users only)' })
  @ApiResponse({ status: 200, description: 'Promo claimed successfully' })
  @ApiResponse({ status: 400, description: 'Already claimed or not eligible' })
  async claimFreeDeliveryPromo(@CurrentUser('id') userId: string) {
    return this.usersService.claimFreeDeliveryPromo(userId);
  }

  private sanitizeUser(user: User) {
    const { password, refreshToken, deviceTokens, ...sanitized } = user;
    return sanitized;
  }
}
