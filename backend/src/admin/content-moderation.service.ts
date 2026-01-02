import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import {
  ContentModeration,
  ContentType,
  ModerationStatus,
  ModerationReason,
  ModerationPriority,
} from '../database/entities/content-moderation.entity';
import { User, Product, Review, SocialPost, FarmStory, PostComment } from '../database/entities';

export interface ModerationStats {
  totalItems: number;
  pendingItems: number;
  approvedItems: number;
  rejectedItems: number;
  flaggedItems: number;
  itemsByType: { type: string; count: number }[];
  itemsByPriority: { priority: string; count: number }[];
  recentItems: ContentModeration[];
  moderationTrend: { date: string; approved: number; rejected: number }[];
}

// Banned words list for auto-moderation
const BANNED_WORDS = [
  'scam', 'fraud', 'fake', 'spam', 'illegal', 'drug', 'weapon',
  // Add more as needed
];

const SUSPICIOUS_PATTERNS = [
  /\b(buy|sell)\s*(follower|like|review)/i,
  /\bfree\s*money\b/i,
  /\b(whatsapp|telegram)\s*\+?\d/i,
  /click\s*(here|this)\s*link/i,
  /100%\s*(guaranteed|profit)/i,
];

@Injectable()
export class ContentModerationService {
  private readonly logger = new Logger(ContentModerationService.name);

  constructor(
    @InjectRepository(ContentModeration)
    private readonly moderationRepository: Repository<ContentModeration>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(SocialPost)
    private readonly socialPostRepository: Repository<SocialPost>,
    @InjectRepository(FarmStory)
    private readonly farmStoryRepository: Repository<FarmStory>,
    @InjectRepository(PostComment)
    private readonly postCommentRepository: Repository<PostComment>,
  ) {}

  /**
   * Get moderation dashboard stats
   */
  async getModerationStats(startDate?: Date, endDate?: Date): Promise<ModerationStats> {
    const dateFilter = startDate && endDate
      ? { createdAt: Between(startDate, endDate) }
      : {};

    const [
      totalItems,
      pendingItems,
      approvedItems,
      rejectedItems,
      flaggedItems,
      itemsByType,
      itemsByPriority,
      recentItems,
      moderationTrend,
    ] = await Promise.all([
      this.moderationRepository.count({ where: dateFilter }),
      this.moderationRepository.count({ 
        where: { ...dateFilter, status: In([ModerationStatus.PENDING, ModerationStatus.UNDER_REVIEW]) } 
      }),
      this.moderationRepository.count({ 
        where: { ...dateFilter, status: In([ModerationStatus.APPROVED, ModerationStatus.AUTO_APPROVED]) } 
      }),
      this.moderationRepository.count({ 
        where: { ...dateFilter, status: In([ModerationStatus.REJECTED, ModerationStatus.AUTO_REJECTED]) } 
      }),
      this.moderationRepository.count({ 
        where: { ...dateFilter, status: ModerationStatus.FLAGGED } 
      }),
      this.getItemsByType(startDate, endDate),
      this.getItemsByPriority(startDate, endDate),
      this.moderationRepository.find({
        where: { ...dateFilter, status: In([ModerationStatus.PENDING, ModerationStatus.FLAGGED]) },
        relations: ['author', 'reportedBy'],
        order: { priority: 'DESC', createdAt: 'DESC' },
        take: 10,
      }),
      this.getModerationTrend(startDate, endDate),
    ]);

    return {
      totalItems,
      pendingItems,
      approvedItems,
      rejectedItems,
      flaggedItems,
      itemsByType,
      itemsByPriority,
      recentItems,
      moderationTrend,
    };
  }

  private async getItemsByType(startDate?: Date, endDate?: Date) {
    const query = this.moderationRepository
      .createQueryBuilder('mod')
      .select('mod.contentType', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('mod.contentType');

    if (startDate && endDate) {
      query.where('mod.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    return query.getRawMany();
  }

  private async getItemsByPriority(startDate?: Date, endDate?: Date) {
    const query = this.moderationRepository
      .createQueryBuilder('mod')
      .select('mod.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .where('mod.status IN (:...statuses)', { 
        statuses: [ModerationStatus.PENDING, ModerationStatus.FLAGGED, ModerationStatus.UNDER_REVIEW] 
      })
      .groupBy('mod.priority');

    if (startDate && endDate) {
      query.andWhere('mod.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    return query.getRawMany();
  }

  private async getModerationTrend(startDate?: Date, endDate?: Date) {
    const query = this.moderationRepository
      .createQueryBuilder('mod')
      .select("DATE(mod.reviewedAt)", 'date')
      .addSelect("SUM(CASE WHEN mod.status IN ('approved', 'auto_approved') THEN 1 ELSE 0 END)", 'approved')
      .addSelect("SUM(CASE WHEN mod.status IN ('rejected', 'auto_rejected') THEN 1 ELSE 0 END)", 'rejected')
      .where('mod.reviewedAt IS NOT NULL')
      .groupBy("DATE(mod.reviewedAt)")
      .orderBy('date', 'ASC');

    if (startDate && endDate) {
      query.andWhere('mod.reviewedAt BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    return query.getRawMany();
  }

  /**
   * Get moderation queue
   */
  async getModerationQueue(
    page: number = 1,
    limit: number = 20,
    contentType?: ContentType,
    status?: ModerationStatus,
    priority?: ModerationPriority,
  ) {
    const where: any = {};
    if (contentType) where.contentType = contentType;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    // Default to pending items
    if (!status) {
      where.status = In([ModerationStatus.PENDING, ModerationStatus.FLAGGED, ModerationStatus.UNDER_REVIEW]);
    }

    const [items, total] = await this.moderationRepository.findAndCount({
      where,
      relations: ['author', 'reportedBy', 'reviewedBy'],
      order: { priority: 'DESC', createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a moderation item
   */
  async getModerationItem(id: string): Promise<ContentModeration> {
    const item = await this.moderationRepository.findOne({
      where: { id },
      relations: ['author', 'reportedBy', 'reviewedBy'],
    });

    if (!item) {
      throw new NotFoundException('Moderation item not found');
    }

    return item;
  }

  /**
   * Submit content for moderation
   */
  async submitForModeration(data: {
    contentType: ContentType;
    contentId: string;
    authorId: string;
    title?: string;
    contentPreview?: string;
    contentSnapshot?: any;
    reportedById?: string;
    reportReason?: string;
  }): Promise<ContentModeration> {
    // Check if already in moderation
    const existing = await this.moderationRepository.findOne({
      where: {
        contentType: data.contentType,
        contentId: data.contentId,
        status: In([ModerationStatus.PENDING, ModerationStatus.UNDER_REVIEW]),
      },
    });

    if (existing) {
      // Update report count
      if (data.reportedById) {
        const reportCount = (existing.metadata.reportCount || 0) + 1;
        existing.metadata = {
          ...existing.metadata,
          reportCount,
          reporterIds: [...(existing.metadata.reporterIds || []), data.reportedById],
        };

        // Increase priority if multiple reports
        if (reportCount >= 3) {
          existing.priority = ModerationPriority.HIGH;
        }
        if (reportCount >= 5) {
          existing.priority = ModerationPriority.URGENT;
        }

        return this.moderationRepository.save(existing);
      }
      return existing;
    }

    // Auto-moderation check
    const autoModResult = this.runAutoModeration(data.contentPreview || '', data.contentSnapshot);

    const moderationItem = this.moderationRepository.create({
      ...data,
      status: autoModResult.shouldReject 
        ? ModerationStatus.AUTO_REJECTED 
        : autoModResult.shouldFlag 
          ? ModerationStatus.FLAGGED 
          : ModerationStatus.PENDING,
      priority: autoModResult.priority,
      autoDetected: autoModResult.shouldFlag || autoModResult.shouldReject,
      metadata: {
        reportCount: data.reportedById ? 1 : 0,
        reporterIds: data.reportedById ? [data.reportedById] : [],
        aiScore: autoModResult.score,
        flaggedKeywords: autoModResult.flaggedKeywords,
        autoModResult,
      },
    });

    const saved = await this.moderationRepository.save(moderationItem);

    // If auto-rejected, take action
    if (autoModResult.shouldReject) {
      await this.takeContentAction(saved, 'remove');
    }

    return saved;
  }

  /**
   * Run auto-moderation on content
   */
  private runAutoModeration(text: string, snapshot?: any): {
    shouldReject: boolean;
    shouldFlag: boolean;
    score: number;
    priority: ModerationPriority;
    flaggedKeywords: string[];
    reasons: string[];
  } {
    const result = {
      shouldReject: false,
      shouldFlag: false,
      score: 0,
      priority: ModerationPriority.MEDIUM,
      flaggedKeywords: [] as string[],
      reasons: [] as string[],
    };

    const lowerText = text.toLowerCase();

    // Check for banned words
    for (const word of BANNED_WORDS) {
      if (lowerText.includes(word)) {
        result.flaggedKeywords.push(word);
        result.score += 20;
        result.reasons.push(`Contains banned word: ${word}`);
      }
    }

    // Check for suspicious patterns
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(text)) {
        result.score += 30;
        result.shouldFlag = true;
        result.reasons.push('Matches suspicious pattern');
      }
    }

    // Check for excessive caps
    const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    if (capsRatio > 0.5 && text.length > 20) {
      result.score += 10;
      result.reasons.push('Excessive capitalization');
    }

    // Check for excessive special characters
    const specialCharRatio = (text.match(/[!@#$%^&*]/g) || []).length / text.length;
    if (specialCharRatio > 0.1) {
      result.score += 10;
      result.reasons.push('Excessive special characters');
    }

    // Determine action based on score
    if (result.score >= 70) {
      result.shouldReject = true;
      result.priority = ModerationPriority.URGENT;
    } else if (result.score >= 40) {
      result.shouldFlag = true;
      result.priority = ModerationPriority.HIGH;
    } else if (result.score >= 20) {
      result.shouldFlag = true;
      result.priority = ModerationPriority.MEDIUM;
    }

    return result;
  }

  /**
   * Approve content
   */
  async approveContent(
    id: string,
    adminId: string,
    notes?: string,
  ): Promise<ContentModeration> {
    const item = await this.getModerationItem(id);
    const admin = await this.userRepository.findOne({ where: { id: adminId } });

    item.status = ModerationStatus.APPROVED;
    item.reviewedById = adminId;
    item.reviewedAt = new Date();
    if (notes) item.reviewNotes = notes;

    item.history.push({
      action: 'approved',
      performedById: adminId,
      performedByName: admin?.fullName || 'Admin',
      details: notes || 'Content approved',
      timestamp: new Date(),
    });

    // Restore content if it was removed
    if (item.contentRemoved) {
      await this.takeContentAction(item, 'restore');
      item.contentRemoved = false;
    }

    return this.moderationRepository.save(item);
  }

  /**
   * Reject content
   */
  async rejectContent(
    id: string,
    adminId: string,
    reason: ModerationReason,
    notes?: string,
    removeContent: boolean = true,
    warnUser: boolean = false,
    suspendUser: boolean = false,
  ): Promise<ContentModeration> {
    const item = await this.getModerationItem(id);
    const admin = await this.userRepository.findOne({ where: { id: adminId } });

    item.status = ModerationStatus.REJECTED;
    item.reason = reason;
    item.reviewedById = adminId;
    item.reviewedAt = new Date();
    if (notes) item.reviewNotes = notes;

    const actions: string[] = ['Content rejected'];

    if (removeContent) {
      await this.takeContentAction(item, 'remove');
      item.contentRemoved = true;
      item.actionTaken = 'Content removed';
      actions.push('content removed');
    }

    if (warnUser && item.authorId) {
      // Send warning notification
      item.userWarned = true;
      actions.push('user warned');
    }

    if (suspendUser && item.authorId) {
      await this.userRepository.update(item.authorId, { isActive: false });
      item.userSuspended = true;
      actions.push('user suspended');
    }

    item.history.push({
      action: 'rejected',
      performedById: adminId,
      performedByName: admin?.fullName || 'Admin',
      details: `${notes || 'Content rejected'} (${actions.join(', ')})`,
      timestamp: new Date(),
    });

    return this.moderationRepository.save(item);
  }

  /**
   * Flag content for review
   */
  async flagContent(
    id: string,
    adminId: string,
    priority: ModerationPriority,
    notes?: string,
  ): Promise<ContentModeration> {
    const item = await this.getModerationItem(id);
    const admin = await this.userRepository.findOne({ where: { id: adminId } });

    item.status = ModerationStatus.FLAGGED;
    item.priority = priority;

    item.history.push({
      action: 'flagged',
      performedById: adminId,
      performedByName: admin?.fullName || 'Admin',
      details: notes || `Flagged with ${priority} priority`,
      timestamp: new Date(),
    });

    return this.moderationRepository.save(item);
  }

  /**
   * Take action on content
   */
  private async takeContentAction(
    item: ContentModeration,
    action: 'remove' | 'restore',
  ): Promise<void> {
    const isAvailable = action === 'restore';

    switch (item.contentType) {
      case ContentType.PRODUCT:
        await this.productRepository.update(item.contentId, { isAvailable });
        break;
      case ContentType.REVIEW:
        // Soft delete review
        if (action === 'remove') {
          await this.reviewRepository.softDelete(item.contentId);
        } else {
          await this.reviewRepository.restore(item.contentId);
        }
        break;
      case ContentType.SOCIAL_POST:
        if (action === 'remove') {
          await this.socialPostRepository.softDelete(item.contentId);
        } else {
          await this.socialPostRepository.restore(item.contentId);
        }
        break;
      case ContentType.FARM_STORY:
        await this.farmStoryRepository.update(item.contentId, { isActive: isAvailable });
        break;
      case ContentType.COMMENT:
        if (action === 'remove') {
          await this.postCommentRepository.softDelete(item.contentId);
        } else {
          await this.postCommentRepository.restore(item.contentId);
        }
        break;
    }
  }

  /**
   * Report content
   */
  async reportContent(
    contentType: ContentType,
    contentId: string,
    reporterId: string,
    reason: string,
  ): Promise<ContentModeration> {
    // Get content details
    let content: any;
    let authorId: string | undefined;
    let title: string | undefined;
    let contentPreview: string | undefined;

    switch (contentType) {
      case ContentType.PRODUCT:
        content = await this.productRepository.findOne({ where: { id: contentId } });
        authorId = content?.farmerId;
        title = content?.name;
        contentPreview = content?.description;
        break;
      case ContentType.REVIEW:
        content = await this.reviewRepository.findOne({ where: { id: contentId } });
        authorId = content?.userId;
        title = 'Review';
        contentPreview = content?.comment;
        break;
      case ContentType.SOCIAL_POST:
        content = await this.socialPostRepository.findOne({ where: { id: contentId } });
        authorId = content?.userId;
        title = 'Social Post';
        contentPreview = content?.content;
        break;
      case ContentType.FARM_STORY:
        content = await this.farmStoryRepository.findOne({ where: { id: contentId } });
        authorId = content?.farmerId;
        title = 'Farm Story';
        contentPreview = content?.caption;
        break;
      case ContentType.COMMENT:
        content = await this.postCommentRepository.findOne({ where: { id: contentId } });
        authorId = content?.userId;
        title = 'Comment';
        contentPreview = content?.content;
        break;
    }

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    return this.submitForModeration({
      contentType,
      contentId,
      authorId: authorId!,
      title,
      contentPreview,
      contentSnapshot: content,
      reportedById: reporterId,
      reportReason: reason,
    });
  }

  /**
   * Get content moderation history for a user
   */
  async getUserModerationHistory(userId: string) {
    const items = await this.moderationRepository.find({
      where: { authorId: userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    const stats = {
      totalItems: items.length,
      approved: items.filter(i => i.status === ModerationStatus.APPROVED || i.status === ModerationStatus.AUTO_APPROVED).length,
      rejected: items.filter(i => i.status === ModerationStatus.REJECTED || i.status === ModerationStatus.AUTO_REJECTED).length,
      pending: items.filter(i => i.status === ModerationStatus.PENDING || i.status === ModerationStatus.UNDER_REVIEW).length,
      warnings: items.filter(i => i.userWarned).length,
    };

    return { items, stats };
  }

  /**
   * Bulk approve content
   */
  async bulkApprove(ids: string[], adminId: string): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        await this.approveContent(id, adminId);
        success++;
      } catch {
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Bulk reject content
   */
  async bulkReject(
    ids: string[],
    adminId: string,
    reason: ModerationReason,
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        await this.rejectContent(id, adminId, reason);
        success++;
      } catch {
        failed++;
      }
    }

    return { success, failed };
  }
}
