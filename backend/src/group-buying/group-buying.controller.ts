import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/interfaces';
import { GroupBuyingService } from './group-buying.service';
import {
  CreateGroupBuyDto,
  UpdateGroupBuyDto,
  JoinGroupBuyDto,
  PayGroupBuyDto,
  QueryGroupBuysDto,
} from './dto';
import { GROUP_BUY_TIERS } from '../database/entities/group-buy.entity';

@Controller('group-buying')
export class GroupBuyingController {
  constructor(private readonly groupBuyingService: GroupBuyingService) {}

  // Get discount tiers info (public)
  @Get('tiers')
  getTiers() {
    return {
      success: true,
      data: GROUP_BUY_TIERS,
    };
  }

  // Create a new group buy (auth required)
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req: AuthenticatedRequest, @Body() dto: CreateGroupBuyDto) {
    console.log('Creating group buy - req.user:', req.user?.id);
    const userId = req.user?.id;
    
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }
    
    const groupBuy = await this.groupBuyingService.create(userId, dto);
    return {
      success: true,
      message: 'Group buy created successfully',
      data: groupBuy,
    };
  }

  // Get all active group buys (public)
  @Get()
  async findAll(@Query() query: QueryGroupBuysDto) {
    const result = await this.groupBuyingService.findAll(query);
    return {
      success: true,
      data: result.groupBuys,
      total: result.total,
    };
  }

  // Get my group buys (organized and joined) - auth required
  @UseGuards(JwtAuthGuard)
  @Get('my')
  async getMyGroupBuys(@Request() req: AuthenticatedRequest) {
    const result = await this.groupBuyingService.getMyGroupBuys(req.user.id);
    return {
      success: true,
      data: result,
    };
  }

  // Get group buy by share code (public)
  @Get('code/:shareCode')
  async findByShareCode(@Param('shareCode') shareCode: string) {
    const groupBuy = await this.groupBuyingService.findByShareCode(shareCode);
    return {
      success: true,
      data: groupBuy,
    };
  }

  // Get single group buy (public)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const groupBuy = await this.groupBuyingService.findOne(id);
    return {
      success: true,
      data: groupBuy,
    };
  }

  // Update group buy (organizer only) - auth required
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateGroupBuyDto,
  ) {
    const groupBuy = await this.groupBuyingService.update(id, req.user.id, dto);
    return {
      success: true,
      message: 'Group buy updated successfully',
      data: groupBuy,
    };
  }

  // Join a group buy - auth required
  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  async join(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: JoinGroupBuyDto,
  ) {
    const participant = await this.groupBuyingService.join(id, req.user.id, dto);
    return {
      success: true,
      message: 'Successfully joined the group buy',
      data: participant,
    };
  }

  // Leave a group buy - auth required
  @UseGuards(JwtAuthGuard)
  @Delete(':id/leave')
  async leave(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    await this.groupBuyingService.leave(id, req.user.id);
    return {
      success: true,
      message: 'Successfully left the group buy',
    };
  }

  // Pay for group buy - auth required
  @UseGuards(JwtAuthGuard)
  @Post(':id/pay')
  async pay(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: PayGroupBuyDto,
  ) {
    const participant = await this.groupBuyingService.pay(id, req.user.id, dto);
    return {
      success: true,
      message: 'Payment successful',
      data: participant,
    };
  }

  // Cancel group buy (organizer only) - auth required
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async cancel(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    const groupBuy = await this.groupBuyingService.cancel(id, req.user.id);
    return {
      success: true,
      message: 'Group buy cancelled and refunds processed',
      data: groupBuy,
    };
  }

  // Get participants of a group buy (public)
  @Get(':id/participants')
  async getParticipants(@Param('id') id: string) {
    const participants = await this.groupBuyingService.getParticipants(id);
    return {
      success: true,
      data: participants,
    };
  }
}
