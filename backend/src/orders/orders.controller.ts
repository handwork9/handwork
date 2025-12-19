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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, AssignRiderDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators';
import { UserRole } from '../common/enums';
import { User } from '../database/entities/user.entity';
import { RidersService } from '../riders/riders.service';

@ApiTags('Orders')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly ridersService: RidersService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order from cart' })
  async create(@CurrentUser() user: User, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user orders (buyer or rider based on role)' })
  async getMyOrders(
    @CurrentUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    if (user.role === UserRole.RIDER) {
      // Get rider profile id - this would need rider service
      return this.ordersService.findByRider(user.id, page || 1, limit || 20);
    }
    return this.ordersService.findByBuyer(user.id, page || 1, limit || 20);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  async getOrder(@Param('id') id: string, @CurrentUser() user: User) {
    const order = await this.ordersService.findById(id);
    
    // Check access - buyer, assigned rider, or admin
    if (
      order.buyerId !== user.id &&
      order.assignedRiderId !== user.id &&
      user.role !== UserRole.ADMIN
    ) {
      // Also check if farmer of any item
      const isFarmer = order.items.some((item) => item.farmerId === user.id);
      if (!isFarmer) {
        return { error: 'Access denied' };
      }
    }

    return order;
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto, user.id, user.role);
  }

  @Get('number/:orderNumber')
  @ApiOperation({ summary: 'Get order by order number' })
  async getByOrderNumber(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.findByOrderNumber(orderNumber);
  }

  @Get('dispatch/available')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: 'Get orders available for pickup in rider state' })
  async getAvailableOrders(
    @CurrentUser() user: User,
    @Query('state') state: string,
  ) {
    return this.ordersService.getOrdersForDispatch(state);
  }

  @Patch(':id/assign-rider')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign a rider to an order (Admin only)' })
  async assignRider(
    @Param('id') orderId: string,
    @Body() dto: AssignRiderDto,
  ) {
    return this.ordersService.assignRider(orderId, dto.riderId);
  }

  @Patch(':id/accept')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: 'Rider accepts an order' })
  async acceptOrder(
    @Param('id') orderId: string,
    @CurrentUser() user: User,
  ) {
    // Get rider profile from user
    const rider = await this.ridersService.findByUserId(user.id);
    return this.ordersService.assignRider(orderId, rider.id);
  }
}
