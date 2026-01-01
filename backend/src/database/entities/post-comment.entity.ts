import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { SocialPost } from './social-post.entity';

@Entity('social_post_comments')
export class PostComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('uuid')
  @Index()
  postId: string;

  @ManyToOne(() => SocialPost, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: SocialPost;

  @Column({ type: 'text' })
  content: string;

  @Column('uuid', { nullable: true })
  parentCommentId: string; // For reply threads

  @ManyToOne(() => PostComment, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentCommentId' })
  parentComment: PostComment;

  @Column({ type: 'int', default: 0 })
  likeCount: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
