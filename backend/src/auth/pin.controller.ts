import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PinService } from './pin.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('PIN')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pin')
export class PinController {
  constructor(private readonly pinService: PinService) {}

  @Get('status')
  @ApiOperation({ summary: 'Check if user has a PIN set' })
  @ApiResponse({ status: 200, description: 'PIN status returned' })
  async getPinStatus(@CurrentUser('id') userId: string) {
    return this.pinService.hasPin(userId);
  }

  @Post('set')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set a new transaction PIN (first time)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        pin: { type: 'string', example: '1234', description: '4-digit PIN' },
      },
      required: ['pin'],
    },
  })
  @ApiResponse({ status: 200, description: 'PIN set successfully' })
  @ApiResponse({ status: 400, description: 'Invalid PIN or PIN already set' })
  async setPin(
    @CurrentUser('id') userId: string,
    @Body() body: { pin: string },
  ) {
    return this.pinService.setPin(userId, body.pin);
  }

  @Post('change')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change existing PIN' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        currentPin: { type: 'string', example: '1234', description: 'Current 4-digit PIN' },
        newPin: { type: 'string', example: '5678', description: 'New 4-digit PIN' },
      },
      required: ['currentPin', 'newPin'],
    },
  })
  @ApiResponse({ status: 200, description: 'PIN changed successfully' })
  @ApiResponse({ status: 401, description: 'Current PIN is incorrect' })
  async changePin(
    @CurrentUser('id') userId: string,
    @Body() body: { currentPin: string; newPin: string },
  ) {
    return this.pinService.changePin(userId, body.currentPin, body.newPin);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify PIN for transactions' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        pin: { type: 'string', example: '1234', description: '4-digit PIN' },
      },
      required: ['pin'],
    },
  })
  @ApiResponse({ status: 200, description: 'PIN verified' })
  @ApiResponse({ status: 401, description: 'Incorrect PIN' })
  async verifyPin(
    @CurrentUser('id') userId: string,
    @Body() body: { pin: string },
  ) {
    return this.pinService.verifyPin(userId, body.pin);
  }

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset PIN using password verification' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        password: { type: 'string', description: 'Account password for verification' },
        newPin: { type: 'string', example: '5678', description: 'New 4-digit PIN' },
      },
      required: ['password', 'newPin'],
    },
  })
  @ApiResponse({ status: 200, description: 'PIN reset successfully' })
  @ApiResponse({ status: 401, description: 'Incorrect password' })
  async resetPin(
    @CurrentUser('id') userId: string,
    @Body() body: { password: string; newPin: string },
  ) {
    return this.pinService.resetPin(userId, body.password, body.newPin);
  }

  @Post('remove')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove/disable transaction PIN' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        pin: { type: 'string', example: '1234', description: 'Current 4-digit PIN' },
      },
      required: ['pin'],
    },
  })
  @ApiResponse({ status: 200, description: 'PIN removed' })
  @ApiResponse({ status: 401, description: 'Incorrect PIN' })
  async removePin(
    @CurrentUser('id') userId: string,
    @Body() body: { pin: string },
  ) {
    return this.pinService.removePin(userId, body.pin);
  }

  @Post('toggle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle PIN requirement for transactions' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean', description: 'Enable or disable PIN requirement' },
      },
      required: ['enabled'],
    },
  })
  @ApiResponse({ status: 200, description: 'PIN setting updated' })
  async togglePinEnabled(
    @CurrentUser('id') userId: string,
    @Body() body: { enabled: boolean },
  ) {
    return this.pinService.togglePinEnabled(userId, body.enabled);
  }
}
