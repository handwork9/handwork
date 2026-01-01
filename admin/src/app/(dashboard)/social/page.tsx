'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  MoreVertical,
  Eye,
  Trash2,
  Flag,
  Ban,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  Video,
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  Users,
  FileText,
  AlertTriangle,
  Play,
  Clock,
  Filter,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { adminApiClient } from '@/lib/api-client';
import { toast } from 'sonner';

interface SocialPost {
  id: string;
  content: string;
  postType: string;
  mediaUrls: string[];
  tags: string[];
  location?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  status: 'active' | 'hidden' | 'flagged' | 'removed';
  createdAt: string;
  farmer: {
    id: string;
    farmName: string;
    user: {
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  };
}

interface FarmStory {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  viewsCount: number;
  expiresAt: string;
  createdAt: string;
  farmer: {
    id: string;
    farmName: string;
    user: {
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  };
}

interface PostReport {
  id: string;
  postId: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  createdAt: string;
  reporter: {
    id: string;
    firstName: string;
    lastName: string;
  };
  post?: SocialPost;
}

// API functions
const fetchPosts = async (params: { page: number; status?: string; search?: string }) => {
  const response = await adminApiClient.get('/admin/social/posts', { params });
  return response.data;
};

const fetchStories = async (params: { page: number }) => {
  const response = await adminApiClient.get('/admin/social/stories', { params });
  return response.data;
};

const fetchReports = async (params: { page: number; status?: string }) => {
  const response = await adminApiClient.get('/admin/social/reports', { params });
  return response.data;
};

const fetchStats = async () => {
  const response = await adminApiClient.get('/admin/social/stats');
  return response.data;
};

const updatePostStatus = async ({ postId, status, reason }: { postId: string; status: string; reason?: string }) => {
  const response = await adminApiClient.patch(`/admin/social/posts/${postId}/status`, { status, reason });
  return response.data;
};

const reviewReport = async ({ reportId, action, reason }: { reportId: string; action: 'approve' | 'dismiss'; reason?: string }) => {
  const response = await adminApiClient.patch(`/admin/social/reports/${reportId}/review`, { action, reason });
  return response.data;
};

const deleteStory = async (storyId: string) => {
  const response = await adminApiClient.delete(`/admin/social/stories/${storyId}`);
  return response.data;
};

// Stats Card Component
function StatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['social-stats'],
    queryFn: fetchStats,
  });

  const statsData = [
    {
      title: 'Total Posts',
      value: stats?.totalPosts || 0,
      change: stats?.postsGrowth || '+0%',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Stories',
      value: stats?.activeStories || 0,
      change: stats?.storiesGrowth || '+0%',
      icon: Play,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Total Engagement',
      value: stats?.totalEngagement || 0,
      change: stats?.engagementGrowth || '+0%',
      icon: Heart,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Pending Reports',
      value: stats?.pendingReports || 0,
      change: '',
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className={`p-2 rounded-full ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : stat.value.toLocaleString()}
            </div>
            {stat.change && (
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{stat.change}</span> from last month
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Posts Tab Component
function PostsTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [moderationReason, setModerationReason] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['social-posts', page, search, statusFilter],
    queryFn: () => fetchPosts({ page, search, status: statusFilter || undefined }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: updatePostStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      queryClient.invalidateQueries({ queryKey: ['social-stats'] });
      toast.success('Post status updated');
      setSelectedPost(null);
      setModerationReason('');
    },
    onError: () => {
      toast.error('Failed to update post status');
    },
  });

  const handleStatusChange = (postId: string, status: string) => {
    if (status === 'removed' || status === 'hidden') {
      setSelectedPost(data?.posts.find((p: SocialPost) => p.id === postId));
      setIsDeleteDialogOpen(true);
    } else {
      updateStatusMutation.mutate({ postId, status });
    }
  };

  const confirmModeration = () => {
    if (selectedPost) {
      updateStatusMutation.mutate({
        postId: selectedPost.id,
        status: 'removed',
        reason: moderationReason,
      });
      setIsDeleteDialogOpen(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      hidden: 'bg-yellow-100 text-yellow-800',
      flagged: 'bg-orange-100 text-orange-800',
      removed: 'bg-red-100 text-red-800',
    };
    return <Badge className={styles[status] || ''}>{status}</Badge>;
  };

  const getPostTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      farm_update: 'bg-blue-100 text-blue-800',
      harvest: 'bg-green-100 text-green-800',
      behind_the_scenes: 'bg-purple-100 text-purple-800',
      product_showcase: 'bg-orange-100 text-orange-800',
    };
    return <Badge variant="outline" className={styles[type] || ''}>{type.replace('_', ' ')}</Badge>;
  };

  return (
    <>
      {/* Filters */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              {statusFilter || 'All Status'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter('')}>All</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('active')}>Active</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('hidden')}>Hidden</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('flagged')}>Flagged</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('removed')}>Removed</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Posts Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Farmer</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Engagement</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data?.posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No posts found
                </TableCell>
              </TableRow>
            ) : (
              data?.posts.map((post: SocialPost) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={post.farmer.user.avatar} />
                        <AvatarFallback>
                          {post.farmer.farmName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{post.farmer.farmName}</div>
                        <div className="text-sm text-muted-foreground">
                          {post.farmer.user.firstName} {post.farmer.user.lastName}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="truncate">{post.content}</p>
                      {post.mediaUrls.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                          <ImageIcon className="h-3 w-3" />
                          {post.mediaUrls.length} media
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getPostTypeBadge(post.postType)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" /> {post.likesCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" /> {post.commentsCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Share2 className="h-3 w-3" /> {post.sharesCount}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(post.status)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedPost(post)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {post.status !== 'active' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(post.id, 'active')}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Restore
                          </DropdownMenuItem>
                        )}
                        {post.status === 'active' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(post.id, 'hidden')}>
                            <Ban className="h-4 w-4 mr-2" />
                            Hide Post
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleStatusChange(post.id, 'removed')}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove Post
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="py-2 px-4">
            Page {page} of {data.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => p + 1)}
            disabled={page >= data.totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Post Details Dialog */}
      <Dialog open={!!selectedPost && !isDeleteDialogOpen} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Post Details</DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={selectedPost.farmer.user.avatar} />
                  <AvatarFallback>{selectedPost.farmer.farmName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{selectedPost.farmer.farmName}</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(selectedPost.createdAt), 'PPP p')}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p>{selectedPost.content}</p>
              </div>

              {selectedPost.mediaUrls.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {selectedPost.mediaUrls.slice(0, 4).map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Media ${index + 1}`}
                      className="rounded-lg w-full h-32 object-cover"
                    />
                  ))}
                </div>
              )}

              {selectedPost.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {selectedPost.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">#{tag}</Badge>
                  ))}
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t">
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4" /> {selectedPost.likesCount} likes
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" /> {selectedPost.commentsCount} comments
                </div>
                <div className="flex items-center gap-1">
                  <Share2 className="h-4 w-4" /> {selectedPost.sharesCount} shares
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Moderation Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Post</DialogTitle>
            <DialogDescription>
              This action will hide the post from all users. Please provide a reason for moderation.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for removal (optional but recommended)"
            value={moderationReason}
            onChange={(e) => setModerationReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmModeration}>
              Remove Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Stories Tab Component
function StoriesTab() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['social-stories', page],
    queryFn: () => fetchStories({ page }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-stories'] });
      toast.success('Story deleted');
    },
    onError: () => {
      toast.error('Failed to delete story');
    },
  });

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading ? (
          <div className="col-span-full text-center py-8">Loading...</div>
        ) : data?.stories.length === 0 ? (
          <div className="col-span-full text-center py-8">No active stories</div>
        ) : (
          data?.stories.map((story: FarmStory) => (
            <Card key={story.id} className="overflow-hidden">
              <div className="relative aspect-[9/16] max-h-64">
                {story.mediaType === 'video' ? (
                  <div className="w-full h-full bg-black flex items-center justify-center">
                    <Video className="h-8 w-8 text-white" />
                  </div>
                ) : (
                  <img
                    src={story.mediaUrl}
                    alt="Story"
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {story.viewsCount}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={story.farmer.user.avatar} />
                      <AvatarFallback>{story.farmer.farmName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="text-sm">
                      <div className="font-medium">{story.farmer.farmName}</div>
                      <div className="text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(story.expiresAt))} left
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(story.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
                {story.caption && (
                  <p className="mt-2 text-sm text-muted-foreground truncate">{story.caption}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="py-2 px-4">
            Page {page} of {data.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => p + 1)}
            disabled={page >= data.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </>
  );
}

// Reports Tab Component
function ReportsTab() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedReport, setSelectedReport] = useState<PostReport | null>(null);
  const [dismissReason, setDismissReason] = useState('');
  
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['social-reports', page, statusFilter],
    queryFn: () => fetchReports({ page, status: statusFilter || undefined }),
  });

  const reviewMutation = useMutation({
    mutationFn: reviewReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-reports'] });
      queryClient.invalidateQueries({ queryKey: ['social-stats'] });
      toast.success('Report reviewed');
      setSelectedReport(null);
      setDismissReason('');
    },
    onError: () => {
      toast.error('Failed to review report');
    },
  });

  const handleApprove = (report: PostReport) => {
    reviewMutation.mutate({ reportId: report.id, action: 'approve' });
  };

  const handleDismiss = () => {
    if (selectedReport) {
      reviewMutation.mutate({
        reportId: selectedReport.id,
        action: 'dismiss',
        reason: dismissReason,
      });
    }
  };

  return (
    <>
      <div className="flex items-center gap-4 mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              {statusFilter || 'All Reports'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter('')}>All</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('pending')}>Pending</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('reviewed')}>Reviewed</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('dismissed')}>Dismissed</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reporter</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Post Preview</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data?.reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No reports found
                </TableCell>
              </TableRow>
            ) : (
              data?.reports.map((report: PostReport) => (
                <TableRow key={report.id}>
                  <TableCell>
                    {report.reporter.firstName} {report.reporter.lastName}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{report.reason}</Badge>
                    {report.description && (
                      <p className="text-sm text-muted-foreground mt-1 truncate max-w-xs">
                        {report.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    {report.post ? (
                      <p className="text-sm truncate max-w-xs">{report.post.content}</p>
                    ) : (
                      <span className="text-muted-foreground">Post deleted</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        report.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : report.status === 'reviewed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }
                    >
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    {report.status === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(report)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Remove Post
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedReport(report)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Dismiss Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dismiss Report</DialogTitle>
            <DialogDescription>
              Provide a reason for dismissing this report (optional)
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for dismissal..."
            value={dismissReason}
            onChange={(e) => setDismissReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReport(null)}>
              Cancel
            </Button>
            <Button onClick={handleDismiss}>
              Dismiss Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Main Page Component
export default function SocialManagementPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Social Content Management</h1>
        <p className="text-muted-foreground">
          Manage posts, stories, and moderation for the social features
        </p>
      </div>

      <StatsCards />

      <Tabs defaultValue="posts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="stories">Stories</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          <PostsTab />
        </TabsContent>

        <TabsContent value="stories" className="space-y-4">
          <StoriesTab />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <ReportsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
