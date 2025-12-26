import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User, AdminInvite, InviteStatus } from '../database/entities';
import { UserRole } from '../common/enums';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export interface CreateInviteDto {
  email: string;
  role: UserRole;
  name?: string;
}

export interface AcceptInviteDto {
  token: string;
  name: string;
  password: string;
  phone?: string;
}

export interface UpdateTeamMemberDto {
  role?: UserRole;
  isActive?: boolean;
}

const ADMIN_ROLES = [
  UserRole.ADMIN,
  UserRole.SUPERADMIN,
  UserRole.OPERATIONS,
  UserRole.FINANCE,
  UserRole.SUPPORT,
];

@Injectable()
export class AdminTeamService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AdminInvite)
    private readonly inviteRepository: Repository<AdminInvite>,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Get all admin team members
   */
  async getTeamMembers() {
    const members = await this.userRepository.find({
      where: {
        role: In(ADMIN_ROLES),
      },
      select: ['id', 'name', 'email', 'phone', 'role', 'avatar', 'isActive', 'createdAt', 'updatedAt'],
      order: {
        createdAt: 'DESC',
      },
    });

    return members;
  }

  /**
   * Get all pending invites
   */
  async getPendingInvites() {
    const invites = await this.inviteRepository.find({
      where: {
        status: InviteStatus.PENDING,
      },
      relations: ['invitedBy'],
      order: {
        createdAt: 'DESC',
      },
    });

    return invites.map(invite => ({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      status: invite.status,
      expiresAt: invite.expiresAt,
      createdAt: invite.createdAt,
      invitedBy: {
        id: invite.invitedBy?.id,
        name: invite.invitedBy?.name,
        email: invite.invitedBy?.email,
      },
    }));
  }

  /**
   * Invite a new team member
   */
  async inviteTeamMember(inviterId: string, dto: CreateInviteDto) {
    // Validate role
    if (!ADMIN_ROLES.includes(dto.role)) {
      throw new BadRequestException('Invalid admin role');
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      if (ADMIN_ROLES.includes(existingUser.role as UserRole)) {
        throw new ConflictException('This user is already a team member');
      }
      throw new ConflictException('A user with this email already exists');
    }

    // Check for existing pending invite
    const existingInvite = await this.inviteRepository.findOne({
      where: {
        email: dto.email,
        status: InviteStatus.PENDING,
      },
    });

    if (existingInvite) {
      throw new ConflictException('An invite has already been sent to this email');
    }

    // Create invite token
    const inviteToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create invite record
    const invite = this.inviteRepository.create({
      email: dto.email,
      role: dto.role,
      inviteToken,
      invitedById: inviterId,
      expiresAt,
      status: InviteStatus.PENDING,
    });

    await this.inviteRepository.save(invite);

    // Send invite email
    const inviteUrl = `${process.env.ADMIN_URL || 'http://localhost:3001'}/accept-invite?token=${inviteToken}`;
    
    try {
      await this.emailService.send({
        to: dto.email,
        subject: 'You\'ve been invited to join Handwork Admin Team',
        html: `
          <h2>Welcome to Handwork Admin Team!</h2>
          <p>You have been invited to join the Handwork admin team as <strong>${this.formatRole(dto.role)}</strong>.</p>
          <p>Click the button below to accept your invitation and set up your account:</p>
          <p style="margin: 24px 0;">
            <a href="${inviteUrl}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Accept Invitation
            </a>
          </p>
          <p>Or copy and paste this link: ${inviteUrl}</p>
          <p><small>This invitation expires in 7 days.</small></p>
        `,
      });
    } catch (error) {
      console.error('Failed to send invite email:', error);
      // Still return success - invite is created, email may have failed
    }

    return {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
      inviteUrl, // For development/testing
    };
  }

  /**
   * Accept an invite and create user account
   */
  async acceptInvite(dto: AcceptInviteDto) {
    const invite = await this.inviteRepository.findOne({
      where: {
        inviteToken: dto.token,
        status: InviteStatus.PENDING,
      },
    });

    if (!invite) {
      throw new NotFoundException('Invalid or expired invite');
    }

    if (new Date() > invite.expiresAt) {
      invite.status = InviteStatus.EXPIRED;
      await this.inviteRepository.save(invite);
      throw new BadRequestException('This invite has expired');
    }

    // Check if email is already taken
    const existingUser = await this.userRepository.findOne({
      where: { email: invite.email },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    // Create the user
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    
    const user = this.userRepository.create({
      email: invite.email,
      name: dto.name,
      phone: dto.phone || `+234${Date.now()}`, // Temporary phone if not provided
      password: hashedPassword,
      role: invite.role,
      isPhoneVerified: true,
      isEmailVerified: true,
      isActive: true,
    });

    await this.userRepository.save(user);

    // Update invite
    invite.status = InviteStatus.ACCEPTED;
    invite.acceptedById = user.id;
    invite.acceptedAt = new Date();
    await this.inviteRepository.save(invite);

    return {
      success: true,
      message: 'Account created successfully. You can now log in.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Resend an invite
   */
  async resendInvite(inviteId: string, inviterId: string) {
    const invite = await this.inviteRepository.findOne({
      where: { id: inviteId },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.status !== InviteStatus.PENDING) {
      throw new BadRequestException('Can only resend pending invites');
    }

    // Generate new token and extend expiry
    invite.inviteToken = uuidv4();
    invite.expiresAt = new Date();
    invite.expiresAt.setDate(invite.expiresAt.getDate() + 7);
    invite.invitedById = inviterId;

    await this.inviteRepository.save(invite);

    // Send email
    const inviteUrl = `${process.env.ADMIN_URL || 'http://localhost:3001'}/accept-invite?token=${invite.inviteToken}`;
    
    try {
      await this.emailService.send({
        to: invite.email,
        subject: 'Reminder: You\'ve been invited to join Handwork Admin Team',
        html: `
          <h2>Welcome to Handwork Admin Team!</h2>
          <p>This is a reminder that you have been invited to join the Handwork admin team as <strong>${this.formatRole(invite.role)}</strong>.</p>
          <p>Click the button below to accept your invitation and set up your account:</p>
          <p style="margin: 24px 0;">
            <a href="${inviteUrl}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Accept Invitation
            </a>
          </p>
          <p>Or copy and paste this link: ${inviteUrl}</p>
          <p><small>This invitation expires in 7 days.</small></p>
        `,
      });
    } catch (error) {
      console.error('Failed to send invite email:', error);
    }

    return {
      success: true,
      message: 'Invite resent successfully',
    };
  }

  /**
   * Cancel a pending invite
   */
  async cancelInvite(inviteId: string) {
    const invite = await this.inviteRepository.findOne({
      where: { id: inviteId },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.status !== InviteStatus.PENDING) {
      throw new BadRequestException('Can only cancel pending invites');
    }

    invite.status = InviteStatus.CANCELLED;
    await this.inviteRepository.save(invite);

    return {
      success: true,
      message: 'Invite cancelled',
    };
  }

  /**
   * Update a team member's role or status
   */
  async updateTeamMember(memberId: string, dto: UpdateTeamMemberDto, requesterId: string) {
    const member = await this.userRepository.findOne({
      where: { id: memberId },
    });

    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    if (!ADMIN_ROLES.includes(member.role as UserRole)) {
      throw new BadRequestException('User is not a team member');
    }

    // Prevent self-demotion
    if (memberId === requesterId && dto.role && dto.role !== member.role) {
      throw new BadRequestException('You cannot change your own role');
    }

    // Prevent self-deactivation
    if (memberId === requesterId && dto.isActive === false) {
      throw new BadRequestException('You cannot deactivate your own account');
    }

    if (dto.role) {
      if (!ADMIN_ROLES.includes(dto.role)) {
        throw new BadRequestException('Invalid admin role');
      }
      member.role = dto.role;
    }

    if (typeof dto.isActive === 'boolean') {
      member.isActive = dto.isActive;
    }

    await this.userRepository.save(member);

    return {
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      isActive: member.isActive,
    };
  }

  /**
   * Remove a team member (deactivate, not delete)
   */
  async removeTeamMember(memberId: string, requesterId: string) {
    if (memberId === requesterId) {
      throw new BadRequestException('You cannot remove yourself from the team');
    }

    const member = await this.userRepository.findOne({
      where: { id: memberId },
    });

    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    if (!ADMIN_ROLES.includes(member.role as UserRole)) {
      throw new BadRequestException('User is not a team member');
    }

    // Deactivate instead of delete
    member.isActive = false;
    member.role = UserRole.BUYER; // Demote to regular user
    await this.userRepository.save(member);

    return {
      success: true,
      message: 'Team member removed successfully',
    };
  }

  /**
   * Verify invite token (for accept-invite page)
   */
  async verifyInviteToken(token: string) {
    const invite = await this.inviteRepository.findOne({
      where: {
        inviteToken: token,
        status: InviteStatus.PENDING,
      },
    });

    if (!invite) {
      throw new NotFoundException('Invalid or expired invite');
    }

    if (new Date() > invite.expiresAt) {
      invite.status = InviteStatus.EXPIRED;
      await this.inviteRepository.save(invite);
      throw new BadRequestException('This invite has expired');
    }

    return {
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
    };
  }

  private formatRole(role: UserRole): string {
    const roleNames: Record<string, string> = {
      [UserRole.SUPERADMIN]: 'Super Admin',
      [UserRole.ADMIN]: 'Administrator',
      [UserRole.OPERATIONS]: 'Operations Manager',
      [UserRole.FINANCE]: 'Finance Manager',
      [UserRole.SUPPORT]: 'Support Agent',
    };
    return roleNames[role] || role;
  }
}
