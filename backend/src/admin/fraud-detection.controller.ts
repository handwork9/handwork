import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../database/entities';
import { FraudDetectionService } from './fraud-detection.service';
import { FraudType, FraudSeverity, FraudAlertStatus } from '../database/entities/fraud-alert.entity';

@ApiTags('Fraud Detection')
@Controller('admin/fraud')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class FraudDetectionController {
  constructor(private readonly fraudDetectionService: FraudDetectionService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get fraud detection statistics' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.fraudDetectionService.getFraudStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get all fraud alerts' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false, enum: FraudAlertStatus })
  @ApiQuery({ name: 'type', required: false, enum: FraudType })
  @ApiQuery({ name: 'severity', required: false, enum: FraudSeverity })
  @ApiQuery({ name: 'userId', required: false })
  async getAlerts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: FraudAlertStatus,
    @Query('type') type?: FraudType,
    @Query('severity') severity?: FraudSeverity,
    @Query('userId') userId?: string,
  ) {
    return this.fraudDetectionService.getAlerts(
      parseInt(page || '1', 10),
      parseInt(limit || '20', 10),
      status,
      type,
      severity,
      userId,
    );
  }

  @Get('alerts/:id')
  @ApiOperation({ summary: 'Get a specific fraud alert' })
  async getAlert(@Param('id') id: string) {
    return this.fraudDetectionService.getAlert(id);
  }

  @Post('alerts')
  @ApiOperation({ summary: 'Create a manual fraud alert' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        type: { type: 'string', enum: Object.values(FraudType) },
        severity: { type: 'string', enum: Object.values(FraudSeverity) },
        title: { type: 'string' },
        description: { type: 'string' },
        metadata: { type: 'object' },
        riskScore: { type: 'number' },
      },
      required: ['type', 'severity', 'title', 'description'],
    },
  })
  async createAlert(
    @Body() body: {
      userId?: string;
      type: FraudType;
      severity: FraudSeverity;
      title: string;
      description: string;
      metadata?: any;
      riskScore?: number;
    },
  ) {
    return this.fraudDetectionService.createAlert(body);
  }

  @Put('alerts/:id/status')
  @ApiOperation({ summary: 'Update fraud alert status' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: Object.values(FraudAlertStatus) },
        resolution: { type: 'string' },
      },
      required: ['status'],
    },
  })
  async updateAlertStatus(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() body: { status: FraudAlertStatus; resolution?: string },
  ) {
    return this.fraudDetectionService.updateAlertStatus(
      id,
      body.status,
      user.id,
      body.resolution,
    );
  }

  @Put('alerts/:id/assign')
  @ApiOperation({ summary: 'Assign fraud alert to team member' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        assigneeId: { type: 'string' },
      },
      required: ['assigneeId'],
    },
  })
  async assignAlert(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() body: { assigneeId: string },
  ) {
    return this.fraudDetectionService.assignAlert(id, body.assigneeId, user.id);
  }

  @Post('alerts/:id/notes')
  @ApiOperation({ summary: 'Add note to fraud alert' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string' },
      },
      required: ['content'],
    },
  })
  async addNote(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() body: { content: string },
  ) {
    return this.fraudDetectionService.addNote(id, user.id, body.content);
  }

  @Post('alerts/:id/block-user')
  @ApiOperation({ summary: 'Block user from fraud alert' })
  async blockUser(@Param('id') id: string, @CurrentUser() user: User) {
    return this.fraudDetectionService.blockUser(id, user.id);
  }

  @Get('rules')
  @ApiOperation({ summary: 'Get fraud detection rules' })
  async getRules() {
    return this.fraudDetectionService.getFraudRules();
  }

  @Put('rules/:ruleId')
  @ApiOperation({ summary: 'Update fraud detection rule' })
  async updateRule(
    @Param('ruleId') ruleId: string,
    @Body() body: { enabled?: boolean; threshold?: number; severity?: FraudSeverity },
  ) {
    return this.fraudDetectionService.updateFraudRule(ruleId, body);
  }

  @Get('users/:userId/risk-profile')
  @ApiOperation({ summary: 'Get user risk profile' })
  async getUserRiskProfile(@Param('userId') userId: string) {
    return this.fraudDetectionService.getUserRiskProfile(userId);
  }

  @Post('scan')
  @ApiOperation({ summary: 'Run manual fraud detection scan' })
  async runScan() {
    await this.fraudDetectionService.runFraudDetection();
    return { success: true, message: 'Fraud detection scan completed' };
  }
}
