import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { SocialPost } from './social-post.entity';

@Entity('social_post_likes')
@Unique(['userId', 'postId'])
export class PostLike {
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

  @CreateDateColumn()
  createdAt: Date;
}
