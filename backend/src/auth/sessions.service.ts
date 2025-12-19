import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Session, DeviceType } from '../database/entities/session.entity';
import * as bcrypt from 'bcrypt';

export interface CreateSessionDto {
  userId: string;
  deviceName?: string;
  deviceType?: DeviceType;
  os?: string;
  osVersion?: string;
  appVersion?: string;
  ip?: string;
  location?: string;
  refreshToken: string;
}

export interface SessionResponseDto {
  id: string;
  device: string;
  deviceType: DeviceType;
  os: string;
  location: string;
  ip: string;
  lastActive: Date;
  isCurrent: boolean;
  createdAt: Date;
}

export interface LoginActivityDto {
  id: string;
  device: string;
  deviceType: DeviceType;
  location: string;
  ip: string;
  timestamp: Date;
  status: 'success' | 'failed' | 'blocked';
}

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}

  async createSession(dto: CreateSessionDto): Promise<Session> {
    // Hash the refresh token before storing
    const hashedToken = await bcrypt.hash(dto.refreshToken, 10);
    
    const session = this.sessionRepository.create({
      userId: dto.userId,
      deviceName: dto.deviceName || 'Unknown Device',
      deviceType: dto.deviceType || DeviceType.UNKNOWN,
      os: dto.os || 'Unknown',
      osVersion: dto.osVersion,
      appVersion: dto.appVersion,
      ip: this.maskIp(dto.ip),
      location: dto.location || 'Unknown Location',
      refreshToken: hashedToken,
      lastActiveAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    return this.sessionRepository.save(session);
  }

  async findUserSessions(userId: string): Promise<Session[]> {
    return this.sessionRepository.find({
      where: { userId, isActive: true },
      order: { lastActiveAt: 'DESC' },
    });
  }

  async findLoginHistory(userId: string, limit: number = 20): Promise<Session[]> {
    return this.sessionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findSessionById(id: string): Promise<Session | null> {
    return this.sessionRepository.findOne({ where: { id } });
  }

  async findSessionByToken(userId: string, refreshToken: string): Promise<Session | null> {
    const sessions = await this.sessionRepository.find({
      where: { userId, isActive: true },
    });

    for (const session of sessions) {
      if (session.refreshToken) {
        const isMatch = await bcrypt.compare(refreshToken, session.refreshToken);
        if (isMatch) {
          return session;
        }
      }
    }
    return null;
  }

  async updateSessionActivity(sessionId: string): Promise<void> {
    await this.sessionRepository.update(sessionId, {
      lastActiveAt: new Date(),
    });
  }

  async updateSessionToken(sessionId: string, refreshToken: string): Promise<void> {
    const hashedToken = await bcrypt.hash(refreshToken, 10);
    await this.sessionRepository.update(sessionId, {
      refreshToken: hashedToken,
      lastActiveAt: new Date(),
    });
  }

  async endSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await this.sessionRepository.update(sessionId, {
      isActive: false,
      refreshToken: null,
    });
  }

  async endAllOtherSessions(userId: string, currentSessionId: string): Promise<number> {
    const result = await this.sessionRepository.update(
      { userId, id: Not(currentSessionId), isActive: true },
      { isActive: false, refreshToken: null },
    );

    return result.affected || 0;
  }

  async endAllSessions(userId: string): Promise<number> {
    const result = await this.sessionRepository.update(
      { userId, isActive: true },
      { isActive: false, refreshToken: null },
    );

    return result.affected || 0;
  }

  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.sessionRepository
      .createQueryBuilder()
      .update(Session)
      .set({ isActive: false })
      .where('expiresAt < :now', { now: new Date() })
      .andWhere('isActive = :active', { active: true })
      .execute();

    return result.affected || 0;
  }

  formatSessionResponse(session: Session, currentSessionId?: string): SessionResponseDto {
    return {
      id: session.id,
      device: session.deviceName || 'Unknown Device',
      deviceType: session.deviceType,
      os: session.os ? `${session.os}${session.osVersion ? ' ' + session.osVersion : ''}` : 'Unknown',
      location: session.location || 'Unknown Location',
      ip: session.ip || 'Unknown',
      lastActive: session.lastActiveAt || session.createdAt,
      isCurrent: currentSessionId ? session.id === currentSessionId : false,
      createdAt: session.createdAt,
    };
  }

  formatLoginActivityResponse(session: Session): LoginActivityDto {
    // Determine status based on session state
    let status: 'success' | 'failed' | 'blocked' = 'success';
    // Note: For now all sessions are successful logins. 
    // Failed/blocked would require tracking failed login attempts separately.
    
    return {
      id: session.id,
      device: session.deviceName || 'Unknown Device',
      deviceType: session.deviceType,
      location: session.location || 'Unknown Location',
      ip: session.ip || 'Unknown',
      timestamp: session.createdAt,
      status,
    };
  }

  private maskIp(ip?: string): string {
    if (!ip) return 'Unknown';
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.xxx.xxx`;
    }
    return ip;
  }
}
