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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { AuthenticatedRequest } from '../auth/interfaces';
import { SubscriptionBoxesService } from './subscription-boxes.service';
import {
  CreateSubscriptionBoxDto,
  UpdateSubscriptionBoxDto,
  PauseSubscriptionDto,
  RateDeliveryDto,
} from './dto';
import { SubscriptionBoxStatus } from '../database/entities/subscription-box.entity';

@ApiTags('Subscription Boxes')
@Controller('subscription-boxes')
export class SubscriptionBoxesController {
  constructor(private readonly subscriptionBoxesService: SubscriptionBoxesService) {}

  @Get('pricing')
  @ApiOperation({ summary: 'Get subscription box pricing' })
  getPricing() {
    return this.subscriptionBoxesService.getPricing();
  }

  @Get('my-subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user subscription' })
  getUserSubscription(@Request() req: AuthenticatedRequest) {
    return this.subscriptionBoxesService.getUserSubscription(req.user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a subscription box' })
  create(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateSubscriptionBoxDto,
  ) {
    return this.subscriptionBoxesService.create(req.user.id, dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update subscription box' })
  update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionBoxDto,
  ) {
    return this.subscriptionBoxesService.update(req.user.id, id, dto);
  }

  @Post(':id/pause')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pause subscription' })
  pause(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: PauseSubscriptionDto,
  ) {
    return this.subscriptionBoxesService.pause(req.user.id, id, dto);
  }

  @Post(':id/resume')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resume subscription' })
  resume(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.subscriptionBoxesService.resume(req.user.id, id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel subscription' })
  cancel(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.subscriptionBoxesService.cancel(req.user.id, id);
  }

  @Get('deliveries/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get delivery details' })
  getDeliveryDetails(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.subscriptionBoxesService.getDeliveryDetails(req.user.id, id);
  }

  @Post('deliveries/:id/rate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rate a delivery' })
  rateDelivery(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: RateDeliveryDto,
  ) {
    return this.subscriptionBoxesService.rateDelivery(req.user.id, id, dto);
  }

  // ==================== ADMIN ENDPOINTS ====================

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all subscriptions (Admin)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false, enum: SubscriptionBoxStatus })
  getAllSubscriptions(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: SubscriptionBoxStatus,
  ) {
    return this.subscriptionBoxesService.getAllSubscriptions({
      page,
      limit,
      status,
    });
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get subscription stats (Admin)' })
  getStats() {
    return this.subscriptionBoxesService.getStats();
  }

  // ==================== TEMPLATE ADMIN ENDPOINTS ====================

  @Get('templates')
  @ApiOperation({ summary: 'Get all subscription box templates' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  getTemplates(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.subscriptionBoxesService.getTemplates({ page, limit, isActive });
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get a subscription box template by ID' })
  getTemplate(@Param('id') id: string) {
    return this.subscriptionBoxesService.getTemplate(id);
  }

  @Post('templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a subscription box template (Admin)' })
  createTemplate(@Body() data: Record<string, unknown>) {
    return this.subscriptionBoxesService.createTemplate(data);
  }

  @Patch('templates/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a subscription box template (Admin)' })
  updateTemplate(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    return this.subscriptionBoxesService.updateTemplate(id, data);
  }

  @Delete('templates/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a subscription box template (Admin)' })
  deleteTemplate(@Param('id') id: string) {
    return this.subscriptionBoxesService.deleteTemplate(id);
  }
}
