import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { VideoCallGateway } from './video-call.gateway';
import { Conversation, Message, User } from '../database/entities';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Conversation, Message, User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.accessSecret'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, VideoCallGateway],
  exports: [ChatService, ChatGateway, VideoCallGateway],
})
export class ChatModule {}
