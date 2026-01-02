import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RidersService } from './riders.service';
import { RegisterRiderDto, UpdateRiderLocationDto, UpdateRiderStatusDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators';
import { UserRole } from '../common/enums';
import { User } from '../database/entities/user.entity';

@ApiTags('Riders')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('riders')
export class RidersController {
  constructor(private readonly ridersService: RidersService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register as a rider' })
  async register(@CurrentUser() user: User, @Body() dto: RegisterRiderDto) {
    return this.ridersService.register(user.id, dto);
  }

  @Get('profile')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: 'Get rider profile' })
  async getProfile(@CurrentUser() user: User) {
    return this.ridersService.findByUserId(user.id);
  }

  @Patch('location')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: 'Update rider location' })
  async updateLocation(
    @CurrentUser() user: User,
    @Body() dto: UpdateRiderLocationDto,
  ) {
    const rider = await this.ridersService.findByUserId(user.id);
    await this.ridersService.updateLocation(rider.id, dto);
    return { message: 'Location updated' };
  }

  @Patch('status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: 'Update rider online/available status' })
  async updateStatus(
    @CurrentUser() user: User,
    @Body() dto: UpdateRiderStatusDto,
  ) {
    const rider = await this.ridersService.findByUserId(user.id);
    return this.ridersService.updateStatus(rider.id, dto);
  }

  @Get('earnings')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: 'Get rider earnings summary' })
  async getEarnings(
    @CurrentUser() user: User,
    @Query('period') period: 'today' | 'week' | 'month' | 'all' = 'week',
  ) {
    const rider = await this.ridersService.findByUserId(user.id);
    return this.ridersService.getEarnings(rider.id, period);
  }

  @Patch('daily-goal')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: 'Update rider daily earning goal' })
  async updateDailyGoal(
    @CurrentUser() user: User,
    @Body() body: { dailyGoal: number },
  ) {
    console.log('[DailyGoal] Received body:', body);
    const rider = await this.ridersService.findByUserId(user.id);
    return this.ridersService.updateDailyGoal(rider.id, body.dailyGoal);
  }

  @Get('active-delivery')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: 'Get current active delivery for rider' })
  async getActiveDelivery(@CurrentUser() user: User) {
    console.log(`[ActiveDelivery] User ID: ${user.id}, looking for rider...`);
    const rider = await this.ridersService.findByUserId(user.id);
    console.log(`[ActiveDelivery] Found rider ID: ${rider?.id}`);
    const delivery = await this.ridersService.getActiveDelivery(rider.id);
    console.log(`[ActiveDelivery] Delivery found: ${delivery ? 'yes' : 'no'}`);
    return { delivery };
  }

  @Patch('deliveries/:deliveryId/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: 'Update delivery status' })
  async updateDeliveryStatus(
    @CurrentUser() user: User,
    @Param('deliveryId') deliveryId: string,
    @Body() dto: { status: string; proofOfDeliveryPhoto?: string },
  ) {
    const rider = await this.ridersService.findByUserId(user.id);
    return this.ridersService.updateDeliveryStatus(rider.id, deliveryId, dto.status, dto.proofOfDeliveryPhoto);
  }

  @Get('available')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get available riders (Admin only)' })
  async getAvailableRiders(
    @Query('state') state: string,
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius?: number,
  ) {
    return this.ridersService.getAvailableRiders(state, lat, lng, radius);
  }

  @Get('performance')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: 'Get rider performance dashboard' })
  @ApiQuery({ name: 'period', required: false, enum: ['week', 'month', 'quarter', 'year'] })
  async getPerformance(
    @CurrentUser() user: User,
    @Query('period') period: 'week' | 'month' | 'quarter' | 'year' = 'month',
  ) {
    const rider = await this.ridersService.findByUserId(user.id);
    return this.ridersService.getPerformanceData(rider.id, period);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get rider by ID' })
  async getRider(@Param('id') id: string) {
    const rider = await this.ridersService.findById(id);
    // Remove sensitive data
    const { walletBalance, totalEarnings, ...publicRider } = rider;
    return publicRider;
  }
}
