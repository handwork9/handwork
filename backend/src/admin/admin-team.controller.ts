import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { AdminTeamService, CreateInviteDto, AcceptInviteDto, UpdateTeamMemberDto } from './admin-team.service';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; role: string };
}

@ApiTags('Admin Team')
@Controller('admin/team')
export class AdminTeamController {
  constructor(private readonly teamService: AdminTeamService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all team members' })
  async getTeamMembers() {
    const members = await this.teamService.getTeamMembers();
    return {
      success: true,
      data: members,
    };
  }

  @Get('invites')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pending invites' })
  async getPendingInvites() {
    const invites = await this.teamService.getPendingInvites();
    return {
      success: true,
      data: invites,
    };
  }

  @Post('invite')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invite a new team member' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'newadmin@handwork.ng' },
        role: { type: 'string', enum: ['admin', 'superadmin', 'operations', 'finance', 'support'] },
      },
      required: ['email', 'role'],
    },
  })
  async inviteTeamMember(@Request() req: AuthenticatedRequest, @Body() dto: CreateInviteDto) {
    const result = await this.teamService.inviteTeamMember(req.user.id, dto);
    return {
      success: true,
      data: result,
      message: 'Invitation sent successfully',
    };
  }

  @Get('invite/verify')
  @ApiOperation({ summary: 'Verify an invite token' })
  @ApiQuery({ name: 'token', required: true })
  async verifyInviteToken(@Query('token') token: string) {
    const result = await this.teamService.verifyInviteToken(token);
    return {
      success: true,
      data: result,
    };
  }

  @Post('invite/accept')
  @ApiOperation({ summary: 'Accept an invite and create account' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string' },
        name: { type: 'string', example: 'John Doe' },
        password: { type: 'string', example: 'SecurePassword123!' },
        phone: { type: 'string', example: '+2348012345678' },
      },
      required: ['token', 'name', 'password'],
    },
  })
  async acceptInvite(@Body() dto: AcceptInviteDto) {
    const result = await this.teamService.acceptInvite(dto);
    return {
      success: true,
      data: result,
      message: 'Account created successfully',
    };
  }

  @Post('invite/:inviteId/resend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend an invite' })
  @ApiParam({ name: 'inviteId', required: true })
  async resendInvite(@Request() req: AuthenticatedRequest, @Param('inviteId') inviteId: string) {
    const result = await this.teamService.resendInvite(inviteId, req.user.id);
    return {
      success: true,
      data: result,
      message: 'Invitation resent successfully',
    };
  }

  @Delete('invite/:inviteId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a pending invite' })
  @ApiParam({ name: 'inviteId', required: true })
  async cancelInvite(@Param('inviteId') inviteId: string) {
    const result = await this.teamService.cancelInvite(inviteId);
    return {
      success: true,
      data: result,
      message: 'Invitation cancelled',
    };
  }

  @Patch(':memberId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a team member\'s role or status' })
  @ApiParam({ name: 'memberId', required: true })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        role: { type: 'string', enum: ['admin', 'superadmin', 'operations', 'finance', 'support'] },
        isActive: { type: 'boolean' },
      },
    },
  })
  async updateTeamMember(
    @Request() req: AuthenticatedRequest,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateTeamMemberDto,
  ) {
    const result = await this.teamService.updateTeamMember(memberId, dto, req.user.id);
    return {
      success: true,
      data: result,
      message: 'Team member updated successfully',
    };
  }

  @Delete(':memberId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a team member' })
  @ApiParam({ name: 'memberId', required: true })
  async removeTeamMember(@Request() req: AuthenticatedRequest, @Param('memberId') memberId: string) {
    const result = await this.teamService.removeTeamMember(memberId, req.user.id);
    return {
      success: true,
      data: result,
      message: 'Team member removed',
    };
  }
}
