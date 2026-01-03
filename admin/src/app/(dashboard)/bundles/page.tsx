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
import { Package, Search, RefreshCw, Eye, Trash2, TrendingUp, ShoppingBag, Users, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface BundleItem {
  productId: string;
  productTitle: string;
  quantity: number;
  originalPrice: number;
}

interface ProductBundle {
  id: string;
  title: string;
  description: string;
  farmerId: string;
  farmer?: {
    id: string;
    name: string;
  };
  items: BundleItem[];
  originalTotal: number;
  bundlePrice: number;
  discountPercentage: number;
  stock: number;
  soldCount: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export default function BundlesPage() {
  const [bundles, setBundles] = useState<ProductBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    totalSold: 0,
    totalRevenue: 0,
  });
  const { toast } = useToast();

  const fetchBundles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bundles', {
        params: { limit: 100 },
      });
      const data = response.data?.data?.data || response.data?.data || [];
      setBundles(data);
      
      // Calculate stats
      const active = data.filter((b: ProductBundle) => b.isActive).length;
      const totalSold = data.reduce((sum: number, b: ProductBundle) => sum + (b.soldCount || 0), 0);
      const revenue = data.reduce((sum: number, b: ProductBundle) => 
        sum + ((b.soldCount || 0) * b.bundlePrice), 0);
      
      setStats({
        total: data.length,
        active,
        totalSold,
        totalRevenue: revenue,
      });
    } catch (error) {
      console.error('Error fetching bundles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load bundles',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBundles();
  }, []);

  const handleDeleteBundle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bundle?')) return;
    
    try {
      await api.delete(`/bundles/${id}`);
      toast({ title: 'Success', description: 'Bundle deleted successfully' });
      fetchBundles();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete bundle', variant: 'destructive' });
    }
  };

  const handleToggleActive = async (bundle: ProductBundle) => {
    try {
      await api.put(`/bundles/${bundle.id}`, { isActive: !bundle.isActive });
      toast({ 
        title: 'Success', 
        description: `Bundle ${bundle.isActive ? 'deactivated' : 'activated'} successfully` 
      });
      fetchBundles();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update bundle', variant: 'destructive' });
    }
  };

  const filteredBundles = bundles.filter(bundle => {
    const matchesSearch = bundle.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bundle.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && bundle.isActive) ||
      (statusFilter === 'inactive' && !bundle.isActive);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Bundles</h1>
          <p className="text-muted-foreground">Manage farmer bundle deals and packages</p>
        </div>
        <Button onClick={fetchBundles} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Bundles</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Bundles</CardTitle>
            <ShoppingBag className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sold</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSold}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{stats.totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Bundles Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Bundles</CardTitle>
          <CardDescription>View and manage product bundles from farmers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bundles..."
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
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bundle</TableHead>
                  <TableHead>Farmer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Sold</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBundles.map((bundle) => (
                  <TableRow key={bundle.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{bundle.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {bundle.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{bundle.farmer?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {bundle.items?.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="text-xs">
                            {item.quantity}x {item.productTitle}
                          </div>
                        ))}
                        {bundle.items?.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{bundle.items.length - 2} more
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-green-600 font-medium">
                        {bundle.discountPercentage}% OFF
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <span className="line-through">₦{bundle.originalTotal?.toLocaleString()}</span>
                        {' → '}
                        <span className="font-medium">₦{bundle.bundlePrice?.toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>{bundle.stock}</TableCell>
                    <TableCell>{bundle.soldCount || 0}</TableCell>
                    <TableCell>
                      <Badge variant={bundle.isActive ? 'default' : 'secondary'}>
                        {bundle.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleToggleActive(bundle)}
                        >
                          {bundle.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeleteBundle(bundle.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredBundles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No bundles found
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
