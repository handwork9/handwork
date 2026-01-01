import apiClient from './apiClient';

export interface SocialPost {
  id: string;
  farmerId: string;
  farmer: {
    id: string;
    farmName: string;
    userId: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  };
  type: 'text' | 'image' | 'video' | 'product_showcase' | 'farm_update' | 'harvest' | 'behind_the_scenes';
  content?: string;
  images?: string[];
  videoUrl?: string;
  videoThumbnail?: string;
  productId?: string;
  visibility: 'public' | 'followers' | 'private';
  tags?: string[];
  location?: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isPinned: boolean;
  isLiked?: boolean;
  isSaved?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PostComment {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  postId: string;
  content: string;
  parentCommentId?: string;
  replies?: PostComment[];
  likeCount?: number;
  isLiked?: boolean;
  createdAt: string;
}

export interface FarmStory {
  id: string;
  farmerId: string;
  farmer: {
    id: string;
    farmName: string;
    user: {
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  };
  type: 'image' | 'video' | 'text';
  mediaUrl?: string;
  thumbnailUrl?: string;
  caption?: string;
  backgroundColor?: string;
  textColor?: string;
  linkUrl?: string;
  linkText?: string;
  duration: number;
  viewCount: number;
  expiresAt: string;
  isViewed?: boolean;
  createdAt: string;
}

export interface FarmerStories {
  farmer: {
    id: string;
    farmName: string;
    user: {
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  };
  stories: FarmStory[];
  hasUnviewed: boolean;
}

export interface LiveStream {
  id: string;
  farmerId: string;
  farmer: {
    id: string;
    farmName: string;
    user: {
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  };
  title: string;
  description?: string;
  thumbnailUrl?: string;
  status: 'scheduled' | 'live' | 'ended';
  streamKey?: string;
  streamUrl?: string;
  playbackUrl?: string;
  viewerCount: number;
  peakViewerCount: number;
  scheduledStartTime?: string;
  actualStartTime?: string;
  endedAt?: string;
  duration?: number;
  recordingUrl?: string;
  chatEnabled: boolean;
  isRecordingEnabled: boolean;
  tags?: string[];
  productId?: string;
  createdAt: string;
}

export interface CreatePostDto {
  type?: SocialPost['type'];
  content?: string;
  images?: string[];
  videoUrl?: string;
  videoThumbnail?: string;
  productId?: string;
  visibility?: SocialPost['visibility'];
  tags?: string[];
  location?: string;
}

export interface CreateStoryDto {
  type?: FarmStory['type'];
  mediaUrl?: string;
  thumbnailUrl?: string;
  caption?: string;
  backgroundColor?: string;
  textColor?: string;
  linkUrl?: string;
  linkText?: string;
  duration?: number;
}

export interface CreateLiveStreamDto {
  title: string;
  description?: string;
  thumbnailUrl?: string;
  scheduledStartTime?: string;
  tags?: string[];
  productId?: string;
  isRecordingEnabled?: boolean;
}

// API response wrapper type
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

class SocialService {
  // ==================== POSTS ====================

  async createPost(data: CreatePostDto): Promise<SocialPost> {
    const response = await apiClient.post<ApiResponse<SocialPost>>('/social/posts', data);
    return response.data || response as unknown as SocialPost;
  }

  async getFeed(params?: { type?: string; tag?: string; page?: number; limit?: number }): Promise<{
    posts: SocialPost[];
    total: number;
    hasMore: boolean;
  }> {
    const response = await apiClient.get<ApiResponse<{ posts: SocialPost[]; total: number; hasMore: boolean }>>('/social/posts', { params });
    return response.data || response as unknown as { posts: SocialPost[]; total: number; hasMore: boolean };
  }

  async getPost(postId: string): Promise<SocialPost> {
    const response = await apiClient.get<ApiResponse<SocialPost>>(`/social/posts/${postId}`);
    return response.data || response as unknown as SocialPost;
  }

  async updatePost(postId: string, data: Partial<CreatePostDto>): Promise<SocialPost> {
    const response = await apiClient.put<ApiResponse<SocialPost>>(`/social/posts/${postId}`, data);
    return response.data || response as unknown as SocialPost;
  }

  async deletePost(postId: string): Promise<void> {
    await apiClient.delete(`/social/posts/${postId}`);
  }

  async likePost(postId: string): Promise<{ liked: boolean; likeCount: number }> {
    const response = await apiClient.post<ApiResponse<{ liked: boolean; likeCount: number }>>(`/social/posts/${postId}/like`);
    return response.data || response as unknown as { liked: boolean; likeCount: number };
  }

  async getPostLikes(postId: string, page = 1, limit = 50): Promise<{ users: any[]; total: number }> {
    const response = await apiClient.get<ApiResponse<{ users: any[]; total: number }>>(`/social/posts/${postId}/likes`, { params: { page, limit } });
    return response.data || response as unknown as { users: any[]; total: number };
  }

  // ==================== COMMENTS ====================

  async createComment(postId: string, content: string, parentCommentId?: string): Promise<PostComment> {
    const response = await apiClient.post<ApiResponse<PostComment>>(`/social/posts/${postId}/comments`, {
      content,
      parentCommentId,
    });
    return response.data || response as unknown as PostComment;
  }

  async getPostComments(postId: string, page = 1, limit = 20): Promise<{ comments: PostComment[]; total: number }> {
    const response = await apiClient.get<ApiResponse<{ comments: PostComment[]; total: number }>>(`/social/posts/${postId}/comments`, { params: { page, limit } });
    return response.data || response as unknown as { comments: PostComment[]; total: number };
  }

  async likeComment(commentId: string): Promise<{ liked: boolean; likeCount: number }> {
    const response = await apiClient.post<ApiResponse<{ liked: boolean; likeCount: number }>>(`/social/comments/${commentId}/like`);
    return response.data || response as unknown as { liked: boolean; likeCount: number };
  }

  async deleteComment(commentId: string): Promise<void> {
    await apiClient.delete(`/social/comments/${commentId}`);
  }

  // ==================== SAVED POSTS ====================

  async savePost(postId: string): Promise<{ saved: boolean }> {
    const response = await apiClient.post<ApiResponse<{ saved: boolean }>>(`/social/posts/${postId}/save`);
    return response.data || response as unknown as { saved: boolean };
  }

  async getSavedPosts(page = 1, limit = 20): Promise<{ posts: SocialPost[]; total: number }> {
    const response = await apiClient.get<ApiResponse<{ posts: SocialPost[]; total: number }>>('/social/saved-posts', { params: { page, limit } });
    return response.data || response as unknown as { posts: SocialPost[]; total: number };
  }

  async isPostSaved(postId: string): Promise<boolean> {
    const response = await apiClient.get<ApiResponse<{ saved: boolean }>>(`/social/posts/${postId}/is-saved`);
    const result = response.data || response as unknown as { saved: boolean };
    return result.saved;
  }

  // ==================== FOLLOWS ====================

  async followFarmer(farmerId: string): Promise<{ following: boolean }> {
    const response = await apiClient.post<ApiResponse<{ following: boolean }>>(`/social/farmers/${farmerId}/follow`);
    return response.data || response as unknown as { following: boolean };
  }

  async updateFollowNotifications(farmerId: string, enabled: boolean): Promise<void> {
    await apiClient.put(`/social/farmers/${farmerId}/follow/notifications`, {
      notificationsEnabled: enabled,
    });
  }

  async getFollowedFarmers(page = 1, limit = 20): Promise<{ farmers: any[]; total: number }> {
    const response = await apiClient.get<ApiResponse<{ farmers: any[]; total: number }>>('/social/following', { params: { page, limit } });
    return response.data || response as unknown as { farmers: any[]; total: number };
  }

  async getFarmerFollowers(farmerId: string, page = 1, limit = 50): Promise<{ users: any[]; total: number }> {
    const response = await apiClient.get<ApiResponse<{ users: any[]; total: number }>>(`/social/farmers/${farmerId}/followers`, { params: { page, limit } });
    return response.data || response as unknown as { users: any[]; total: number };
  }

  async getFarmerPosts(farmerId: string, page = 1, limit = 20): Promise<{ posts: SocialPost[]; total: number }> {
    const response = await apiClient.get<ApiResponse<{ posts: SocialPost[]; total: number }>>(`/social/farmers/${farmerId}/posts`, { params: { page, limit } });
    return response.data || response as unknown as { posts: SocialPost[]; total: number };
  }

  async isFollowing(farmerId: string): Promise<boolean> {
    const response = await apiClient.get<ApiResponse<{ following: boolean }>>(`/social/farmers/${farmerId}/is-following`);
    return (response.data || response as unknown as { following: boolean }).following;
  }

  // ==================== STORIES ====================

  async createStory(data: CreateStoryDto): Promise<FarmStory> {
    const response = await apiClient.post<ApiResponse<FarmStory>>('/social/stories', data);
    return response.data || response as unknown as FarmStory;
  }

  async getStories(): Promise<FarmerStories[]> {
    const response = await apiClient.get<ApiResponse<FarmerStories[]>>('/social/stories');
    return response.data || response as unknown as FarmerStories[];
  }

  async viewStory(storyId: string): Promise<void> {
    await apiClient.post(`/social/stories/${storyId}/view`);
  }

  async getStoryViews(storyId: string): Promise<{ users: any[]; total: number }> {
    const response = await apiClient.get<ApiResponse<{ users: any[]; total: number }>>(`/social/stories/${storyId}/views`);
    return response.data || response as unknown as { users: any[]; total: number };
  }

  async deleteStory(storyId: string): Promise<void> {
    await apiClient.delete(`/social/stories/${storyId}`);
  }

  // ==================== LIVE STREAMS ====================

  async createLiveStream(data: CreateLiveStreamDto): Promise<LiveStream> {
    const response = await apiClient.post<ApiResponse<LiveStream>>('/social/live', data);
    return response.data || response as unknown as LiveStream;
  }

  async getLiveStreams(page = 1, limit = 20): Promise<{ streams: LiveStream[]; total: number }> {
    const response = await apiClient.get<ApiResponse<{ streams: LiveStream[]; total: number }>>('/social/live', { params: { page, limit } });
    return response.data || response as unknown as { streams: LiveStream[]; total: number };
  }

  async getUpcomingStreams(page = 1, limit = 20): Promise<{ streams: LiveStream[]; total: number }> {
    const response = await apiClient.get<ApiResponse<{ streams: LiveStream[]; total: number }>>('/social/live/upcoming', { params: { page, limit } });
    return response.data || response as unknown as { streams: LiveStream[]; total: number };
  }

  async getLiveStream(streamId: string): Promise<LiveStream> {
    const response = await apiClient.get<ApiResponse<LiveStream>>(`/social/live/${streamId}`);
    return response.data || response as unknown as LiveStream;
  }

  async startLiveStream(streamId: string): Promise<LiveStream> {
    const response = await apiClient.post<ApiResponse<LiveStream>>(`/social/live/${streamId}/start`);
    return response.data || response as unknown as LiveStream;
  }

  async endLiveStream(streamId: string): Promise<LiveStream> {
    const response = await apiClient.post<ApiResponse<LiveStream>>(`/social/live/${streamId}/end`);
    return response.data || response as unknown as LiveStream;
  }
}

export const socialService = new SocialService();
export default socialService;
