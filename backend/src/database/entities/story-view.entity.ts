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
import { FarmStory } from './farm-story.entity';

@Entity('farm_story_views')
@Unique(['userId', 'storyId'])
export class StoryView {
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
  storyId: string;

  @ManyToOne(() => FarmStory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'storyId' })
  story: FarmStory;

  @CreateDateColumn()
  viewedAt: Date;
}
