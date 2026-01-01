import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { ChatbotConversation } from '../database/entities/chatbot-conversation.entity';
import { User } from '../database/entities/user.entity';
import { Order } from '../database/entities/order.entity';
import { Product } from '../database/entities/product.entity';
import { SupportModule } from '../support/support.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChatbotConversation,
      User,
      Order,
      Product,
    ]),
    forwardRef(() => SupportModule),
  ],
  controllers: [ChatbotController],
  providers: [ChatbotService],
  exports: [ChatbotService],
})
export class ChatbotModule {}
