'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, Search, Plus, Clock, TrendingUp, Package, Eye, Trash2, Edit, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface FlashSale {
  id: string;
  title: string;
  description: string;
  product: {
    id: string;
    title: string;
    images: string[];
    category: string;
  };
  farmer: {
    id: string;
    name: string;
  };
  originalPrice: string;
  salePrice: string;
  discountPercent: number;
  totalQuantity: number;
  soldQuantity: number;
  remainingQuantity: number;
  startTime: string;
  endTime: string;
  timeRemainingMs: number;
  status: 'scheduled' | 'active' | 'ended' | 'cancelled';
  isFeatured: boolean;
  views: number;
}

export default function FlashSalesPage() {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    scheduled: 0,
    ended: 0,
    totalRevenue: 0,
  });
  const { toast } = useToast();

  const fetchFlashSales = async () => {
    try {
      setLoading(true);
      const response = await api.get('/flash-sales', {
        params: { 
          limit: 100,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        },
      });
      const data = response.data?.data?.data || response.data?.data || [];
      setFlashSales(data);
      
      // Calculate stats
      const active = data.filter((s: FlashSale) => s.status === 'active').length;
      const scheduled = data.filter((s: FlashSale) => s.status === 'scheduled').length;
      const ended = data.filter((s: FlashSale) => s.status === 'ended').length;
      const revenue = data.reduce((sum: number, s: FlashSale) => 
        sum + (s.soldQuantity * parseFloat(s.salePrice)), 0);
      
      setStats({
        total: data.length,
        active,
        scheduled,
        ended,
        totalRevenue: revenue,
      });
    } catch (error) {
      console.error('Error fetching flash sales:', error);
      toast({
        title: 'Error',
        description: 'Failed to load flash sales',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlashSales();
  }, [statusFilter]);

  const formatTimeRemaining = (ms: number) => {
    if (ms <= 0) return 'Ended';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      scheduled: 'secondary',
      ended: 'outline',
      cancelled: 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const handleCancelSale = async (id: string) => {
    try {
      await api.put(`/flash-sales/${id}`, { status: 'cancelled' });
      toast({ title: 'Success', description: 'Flash sale cancelled' });
      fetchFlashSales();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to cancel flash sale', variant: 'destructive' });
    }
  };

  const filteredSales = flashSales.filter(sale =>
    sale.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sale.product?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sale.farmer?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Flash Sales</h1>
          <p className="text-muted-foreground">Manage flash sales and limited-time deals</p>
        </div>
        <Button onClick={fetchFlashSales} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <Clock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{stats.totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Flash Sales List</CardTitle>
          <CardDescription>View and manage all flash sales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, product, or farmer..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="ended">Ended</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Farmer</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Time Left</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {sale.product?.images?.[0] && (
                          <img 
                            src={sale.product.images[0]} 
                            alt={sale.product.title}
                            className="w-10 h-10 rounded object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium">{sale.title}</div>
                          <div className="text-sm text-muted-foreground">{sale.product?.title}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{sale.farmer?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="text-green-600 font-medium">{sale.discountPercent}% OFF</div>
                      <div className="text-xs text-muted-foreground">
                        ₦{parseFloat(sale.originalPrice).toLocaleString()} → ₦{parseFloat(sale.salePrice).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{sale.soldQuantity}/{sale.totalQuantity}</div>
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500" 
                          style={{ width: `${(sale.soldQuantity / sale.totalQuantity) * 100}%` }}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeRemaining(sale.timeRemainingMs)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {sale.views}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(sale.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {sale.status === 'active' && (
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleCancelSale(sale.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSales.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No flash sales found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
