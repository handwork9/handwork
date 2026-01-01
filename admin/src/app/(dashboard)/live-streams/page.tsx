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
  DialogFooter,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  MoreVertical,
  Eye,
  Trash2,
  Ban,
  Play,
  Pause,
  Radio,
  Calendar,
  Clock,
  Users,
  TrendingUp,
  Video,
  Filter,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { format, formatDistanceToNow, differenceInMinutes } from 'date-fns';
import { adminApiClient } from '@/lib/api-client';
import { toast } from 'sonner';

interface LiveStream {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  status: 'scheduled' | 'live' | 'ended';
  viewerCount: number;
  peakViewers: number;
  startedAt?: string;
  endedAt?: string;
  scheduledFor?: string;
  duration?: number;
  tags: string[];
  createdAt: string;
  farmer: {
    id: string;
    farmName: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  };
}

interface StreamStats {
  totalStreams: number;
  liveNow: number;
  scheduledToday: number;
  totalViewers: number;
  avgDuration: number;
  topStreamers: Array<{
    farmerId: string;
    farmName: string;
    streamCount: number;
    totalViewers: number;
  }>;
}

// API functions
const fetchLiveStreams = async () => {
  const response = await adminApiClient.get('/admin/social/streams/live');
  return response.data;
};

const fetchScheduledStreams = async () => {
  const response = await adminApiClient.get('/admin/social/streams/scheduled');
  return response.data;
};

const fetchStreamHistory = async (params: { page: number; search?: string }) => {
  const response = await adminApiClient.get('/admin/social/streams/history', { params });
  return response.data;
};

const fetchStreamStats = async () => {
  const response = await adminApiClient.get('/admin/social/streams/stats');
  return response.data;
};

const endStream = async (streamId: string) => {
  const response = await adminApiClient.post(`/admin/social/streams/${streamId}/end`);
  return response.data;
};

const cancelStream = async (streamId: string) => {
  const response = await adminApiClient.post(`/admin/social/streams/${streamId}/cancel`);
  return response.data;
};

// Stats Cards Component
function StatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stream-stats'],
    queryFn: fetchStreamStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const statsData = [
    {
      title: 'Live Now',
      value: stats?.liveNow || 0,
      icon: Radio,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      pulse: true,
    },
    {
      title: 'Scheduled Today',
      value: stats?.scheduledToday || 0,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Current Viewers',
      value: stats?.totalViewers || 0,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Total Streams',
      value: stats?.totalStreams || 0,
      icon: Video,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className={`p-2 rounded-full ${stat.bgColor} ${stat.pulse ? 'animate-pulse' : ''}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : stat.value.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Live Now Tab Component
function LiveNowTab() {
  const queryClient = useQueryClient();
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [showEndDialog, setShowEndDialog] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['live-streams'],
    queryFn: fetchLiveStreams,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const endStreamMutation = useMutation({
    mutationFn: endStream,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-streams'] });
      queryClient.invalidateQueries({ queryKey: ['stream-stats'] });
      toast.success('Stream ended successfully');
      setShowEndDialog(false);
      setSelectedStream(null);
    },
    onError: () => {
      toast.error('Failed to end stream');
    },
  });

  const handleEndStream = (stream: LiveStream) => {
    setSelectedStream(stream);
    setShowEndDialog(true);
  };

  const confirmEndStream = () => {
    if (selectedStream) {
      endStreamMutation.mutate(selectedStream.id);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading live streams...</div>;
  }

  if (!data?.streams || data.streams.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Radio className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No Live Streams</h3>
          <p className="text-muted-foreground">There are no active streams at the moment</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.streams.map((stream: LiveStream) => (
          <Card key={stream.id} className="overflow-hidden">
            <div className="relative aspect-video">
              {stream.thumbnailUrl ? (
                <img
                  src={stream.thumbnailUrl}
                  alt={stream.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                  <Video className="h-12 w-12 text-gray-500" />
                </div>
              )}
              
              {/* Live indicator */}
              <div className="absolute top-2 left-2 flex items-center gap-2">
                <Badge className="bg-red-600 text-white animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full mr-1 animate-ping" />
                  LIVE
                </Badge>
              </div>
              
              {/* Viewer count */}
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="bg-black/60 text-white">
                  <Eye className="h-3 w-3 mr-1" />
                  {stream.viewerCount.toLocaleString()}
                </Badge>
              </div>

              {/* Duration */}
              {stream.startedAt && (
                <div className="absolute bottom-2 left-2">
                  <Badge variant="secondary" className="bg-black/60 text-white">
                    <Clock className="h-3 w-3 mr-1" />
                    {differenceInMinutes(new Date(), new Date(stream.startedAt))} min
                  </Badge>
                </div>
              )}
            </div>

            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={stream.farmer.user.avatar} />
                    <AvatarFallback>{stream.farmer.farmName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold line-clamp-1">{stream.title}</h3>
                    <p className="text-sm text-muted-foreground">{stream.farmer.farmName}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="h-4 w-4 mr-2" />
                      Watch Stream
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={() => handleEndStream(stream)}
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      End Stream
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {stream.tags && stream.tags.length > 0 && (
                <div className="flex gap-1 mt-3 flex-wrap">
                  {stream.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mt-3 pt-3 border-t text-sm text-muted-foreground">
                <span>Peak: {stream.peakViewers.toLocaleString()} viewers</span>
                <span>Started {formatDistanceToNow(new Date(stream.startedAt!), { addSuffix: true })}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* End Stream Dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Live Stream</DialogTitle>
            <DialogDescription>
              Are you sure you want to end this stream? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedStream && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Avatar>
                <AvatarImage src={selectedStream.farmer.user.avatar} />
                <AvatarFallback>{selectedStream.farmer.farmName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedStream.title}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedStream.farmer.farmName} • {selectedStream.viewerCount} viewers
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmEndStream}>
              End Stream
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Scheduled Tab Component
function ScheduledTab() {
  const queryClient = useQueryClient();
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['scheduled-streams'],
    queryFn: fetchScheduledStreams,
  });

  const cancelMutation = useMutation({
    mutationFn: cancelStream,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-streams'] });
      queryClient.invalidateQueries({ queryKey: ['stream-stats'] });
      toast.success('Stream cancelled');
      setSelectedStream(null);
    },
    onError: () => {
      toast.error('Failed to cancel stream');
    },
  });

  return (
    <>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Farmer</TableHead>
              <TableHead>Stream Title</TableHead>
              <TableHead>Scheduled For</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data?.streams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  No scheduled streams
                </TableCell>
              </TableRow>
            ) : (
              data?.streams.map((stream: LiveStream) => (
                <TableRow key={stream.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={stream.farmer.user.avatar} />
                        <AvatarFallback>{stream.farmer.farmName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{stream.farmer.farmName}</p>
                        <p className="text-sm text-muted-foreground">
                          {stream.farmer.user.firstName} {stream.farmer.user.lastName}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{stream.title}</p>
                    {stream.description && (
                      <p className="text-sm text-muted-foreground truncate max-w-xs">
                        {stream.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {format(new Date(stream.scheduledFor!), 'PPP p')}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(stream.scheduledFor!), { addSuffix: true })}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {stream.tags?.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                      onClick={() => setSelectedStream(stream)}
                    >
                      Cancel
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Cancel Dialog */}
      <Dialog open={!!selectedStream} onOpenChange={() => setSelectedStream(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Scheduled Stream</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this scheduled stream?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedStream(null)}>
              Keep Stream
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedStream && cancelMutation.mutate(selectedStream.id)}
            >
              Cancel Stream
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// History Tab Component
function HistoryTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['stream-history', page, search],
    queryFn: () => fetchStreamHistory({ page, search }),
  });

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <>
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search streams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Farmer</TableHead>
              <TableHead>Stream Title</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Peak Viewers</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data?.streams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No streams found
                </TableCell>
              </TableRow>
            ) : (
              data?.streams.map((stream: LiveStream) => (
                <TableRow key={stream.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={stream.farmer.user.avatar} />
                        <AvatarFallback>{stream.farmer.farmName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{stream.farmer.farmName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{stream.title}</p>
                  </TableCell>
                  <TableCell>
                    {stream.duration ? formatDuration(stream.duration) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {stream.peakViewers.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(stream.startedAt || stream.createdAt), 'PPP')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge className="bg-gray-100 text-gray-800">Ended</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

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

// Top Streamers Component
function TopStreamers() {
  const { data: stats } = useQuery({
    queryKey: ['stream-stats'],
    queryFn: fetchStreamStats,
  });

  if (!stats?.topStreamers || stats.topStreamers.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Top Streamers
        </CardTitle>
        <CardDescription>Farmers with the most streams this month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stats.topStreamers.map((streamer: any, index: number) => (
            <div key={streamer.farmerId} className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                index === 0 ? 'bg-yellow-100 text-yellow-700' :
                index === 1 ? 'bg-gray-100 text-gray-700' :
                index === 2 ? 'bg-orange-100 text-orange-700' :
                'bg-muted text-muted-foreground'
              }`}>
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="font-medium">{streamer.farmName}</p>
                <p className="text-sm text-muted-foreground">
                  {streamer.streamCount} streams • {streamer.totalViewers.toLocaleString()} total viewers
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Main Page Component
export default function LiveStreamsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Live Streams</h1>
        <p className="text-muted-foreground">
          Monitor and manage live streaming activity
        </p>
      </div>

      <StatsCards />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs defaultValue="live" className="space-y-4">
            <TabsList>
              <TabsTrigger value="live" className="flex items-center gap-2">
                <Radio className="h-4 w-4" />
                Live Now
              </TabsTrigger>
              <TabsTrigger value="scheduled" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Scheduled
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="live">
              <LiveNowTab />
            </TabsContent>

            <TabsContent value="scheduled">
              <ScheduledTab />
            </TabsContent>

            <TabsContent value="history">
              <HistoryTab />
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <TopStreamers />
        </div>
      </div>
    </div>
  );
}
