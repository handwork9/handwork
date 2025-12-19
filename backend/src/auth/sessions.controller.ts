import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SessionsService } from './sessions.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active sessions for current user' })
  @ApiResponse({ status: 200, description: 'List of active sessions' })
  async getSessions(@CurrentUser('id') userId: string, @Req() req: any) {
    const sessions = await this.sessionsService.findUserSessions(userId);
    const currentSessionId = req.user?.sessionId;
    
    return {
      sessions: sessions.map(session => 
        this.sessionsService.formatSessionResponse(session, currentSessionId)
      ),
    };
  }

  @Get('login-history')
  @ApiOperation({ summary: 'Get login history for current user' })
  @ApiResponse({ status: 200, description: 'List of login activities' })
  async getLoginHistory(@CurrentUser('id') userId: string) {
    const sessions = await this.sessionsService.findLoginHistory(userId, 50);
    
    return {
      activities: sessions.map(session => 
        this.sessionsService.formatLoginActivityResponse(session)
      ),
    };
  }

  @Delete(':sessionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'End a specific session' })
  @ApiResponse({ status: 200, description: 'Session ended successfully' })
  async endSession(
    @CurrentUser('id') userId: string,
    @Param('sessionId') sessionId: string,
    @Req() req: any,
  ) {
    const currentSessionId = req.user?.sessionId;
    
    // Check if user is trying to end their current session
    if (sessionId === currentSessionId) {
      await this.sessionsService.endSession(sessionId, userId);
      return { 
        message: 'Current session ended. You will be logged out.',
        loggedOut: true,
      };
    }
    
    await this.sessionsService.endSession(sessionId, userId);
    return { message: 'Session ended successfully' };
  }

  @Post('end-all-others')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'End all sessions except the current one' })
  @ApiResponse({ status: 200, description: 'All other sessions ended' })
  async endAllOtherSessions(@CurrentUser('id') userId: string, @Req() req: any) {
    const currentSessionId = req.user?.sessionId;
    
    if (!currentSessionId) {
      // If no session tracking, end all sessions
      const count = await this.sessionsService.endAllSessions(userId);
      return { 
        message: `Ended ${count} session(s)`,
        endedCount: count,
      };
    }
    
    const count = await this.sessionsService.endAllOtherSessions(userId, currentSessionId);
    return { 
      message: `Ended ${count} other session(s)`,
      endedCount: count,
    };
  }

  @Post('end-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'End all sessions (log out everywhere)' })
  @ApiResponse({ status: 200, description: 'All sessions ended' })
  async endAllSessions(@CurrentUser('id') userId: string) {
    const count = await this.sessionsService.endAllSessions(userId);
    return { 
      message: 'All sessions ended. You will be logged out everywhere.',
      endedCount: count,
      loggedOut: true,
    };
  }
}
