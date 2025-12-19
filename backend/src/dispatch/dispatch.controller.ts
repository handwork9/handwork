import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { DispatchService, DispatchResult } from './dispatch.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { DispatchLog } from '../database/entities';

@ApiTags('Dispatch')
@ApiBearerAuth()
@Controller('dispatch')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) {}

  @Post('order/:orderId')
  @Roles(UserRole.ADMIN, UserRole.BUYER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger dispatch for an order' })
  @ApiParam({ name: 'orderId', description: 'Order ID to dispatch' })
  @ApiResponse({
    status: 200,
    description: 'Dispatch initiated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid order or order not in correct status',
  })
  async dispatchOrder(@Param('orderId') orderId: string): Promise<DispatchResult> {
    return this.dispatchService.dispatchOrder(orderId);
  }

  @Post('order/:orderId/queue')
  @Roles(UserRole.ADMIN, UserRole.BUYER)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Queue order for async dispatch' })
  @ApiParam({ name: 'orderId', description: 'Order ID to queue' })
  @ApiResponse({
    status: 202,
    description: 'Dispatch job queued successfully',
  })
  async queueDispatch(
    @Param('orderId') orderId: string,
  ): Promise<{ message: string; orderId: string }> {
    await this.dispatchService.queueDispatch(orderId);
    return {
      message: 'Dispatch job queued successfully',
      orderId,
    };
  }

  @Post('accept')
  @Roles(UserRole.RIDER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept an order offer (rider)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['orderId', 'riderId'],
      properties: {
        orderId: { type: 'string', example: 'order-uuid' },
        riderId: { type: 'string', example: 'rider-uuid' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Order accepted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Order already assigned or invalid',
  })
  async acceptOrder(
    @Body() body: { orderId: string; riderId: string },
  ): Promise<DispatchResult> {
    return this.dispatchService.acceptOrder(body.orderId, body.riderId);
  }

  @Post('decline')
  @Roles(UserRole.RIDER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Decline an order offer (rider)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['orderId', 'riderId'],
      properties: {
        orderId: { type: 'string', example: 'order-uuid' },
        riderId: { type: 'string', example: 'rider-uuid' },
        reason: { type: 'string', example: 'Too far' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Order declined',
  })
  async declineOrder(
    @Body() body: { orderId: string; riderId: string; reason?: string },
  ): Promise<{ message: string }> {
    await this.dispatchService.declineOrder(body.orderId, body.riderId, body.reason);
    return { message: 'Order offer declined' };
  }

  @Get('status/:orderId')
  @Roles(UserRole.ADMIN, UserRole.BUYER, UserRole.RIDER)
  @ApiOperation({ summary: 'Get dispatch status for an order' })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Dispatch status retrieved',
  })
  async getDispatchStatus(
    @Param('orderId') orderId: string,
  ): Promise<DispatchLog | null> {
    return this.dispatchService.getDispatchStatus(orderId);
  }
}
