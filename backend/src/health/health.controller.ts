import { Controller, Get, Param, Post } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities';
import { UserRole } from '../common/enums';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
  })
  check() {
    // Simple health check - just return OK if app is running
    // Full health check available at /health/ready
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'handwork-api'
    };
  }

  @Get('live')
  @Public()
  @ApiOperation({ summary: 'Liveness probe for Kubernetes' })
  @ApiResponse({
    status: 200,
    description: 'Service is alive',
  })
  liveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  @Public()
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe for Kubernetes' })
  @ApiResponse({
    status: 200,
    description: 'Service is ready to receive traffic',
  })
  @ApiResponse({
    status: 503,
    description: 'Service is not ready',
  })
  readiness() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }

  @Get('smtp')
  @Public()
  @ApiOperation({ summary: 'Check SMTP configuration status' })
  smtp() {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');
    
    return {
      configured: !!(smtpHost && smtpUser && smtpPass),
      host: smtpHost ? 'set' : 'missing',
      user: smtpUser ? smtpUser.substring(0, 5) + '***' : 'missing',
      pass: smtpPass ? 'set (hidden)' : 'missing',
    };
  }

  @Post('setup-admin/:email/:secret')
  @Public()
  @ApiOperation({ summary: 'One-time setup to create admin user' })
  async setupAdmin(@Param('email') email: string, @Param('secret') secret: string) {
    // Security: require a secret to prevent abuse
    const setupSecret = this.configService.get<string>('SETUP_SECRET') || 'handwork-setup-2024';
    if (secret !== setupSecret) {
      return { error: 'Invalid secret' };
    }

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      return { error: 'User not found' };
    }

    user.role = UserRole.SUPERADMIN;
    await this.userRepository.save(user);

    return { 
      success: true, 
      message: `User ${email} promoted to superadmin`,
      role: user.role 
    };
  }
}
