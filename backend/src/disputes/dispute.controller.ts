import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard, AdminGuard, FarmerGuard, RiderGuard } from '../auth/guards';
import { DisputeService } from './dispute.service';
import { CreateDisputeDto, UpdateDisputeDto, AssignDisputeDto, SendDisputeMessageDto, ResolveDisputeDto } from './dto';
import { DisputeStatus, DisputePriority } from '../database/entities';

@Controller('disputes')
@UseGuards(JwtAuthGuard)
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) {}

  /**
   * Create a new dispute
   */
  @Post()
  async createDispute(
    @Request() req: any,
    @Body() dto: CreateDisputeDto,
  ) {
    const dispute = await this.disputeService.createDispute(req.user.id, dto);
    return {
      success: true,
      message: 'Dispute created successfully',
      data: dispute,
    };
  }

  /**
   * Get current user's disputes
   */
  @Get('my-disputes')
  async getMyDisputes(
    @Request() req: any,
    @Query('status') status?: DisputeStatus,
  ) {
    const disputes = await this.disputeService.getUserDisputes(req.user.id, status);
    return {
      success: true,
      data: disputes,
    };
  }

  /**
   * Get disputes for a specific order
   */
  @Get('order/:orderId')
  async getOrderDisputes(
    @Request() req: any,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    const disputes = await this.disputeService.getOrderDisputes(orderId, req.user.id);
    return {
      success: true,
      data: disputes,
    };
  }

  /**
   * Get dispute by ID
   */
  @Get(':id')
  async getDisputeById(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const dispute = await this.disputeService.getDisputeById(id);
    
    // Check access - user can view if they're buyer, farmer (of product), rider (of delivery), or admin
    const canAccess = await this.disputeService.canAccessDispute(
      id, 
      req.user.id, 
      req.user.role,
      req.user.farmerId,
      req.user.riderId,
    );

    if (!canAccess) {
      throw new ForbiddenException('You do not have access to this dispute');
    }

    return {
      success: true,
      data: dispute,
    };
  }

  /**
   * Send message in dispute
   */
  @Post(':id/messages')
  async sendMessage(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendDisputeMessageDto,
  ) {
    // Check access before allowing message
    const canAccess = await this.disputeService.canAccessDispute(
      id,
      req.user.id,
      req.user.role,
      req.user.farmerId,
      req.user.riderId,
    );

    if (!canAccess) {
      throw new ForbiddenException('You do not have access to this dispute');
    }

    const isAdmin = ['admin', 'superadmin', 'support'].includes(req.user.role);
    let senderType: 'user' | 'admin' | 'farmer' | 'rider' = 'user';
    
    if (isAdmin) {
      senderType = 'admin';
    } else if (req.user.role === 'farmer') {
      senderType = 'farmer';
    } else if (req.user.role === 'rider') {
      senderType = 'rider';
    }

    const message = await this.disputeService.sendMessage(
      id,
      req.user.id,
      dto,
      senderType,
    );
    return {
      success: true,
      data: message,
    };
  }

  // ============ FARMER ENDPOINTS ============

  /**
   * Get farmer's disputes (disputes involving their products)
   */
  @Get('farmer/my-disputes')
  @UseGuards(FarmerGuard)
  async getFarmerDisputes(
    @Request() req: any,
    @Query('status') status?: DisputeStatus,
  ) {
    if (!req.user.farmerId) {
      return {
        success: false,
        message: 'Farmer profile not found',
        data: [],
      };
    }
    
    const disputes = await this.disputeService.getFarmerDisputes(req.user.farmerId, status);
    return {
      success: true,
      data: disputes,
    };
  }

  // ============ RIDER ENDPOINTS ============

  /**
   * Get rider's disputes (disputes involving their deliveries)
   */
  @Get('rider/my-disputes')
  @UseGuards(RiderGuard)
  async getRiderDisputes(
    @Request() req: any,
    @Query('status') status?: DisputeStatus,
  ) {
    if (!req.user.riderId) {
      return {
        success: false,
        message: 'Rider profile not found',
        data: [],
      };
    }
    
    const disputes = await this.disputeService.getRiderDisputes(req.user.riderId, status);
    return {
      success: true,
      data: disputes,
    };
  }

  // ============ ADMIN ENDPOINTS ============

  /**
   * Get all disputes (admin)
   */
  @Get('admin/all')
  @UseGuards(AdminGuard)
  async getAllDisputes(
    @Query('status') status?: DisputeStatus,
    @Query('priority') priority?: DisputePriority,
    @Query('assignedToId') assignedToId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.disputeService.getAllDisputes({
      status,
      priority,
      assignedToId,
      page: page ? parseInt(String(page)) : 1,
      limit: limit ? parseInt(String(limit)) : 20,
    });
    return {
      success: true,
      data: result.disputes,
      pagination: {
        total: result.total,
        page: page || 1,
        limit: limit || 20,
      },
    };
  }

  /**
   * Get dispute statistics (admin)
   */
  @Get('admin/stats')
  @UseGuards(AdminGuard)
  async getDisputeStats() {
    const stats = await this.disputeService.getDisputeStats();
    return {
      success: true,
      data: stats,
    };
  }

  /**
   * Update dispute (admin)
   */
  @Patch('admin/:id')
  @UseGuards(AdminGuard)
  async updateDispute(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDisputeDto,
  ) {
    const dispute = await this.disputeService.updateDispute(id, dto, req.user.id);
    return {
      success: true,
      message: 'Dispute updated successfully',
      data: dispute,
    };
  }

  /**
   * Assign dispute to admin
   */
  @Patch('admin/:id/assign')
  @UseGuards(AdminGuard)
  async assignDispute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignDisputeDto,
  ) {
    const dispute = await this.disputeService.assignDispute(id, dto);
    return {
      success: true,
      message: 'Dispute assigned successfully',
      data: dispute,
    };
  }

  /**
   * Resolve dispute
   */
  @Patch('admin/:id/resolve')
  @UseGuards(AdminGuard)
  async resolveDispute(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveDisputeDto,
  ) {
    const dispute = await this.disputeService.resolveDispute(id, dto, req.user.id);
    return {
      success: true,
      message: 'Dispute resolved successfully',
      data: dispute,
    };
  }
}
