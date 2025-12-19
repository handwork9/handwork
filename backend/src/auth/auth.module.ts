import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TwoFactorService } from './two-factor.service';
import { PinService } from './pin.service';
import { PinController } from './pin.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { OtpService } from './otp.service';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { User } from '../database/entities/user.entity';
import { OtpCode } from '../database/entities/otp-code.entity';
import { Session } from '../database/entities/session.entity';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, OtpCode, Session]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('jwt.accessSecret'),
        signOptions: {
          expiresIn: configService.get('jwt.accessExpiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    EmailModule,
    forwardRef(() => PaymentsModule),
  ],
  controllers: [AuthController, SessionsController, PinController],
  providers: [AuthService, OtpService, TwoFactorService, PinService, SessionsService, JwtStrategy, JwtRefreshStrategy, LocalStrategy],
  exports: [AuthService, TwoFactorService, PinService, SessionsService],
})
export class AuthModule {}
