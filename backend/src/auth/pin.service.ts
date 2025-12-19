import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../database/entities/user.entity';

@Injectable()
export class PinService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Check if user has a PIN set
   */
  async hasPin(userId: string): Promise<{ hasPin: boolean; isPinEnabled: boolean }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'transactionPin', 'isPinEnabled'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      hasPin: !!user.transactionPin,
      isPinEnabled: user.isPinEnabled,
    };
  }

  /**
   * Set a new transaction PIN (first time)
   */
  async setPin(userId: string, pin: string): Promise<{ success: boolean; message: string }> {
    // Validate PIN format
    if (!this.isValidPin(pin)) {
      throw new BadRequestException('PIN must be exactly 4 digits');
    }

    // Check for weak PINs
    const weaknessError = this.checkPinWeakness(pin);
    if (weaknessError) {
      throw new BadRequestException(weaknessError);
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'transactionPin'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.transactionPin) {
      throw new BadRequestException('PIN already set. Use change PIN to update.');
    }

    // Hash the PIN
    const hashedPin = await bcrypt.hash(pin, 10);

    await this.userRepository.update(userId, {
      transactionPin: hashedPin,
      isPinEnabled: true,
    });

    return { success: true, message: 'Transaction PIN set successfully' };
  }

  /**
   * Change existing PIN
   */
  async changePin(
    userId: string,
    currentPin: string,
    newPin: string,
  ): Promise<{ success: boolean; message: string }> {
    // Validate new PIN format
    if (!this.isValidPin(newPin)) {
      throw new BadRequestException('New PIN must be exactly 4 digits');
    }

    // Check for weak PINs
    const weaknessError = this.checkPinWeakness(newPin);
    if (weaknessError) {
      throw new BadRequestException(weaknessError);
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'transactionPin'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.transactionPin) {
      throw new BadRequestException('No PIN set. Please set a PIN first.');
    }

    // Verify current PIN
    const isCurrentPinValid = await bcrypt.compare(currentPin, user.transactionPin);
    if (!isCurrentPinValid) {
      throw new UnauthorizedException('Current PIN is incorrect');
    }

    // Check if new PIN is same as current
    const isSamePin = await bcrypt.compare(newPin, user.transactionPin);
    if (isSamePin) {
      throw new BadRequestException('New PIN must be different from current PIN');
    }

    // Hash and save new PIN
    const hashedPin = await bcrypt.hash(newPin, 10);
    await this.userRepository.update(userId, { transactionPin: hashedPin });

    return { success: true, message: 'Transaction PIN changed successfully' };
  }

  /**
   * Verify PIN for transactions
   */
  async verifyPin(userId: string, pin: string): Promise<{ success: boolean; message: string }> {
    if (!pin || pin.length !== 4) {
      throw new BadRequestException('Invalid PIN format');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'transactionPin', 'isPinEnabled'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.transactionPin) {
      throw new BadRequestException('No PIN set');
    }

    const isPinValid = await bcrypt.compare(pin, user.transactionPin);
    if (!isPinValid) {
      throw new UnauthorizedException('Incorrect PIN');
    }

    return { success: true, message: 'PIN verified' };
  }

  /**
   * Reset PIN (after password verification)
   */
  async resetPin(
    userId: string,
    password: string,
    newPin: string,
  ): Promise<{ success: boolean; message: string }> {
    // Validate new PIN format
    if (!this.isValidPin(newPin)) {
      throw new BadRequestException('PIN must be exactly 4 digits');
    }

    // Check for weak PINs
    const weaknessError = this.checkPinWeakness(newPin);
    if (weaknessError) {
      throw new BadRequestException(weaknessError);
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'password'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Incorrect password');
    }

    // Hash and save new PIN
    const hashedPin = await bcrypt.hash(newPin, 10);
    await this.userRepository.update(userId, {
      transactionPin: hashedPin,
      isPinEnabled: true,
    });

    return { success: true, message: 'Transaction PIN reset successfully' };
  }

  /**
   * Remove/disable PIN
   */
  async removePin(userId: string, currentPin: string): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'transactionPin'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.transactionPin) {
      throw new BadRequestException('No PIN to remove');
    }

    // Verify current PIN
    const isPinValid = await bcrypt.compare(currentPin, user.transactionPin);
    if (!isPinValid) {
      throw new UnauthorizedException('Incorrect PIN');
    }

    await this.userRepository.update(userId, {
      transactionPin: null,
      isPinEnabled: false,
    });

    return { success: true, message: 'Transaction PIN removed' };
  }

  /**
   * Toggle PIN requirement for transactions
   */
  async togglePinEnabled(userId: string, enabled: boolean): Promise<{ success: boolean; isPinEnabled: boolean }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'transactionPin', 'isPinEnabled'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Cannot enable if no PIN set
    if (enabled && !user.transactionPin) {
      throw new BadRequestException('Please set a PIN before enabling PIN protection');
    }

    await this.userRepository.update(userId, { isPinEnabled: enabled });

    return { success: true, isPinEnabled: enabled };
  }

  /**
   * Validate PIN format (4 digits)
   */
  private isValidPin(pin: string): boolean {
    return /^\d{4}$/.test(pin);
  }

  /**
   * Check for weak PIN patterns
   */
  private checkPinWeakness(pin: string): string | null {
    // Check for all same digits (e.g., 1111, 0000)
    if (/^(\d)\1{3}$/.test(pin)) {
      return 'PIN cannot be all same digits';
    }

    // Check for sequential ascending
    const ascending = ['0123', '1234', '2345', '3456', '4567', '5678', '6789'];
    if (ascending.includes(pin)) {
      return 'PIN cannot be sequential numbers';
    }

    // Check for sequential descending
    const descending = ['9876', '8765', '7654', '6543', '5432', '4321', '3210'];
    if (descending.includes(pin)) {
      return 'PIN cannot be sequential numbers';
    }

    return null;
  }
}
