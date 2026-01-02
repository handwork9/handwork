import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { WhatsAppService } from './whatsapp.service';

@ApiTags('WhatsApp Integration')
@Controller('integrations/whatsapp')
export class WhatsAppController {
  constructor(private readonly whatsAppService: WhatsAppService) {}

  @Post('send-message')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a WhatsApp text message (Admin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        phone: { type: 'string', example: '+2348012345678' },
        message: { type: 'string', example: 'Hello from Handwork!' },
      },
      required: ['phone', 'message'],
    },
  })
  async sendTextMessage(@Body() body: { phone: string; message: string }) {
    const success = await this.whatsAppService.sendTextMessage(body.phone, body.message);
    return { success, message: success ? 'Message sent' : 'Failed to send message' };
  }

  @Post('send-template')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a WhatsApp template message (Admin only)' })
  async sendTemplateMessage(
    @Body()
    body: {
      phone: string;
      templateName: string;
      languageCode: string;
      components?: any[];
    },
  ) {
    const success = await this.whatsAppService.sendTemplateMessage({
      to: body.phone,
      templateName: body.templateName,
      languageCode: body.languageCode,
      components: body.components,
    });
    return { success, message: success ? 'Template sent' : 'Failed to send template' };
  }

  @Post('send-promo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send promotional WhatsApp message (Admin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        phone: { type: 'string', example: '+2348012345678' },
        promoTitle: { type: 'string', example: 'Flash Sale!' },
        promoDescription: { type: 'string', example: 'Get 20% off all vegetables!' },
        discountCode: { type: 'string', example: 'FLASH20' },
        expiryDate: { type: 'string', example: '2026-01-10' },
      },
      required: ['phone', 'promoTitle', 'promoDescription'],
    },
  })
  async sendPromoMessage(
    @Body()
    body: {
      phone: string;
      promoTitle: string;
      promoDescription: string;
      discountCode?: string;
      expiryDate?: string;
    },
  ) {
    const success = await this.whatsAppService.sendPromoMessage(
      body.phone,
      body.promoTitle,
      body.promoDescription,
      body.discountCode,
      body.expiryDate,
    );
    return { success, message: success ? 'Promo message sent' : 'Failed to send promo' };
  }

  @Post('send-bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send bulk WhatsApp messages (Admin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        phones: { type: 'array', items: { type: 'string' }, example: ['+2348012345678'] },
        message: { type: 'string', example: 'Hello from Handwork!' },
        batchSize: { type: 'number', example: 50 },
      },
      required: ['phones', 'message'],
    },
  })
  async sendBulkMessages(
    @Body()
    body: {
      phones: string[];
      message: string;
      batchSize?: number;
    },
  ) {
    const result = await this.whatsAppService.sendBulkMessages(
      body.phones,
      body.message,
      body.batchSize,
    );
    return {
      success: true,
      sent: result.success,
      failed: result.failed,
      total: body.phones.length,
    };
  }

  @Post('support/greeting')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send support greeting with options menu' })
  async sendSupportGreeting(@Req() req: any) {
    const user = req.user;
    const phone = user.phone || user.phoneNumber;
    if (!phone) {
      return { success: false, message: 'User phone number not found' };
    }

    const success = await this.whatsAppService.sendSupportGreeting(
      phone,
      user.firstName || user.name || 'Customer',
    );
    return { success, message: success ? 'Support greeting sent' : 'Failed to send greeting' };
  }

  // ============ Webhook Endpoints ============

  @Get('webhook')
  @ApiOperation({ summary: 'WhatsApp webhook verification endpoint' })
  @ApiQuery({ name: 'hub.mode', required: true })
  @ApiQuery({ name: 'hub.verify_token', required: true })
  @ApiQuery({ name: 'hub.challenge', required: true })
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'handwork_verify_token';

    if (mode === 'subscribe' && token === verifyToken) {
      return parseInt(challenge, 10);
    }

    return 'Verification failed';
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'WhatsApp webhook for incoming messages' })
  async handleWebhook(@Body() body: any) {
    const result = await this.whatsAppService.handleWebhook(body);
    
    if (result) {
      // Process the incoming message/status
      console.log('WhatsApp webhook received:', result.type, result.data);
      
      // Here you could:
      // - Forward to support system
      // - Auto-reply to common queries
      // - Update order status based on button clicks
      // - Log for analytics
    }

    return 'OK';
  }
}
