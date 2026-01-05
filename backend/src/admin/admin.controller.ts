import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { AdminService, DashboardMetrics, SettingsData } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, OrderStatus } from '../common/enums';
import { User, Order, Rider, Product, DeletionRequestStatus } from '../database/entities';
import { UsersService } from '../users/users.service';
import { ReviewDeletionRequestDto } from '../users/dto';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard overview metrics' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard metrics',
  })
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    return this.adminService.getDashboardMetrics();
  }

  @Get('metrics/orders')
  @ApiOperation({ summary: 'Get order metrics for date range' })
  @ApiQuery({ name: 'startDate', required: true, type: String, example: '2024-01-01' })
  @ApiQuery({ name: 'endDate', required: true, type: String, example: '2024-01-31' })
  @ApiResponse({
    status: 200,
    description: 'Order metrics',
  })
  async getOrderMetrics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<any[]> {
    return this.adminService.getOrderMetrics(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('metrics/revenue')
  @ApiOperation({ summary: 'Get revenue metrics for date range' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiResponse({
    status: 200,
    description: 'Revenue metrics',
  })
  async getRevenueMetrics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<any[]> {
    return this.adminService.getRevenueMetrics(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('metrics/users')
  @ApiOperation({ summary: 'Get user growth metrics for date range' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiResponse({
    status: 200,
    description: 'User growth metrics',
  })
  async getUserGrowth(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<any[]> {
    return this.adminService.getUserGrowth(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('metrics/dispatch')
  @ApiOperation({ summary: 'Get dispatch analytics for date range' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiResponse({
    status: 200,
    description: 'Dispatch analytics',
  })
  async getDispatchAnalytics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<any> {
    return this.adminService.getDispatchAnalytics(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('reports')
  @ApiOperation({ summary: 'Get comprehensive reports data' })
  @ApiQuery({ name: 'type', required: false, type: String, example: 'overview' })
  @ApiQuery({ name: 'startDate', required: true, type: String, example: '2024-01-01' })
  @ApiQuery({ name: 'endDate', required: true, type: String, example: '2024-01-31' })
  @ApiResponse({
    status: 200,
    description: 'Reports data',
  })
  async getReports(
    @Query('type') type: string = 'overview',
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<any> {
    return this.adminService.getReports(
      type,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('top-farmers')
  @ApiOperation({ summary: 'Get top performing farmers' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Top farmers list',
  })
  async getTopFarmers(@Query('limit') limit?: number): Promise<any[]> {
    return this.adminService.getTopFarmers(limit);
  }

  @Get('top-riders')
  @ApiOperation({ summary: 'Get top performing riders' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Top riders list',
  })
  async getTopRiders(@Query('limit') limit?: number): Promise<any[]> {
    return this.adminService.getTopRiders(limit);
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: UserRole,
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated users list',
  })
  async getAllUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('role') role?: UserRole,
  ): Promise<{ users: User[]; total: number; pages: number }> {
    return this.adminService.getAllUsers(page, limit, role);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get all orders with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: OrderStatus,
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated orders list',
  })
  async getAllOrders(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: OrderStatus,
  ): Promise<{ orders: Order[]; total: number; pages: number }> {
    return this.adminService.getAllOrders(page, limit, status);
  }

  @Patch('users/:userId/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User suspended',
  })
  async suspendUser(@Param('userId') userId: string): Promise<User> {
    return this.adminService.toggleUserSuspension(userId, true);
  }

  @Patch('users/:userId/unsuspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unsuspend a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User unsuspended',
  })
  async unsuspendUser(@Param('userId') userId: string): Promise<User> {
    return this.adminService.toggleUserSuspension(userId, false);
  }

  @Patch('users/:userId/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a farmer by user ID' })
  @ApiParam({ name: 'userId', description: 'User ID of the farmer' })
  @ApiResponse({
    status: 200,
    description: 'Farmer verified successfully',
  })
  async verifyFarmer(
    @Param('userId') userId: string,
    @CurrentUser() admin: User,
  ) {
    return this.adminService.verifyFarmerByUserId(userId, admin.id);
  }

  @Patch('riders/:riderId/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a rider' })
  @ApiParam({ name: 'riderId', description: 'Rider ID' })
  @ApiResponse({
    status: 200,
    description: 'Rider verified',
  })
  async verifyRider(@Param('riderId') riderId: string): Promise<Rider> {
    return this.adminService.verifyRider(riderId);
  }

  @Patch('riders/:riderId/boost')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set manual priority boost for a rider' })
  @ApiParam({ name: 'riderId', description: 'Rider ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        boost: { type: 'number', description: 'Boost multiplier (1.0 to 5.0)', minimum: 1, maximum: 5 },
        expiresInHours: { type: 'number', description: 'Hours until boost expires (null for permanent)', nullable: true },
        reason: { type: 'string', description: 'Reason for the boost' },
      },
      required: ['boost', 'reason'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Boost applied successfully',
  })
  async setRiderBoost(
    @Param('riderId') riderId: string,
    @CurrentUser() admin: User,
    @Body() dto: { boost: number; expiresInHours?: number; reason: string },
  ) {
    return this.adminService.setRiderManualBoost(riderId, dto.boost, dto.expiresInHours, dto.reason, admin.id);
  }

  @Delete('riders/:riderId/boost')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove manual priority boost from a rider' })
  @ApiParam({ name: 'riderId', description: 'Rider ID' })
  @ApiResponse({
    status: 200,
    description: 'Boost removed successfully',
  })
  async removeRiderBoost(
    @Param('riderId') riderId: string,
    @CurrentUser() admin: User,
  ) {
    return this.adminService.removeRiderManualBoost(riderId, admin.id);
  }

  @Get('farmer-applications')
  @ApiOperation({ summary: 'Get all farmer applications' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'approved', 'rejected'] })
  @ApiResponse({
    status: 200,
    description: 'Paginated farmer applications list',
  })
  async getFarmerApplications(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.adminService.getFarmerApplications(page, limit, status);
  }

  @Patch('farmer-applications/:applicationId/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a farmer application' })
  @ApiParam({ name: 'applicationId', description: 'Farmer application ID' })
  @ApiResponse({
    status: 200,
    description: 'Application approved',
  })
  async approveFarmerApplication(
    @Param('applicationId') applicationId: string,
    @CurrentUser() admin: User,
  ) {
    return this.adminService.approveFarmerApplication(applicationId, admin.id);
  }

  @Patch('farmer-applications/:applicationId/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a farmer application' })
  @ApiParam({ name: 'applicationId', description: 'Farmer application ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Rejection reason' },
      },
      required: ['reason'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Application rejected',
  })
  async rejectFarmerApplication(
    @Param('applicationId') applicationId: string,
    @Body('reason') reason: string,
    @CurrentUser() admin: User,
  ) {
    return this.adminService.rejectFarmerApplication(applicationId, reason, admin.id);
  }

  // ==================== RIDER APPLICATIONS ====================

  @Get('rider-applications')
  @ApiOperation({ summary: 'Get all rider applications' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'approved', 'rejected'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Paginated rider applications list',
  })
  async getRiderApplications(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getRiderApplications(page, limit, status, search);
  }

  @Get('available-riders')
  @ApiOperation({ summary: 'Get available riders for order assignment' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 100 })
  @ApiQuery({ name: 'state', required: false, type: String, description: 'Filter riders by state (e.g., Lagos, Abuja)' })
  @ApiResponse({
    status: 200,
    description: 'List of available riders for assignment',
  })
  async getAvailableRiders(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('state') state?: string,
  ) {
    return this.adminService.getAvailableRiders(page, limit, state);
  }

  @Get('rider-applications/:applicationId')
  @ApiOperation({ summary: 'Get a single rider application' })
  @ApiParam({ name: 'applicationId', description: 'Rider application ID' })
  @ApiResponse({
    status: 200,
    description: 'Rider application details',
  })
  async getRiderApplication(@Param('applicationId') applicationId: string) {
    return this.adminService.getRiderApplication(applicationId);
  }

  @Patch('rider-applications/:applicationId/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a rider application' })
  @ApiParam({ name: 'applicationId', description: 'Rider application ID' })
  @ApiResponse({
    status: 200,
    description: 'Application approved',
  })
  async approveRiderApplication(
    @Param('applicationId') applicationId: string,
    @CurrentUser() admin: User,
  ) {
    return this.adminService.approveRiderApplication(applicationId, admin.id);
  }

  @Patch('rider-applications/:applicationId/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a rider application' })
  @ApiParam({ name: 'applicationId', description: 'Rider application ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Rejection reason' },
      },
      required: ['reason'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Application rejected',
  })
  async rejectRiderApplication(
    @Param('applicationId') applicationId: string,
    @Body('reason') reason: string,
    @CurrentUser() admin: User,
  ) {
    return this.adminService.rejectRiderApplication(applicationId, reason, admin.id);
  }

  @Get('products')
  @ApiOperation({ summary: 'Get all products with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Paginated products list',
  })
  async getAllProducts(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ): Promise<{ products: Product[]; total: number; pages: number }> {
    return this.adminService.getAllProducts(page, limit, category, search);
  }

  @Post('products')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a product as admin (for a farmer)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['farmerId', 'title', 'price', 'stock', 'category'],
      properties: {
        farmerId: { type: 'string', description: 'ID of the farmer to create product for' },
        title: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number' },
        unit: { type: 'string', default: 'kg' },
        stock: { type: 'number' },
        category: { type: 'string' },
        images: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Product created',
  })
  async createProduct(
    @Body() data: { farmerId: string } & Record<string, any>,
  ): Promise<Product> {
    const { farmerId, ...productData } = data;
    return this.adminService.createProductForFarmer(farmerId, productData);
  }

  @Patch('products/:productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Product updated',
  })
  async updateProduct(
    @Param('productId') productId: string,
    @Body() data: Record<string, any>,
  ): Promise<Product> {
    return this.adminService.updateProduct(productId, data);
  }

  @Delete('products/:productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a product' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Product deleted',
  })
  async deleteProduct(@Param('productId') productId: string): Promise<{ message: string }> {
    await this.adminService.deleteProduct(productId);
    return { message: 'Product deleted successfully' };
  }

  @Get('farmers/dropdown')
  @ApiOperation({ summary: 'Get verified farmers for dropdown selection' })
  @ApiResponse({
    status: 200,
    description: 'List of verified farmers',
  })
  async getFarmersForDropdown(): Promise<{ id: string; name: string; businessName: string }[]> {
    return this.adminService.getFarmersForDropdown();
  }

  // ==================== AUDIT LOGS ====================

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get audit logs with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'adminId', required: false, type: String })
  @ApiQuery({ name: 'targetId', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'List of audit logs',
  })
  async getAuditLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('action') action?: string,
    @Query('category') category?: string,
    @Query('adminId') adminId?: string,
    @Query('targetId') targetId?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getAuditLogs({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      action: action as any,
      category: category as any,
      adminId,
      targetId,
      search,
      startDate,
      endDate,
    });
  }

  @Get('audit-logs/stats')
  @ApiOperation({ summary: 'Get audit log statistics' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Audit log statistics',
  })
  async getAuditLogStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getAuditLogStats({ startDate, endDate });
  }

  @Get('audit-logs/admins')
  @ApiOperation({ summary: 'Get admins for audit log filtering' })
  @ApiResponse({
    status: 200,
    description: 'List of admins',
  })
  async getAdminsForDropdown(): Promise<{ id: string; name: string }[]> {
    return this.adminService.getAdminsForDropdown();
  }

  @Get('audit-logs/:id')
  @ApiOperation({ summary: 'Get audit log by ID' })
  @ApiParam({ name: 'id', description: 'Audit log ID' })
  @ApiResponse({
    status: 200,
    description: 'Audit log details',
  })
  async getAuditLogById(@Param('id') id: string) {
    return this.adminService.getAuditLogById(id);
  }

  // ==================== SETTINGS ====================

  @Get('settings')
  @ApiOperation({ summary: 'Get all application settings' })
  @ApiResponse({
    status: 200,
    description: 'Application settings',
  })
  async getSettings(): Promise<SettingsData> {
    return this.adminService.getSettings();
  }

  @Patch('settings/:category')
  @ApiOperation({ summary: 'Update settings by category' })
  @ApiParam({ name: 'category', description: 'Settings category (general, business, notifications, security, operational)' })
  @ApiBody({ description: 'Settings data to update' })
  @ApiResponse({
    status: 200,
    description: 'Updated settings',
  })
  async updateSettings(
    @Param('category') category: string,
    @Body() data: Partial<SettingsData>,
    @CurrentUser() user: User,
  ): Promise<SettingsData> {
    return this.adminService.updateSettings(category, data, user.id);
  }

  @Post('settings/initialize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initialize default settings' })
  @ApiResponse({
    status: 200,
    description: 'Settings initialized',
  })
  async initializeSettings(): Promise<{ message: string }> {
    await this.adminService.initializeSettings();
    return { message: 'Settings initialized successfully' };
  }

  // ==================== DISPATCH CONFIG ====================

  @Get('dispatch/config')
  @ApiOperation({ summary: 'Get dispatch configuration' })
  @ApiResponse({
    status: 200,
    description: 'Dispatch configuration',
  })
  async getDispatchConfig() {
    return this.adminService.getDispatchConfig();
  }

  @Patch('dispatch/config')
  @ApiOperation({ summary: 'Update dispatch configuration' })
  @ApiBody({ description: 'Dispatch configuration to update' })
  @ApiResponse({
    status: 200,
    description: 'Updated dispatch configuration',
  })
  async updateDispatchConfig(
    @Body() config: Record<string, any>,
    @CurrentUser() user: User,
  ) {
    return this.adminService.updateDispatchConfig(config, user.id);
  }

  // ==================== PRODUCT PROMOTION MANAGEMENT ====================

  @Patch('products/:productId/promote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle product promotion status' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        isPromoted: { type: 'boolean', description: 'Whether the product is promoted' },
        promotionDays: { type: 'number', description: 'Number of days for promotion (optional)' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Product promotion status updated' })
  async toggleProductPromotion(
    @Param('productId') productId: string,
    @Body() data: { isPromoted: boolean; promotionDays?: number },
    @CurrentUser() user: User,
  ): Promise<Product> {
    return this.adminService.toggleProductPromotion(productId, data.isPromoted, data.promotionDays, user.id);
  }

  @Patch('products/:productId/admin-product')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle admin product status (Official Store)' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        isAdminProduct: { type: 'boolean', description: 'Whether the product is an admin-curated product' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Admin product status updated' })
  async toggleAdminProduct(
    @Param('productId') productId: string,
    @Body() data: { isAdminProduct: boolean },
    @CurrentUser() user: User,
  ): Promise<Product> {
    return this.adminService.toggleAdminProduct(productId, data.isAdminProduct, user.id);
  }

  @Patch('products/:productId/recommendation-score')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update product recommendation score' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100, description: 'Recommendation score (0-100)' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Product recommendation score updated' })
  async updateRecommendationScore(
    @Param('productId') productId: string,
    @Body() data: { score: number },
    @CurrentUser() user: User,
  ): Promise<Product> {
    return this.adminService.updateRecommendationScore(productId, data.score, user.id);
  }

  @Get('products/promoted')
  @ApiOperation({ summary: 'Get all promoted products' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of promoted products' })
  async getPromotedProducts(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<{ products: Product[]; total: number; pages: number }> {
    return this.adminService.getPromotedProducts(page, limit);
  }

  @Get('products/admin-products')
  @ApiOperation({ summary: 'Get all admin-curated products' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of admin-curated products' })
  async getAdminCuratedProducts(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<{ products: Product[]; total: number; pages: number }> {
    return this.adminService.getAdminCuratedProducts(page, limit);
  }

  // ==================== PRODUCT APPROVAL ENDPOINTS ====================

  @Get('products/pending-approval')
  @ApiOperation({ summary: 'Get all products pending approval' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of products pending approval' })
  async getPendingApprovalProducts(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<{ products: Product[]; total: number; pages: number }> {
    return this.adminService.getPendingApprovalProducts(page, limit);
  }

  @Patch('products/:productId/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a product listing' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product approved successfully' })
  async approveProduct(
    @Param('productId') productId: string,
    @CurrentUser() user: User,
  ): Promise<Product> {
    return this.adminService.approveProduct(productId, user.id);
  }

  @Patch('products/:productId/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a product listing' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Rejection reason' },
      },
      required: ['reason'],
    },
  })
  @ApiResponse({ status: 200, description: 'Product rejected successfully' })
  async rejectProduct(
    @Param('productId') productId: string,
    @Body() data: { reason: string },
    @CurrentUser() user: User,
  ): Promise<Product> {
    return this.adminService.rejectProduct(productId, data.reason, user.id);
  }

  // ==================== PLATFORM REVENUE ENDPOINTS ====================

  @Get('revenue/dashboard')
  @ApiOperation({ summary: 'Get platform revenue dashboard' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Revenue dashboard data',
  })
  async getRevenueDashboard(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getRevenueDashboard(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('revenue/transactions')
  @ApiOperation({ summary: 'Get revenue transactions' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Revenue transactions',
  })
  async getRevenueTransactions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getRevenueTransactions(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      type as any,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('revenue/summary')
  @ApiOperation({ summary: 'Get revenue summary by period' })
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'weekly', 'monthly', 'yearly'] })
  @ApiResponse({
    status: 200,
    description: 'Revenue summary',
  })
  async getRevenueSummary(
    @Query('period') period?: 'daily' | 'weekly' | 'monthly' | 'yearly',
  ) {
    return this.adminService.getRevenueSummary(period || 'monthly');
  }

  // ==================== SUBSCRIPTION MANAGEMENT ====================

  @Get('subscriptions/dashboard')
  @ApiOperation({ summary: 'Get subscriptions dashboard overview' })
  @ApiResponse({
    status: 200,
    description: 'Subscription dashboard metrics for all user types',
  })
  async getSubscriptionsDashboard() {
    return this.adminService.getSubscriptionsDashboard();
  }

  @Get('subscriptions/farmers')
  @ApiOperation({ summary: 'Get farmer subscriptions' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'tier', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Paginated farmer subscriptions',
  })
  async getFarmerSubscriptions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('tier') tier?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getFarmerSubscriptions({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      status: status as any,
      tier: tier as any,
      search,
    });
  }

  @Get('subscriptions/riders')
  @ApiOperation({ summary: 'Get rider subscriptions' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'tier', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Paginated rider subscriptions',
  })
  async getRiderSubscriptions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('tier') tier?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getRiderSubscriptions({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      status: status as any,
      tier: tier as any,
      search,
    });
  }

  @Get('subscriptions/recent')
  @ApiOperation({ summary: 'Get recent subscriptions across all user types' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Recent subscriptions',
  })
  async getRecentSubscriptions(
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getRecentSubscriptions(
      limit ? parseInt(limit, 10) : 10
    );
  }

  @Get('subscriptions/revenue-chart')
  @ApiOperation({ summary: 'Get subscription revenue over time' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Subscription revenue chart data',
  })
  async getSubscriptionRevenueChart(
    @Query('days') days?: string,
  ) {
    return this.adminService.getSubscriptionRevenueOverTime(
      days ? parseInt(days, 10) : 30
    );
  }

  @Post('products/bulk-update-images')
  @ApiOperation({ summary: 'Add placeholder images to products without images' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Optional: only update products in this category' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Number of products updated',
  })
  async bulkUpdateProductImages(
    @Body('category') category?: string,
  ) {
    return this.adminService.bulkUpdateProductImages(category);
  }

  @Post('products/:productId/update-images')
  @ApiOperation({ summary: 'Update images for a specific product' })
  @ApiParam({ name: 'productId', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: { type: 'array', items: { type: 'string' }, description: 'Array of image URLs' },
      },
      required: ['images'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Product updated',
  })
  async updateProductImages(
    @Param('productId') productId: string,
    @Body('images') images: string[],
  ) {
    return this.adminService.updateProductImages(productId, images);
  }

  // ==================== ACCOUNT DELETION REQUEST MANAGEMENT ====================

  @Get('deletion-requests')
  @ApiOperation({ summary: 'Get all account deletion requests' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'status', required: false, enum: DeletionRequestStatus })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of deletion requests',
  })
  async getDeletionRequests(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: DeletionRequestStatus,
  ) {
    return this.usersService.getAllDeletionRequests(page, limit, status);
  }

  @Get('deletion-requests/stats')
  @ApiOperation({ summary: 'Get deletion request statistics' })
  @ApiResponse({
    status: 200,
    description: 'Deletion request statistics',
  })
  async getDeletionRequestStats() {
    return this.usersService.getDeletionRequestStats();
  }

  @Post('deletion-requests/:requestId/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Review (approve/reject) a deletion request' })
  @ApiParam({ name: 'requestId', description: 'Deletion request ID' })
  @ApiResponse({ status: 200, description: 'Request reviewed' })
  @ApiResponse({ status: 400, description: 'Request already reviewed or missing rejection reason' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  async reviewDeletionRequest(
    @Param('requestId') requestId: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: ReviewDeletionRequestDto,
  ) {
    return this.usersService.reviewDeletionRequest(requestId, adminId, dto);
  }

  @Post('deletion-requests/:requestId/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete account deletion (after grace period)' })
  @ApiParam({ name: 'requestId', description: 'Deletion request ID' })
  @ApiResponse({ status: 200, description: 'Account deleted' })
  @ApiResponse({ status: 400, description: 'Request not approved' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  async completeAccountDeletion(
    @Param('requestId') requestId: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.usersService.completeAccountDeletion(requestId, adminId);
  }

  // ==================== FREE DELIVERY PROMO ADMIN ENDPOINTS ====================

  @Get('promo/free-delivery/stats')
  @ApiOperation({ summary: 'Get free delivery promo statistics' })
  @ApiResponse({ status: 200, description: 'Promo statistics' })
  async getFreeDeliveryPromoStats() {
    return this.usersService.getFreeDeliveryPromoStats();
  }

  @Get('promo/free-delivery/users')
  @ApiOperation({ summary: 'Get users who claimed free delivery promo' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of users who claimed the promo' })
  async getFreeDeliveryPromoUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.usersService.getFreeDeliveryPromoUsers(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Post('notifications/broadcast')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send broadcast notification to users' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'message', 'type', 'targetAudience'],
      properties: {
        title: { type: 'string', example: 'Important Update' },
        message: { type: 'string', example: 'Check out our new features!' },
        type: { type: 'string', enum: ['info', 'warning', 'success', 'promo'], example: 'info' },
        targetAudience: { type: 'string', enum: ['all', 'buyers', 'farmers', 'riders'], example: 'all' },
        imageUrl: { type: 'string', example: '/uploads/notifications/promo.jpg', nullable: true },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Notification sent successfully' })
  async sendBroadcastNotification(
    @CurrentUser('id') adminId: string,
    @Body() body: { title: string; message: string; type: string; targetAudience: string; imageUrl?: string },
  ) {
    return this.notificationsService.sendBroadcastNotification(
      body.title,
      body.message,
      body.type,
      body.targetAudience,
      adminId,
      body.imageUrl,
    );
  }

  @Post('emails/promotional')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send promotional email to users' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['subject', 'content', 'template', 'targetAudience'],
      properties: {
        subject: { type: 'string', example: 'Special Offer Just for You!' },
        content: { type: 'string', example: 'We have exciting news to share with you...' },
        template: { 
          type: 'string', 
          enum: ['announcement', 'promotion', 'newsletter', 'update'], 
          example: 'promotion' 
        },
        targetAudience: { 
          type: 'string', 
          enum: ['all', 'buyers', 'farmers', 'riders'], 
          example: 'all' 
        },
        ctaButton: {
          type: 'object',
          properties: {
            text: { type: 'string', example: 'Shop Now' },
            url: { type: 'string', example: 'https://handwork.com/shop' },
          },
          nullable: true,
        },
        imageUrl: { 
          type: 'string', 
          example: 'https://example.com/promo-banner.jpg',
          nullable: true,
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Promotional emails sent successfully' })
  async sendPromotionalEmails(
    @CurrentUser('id') adminId: string,
    @Body() body: { 
      subject: string; 
      content: string; 
      template: 'announcement' | 'promotion' | 'newsletter' | 'update';
      targetAudience: 'all' | 'buyers' | 'farmers' | 'riders';
      ctaButton?: { text: string; url: string };
      imageUrl?: string;
    },
  ) {
    // Get users based on target audience
    const users = await this.adminService.getUsersForPromotionalEmail(body.targetAudience);
    
    // Log the CTA button for debugging
    console.log('📧 Promotional email request:', {
      subject: body.subject,
      template: body.template,
      targetAudience: body.targetAudience,
      ctaButton: body.ctaButton,
      imageUrl: body.imageUrl,
    });
    
    if (users.length === 0) {
      return { 
        success: false, 
        message: 'No users found for the selected audience',
        sent: 0,
        failed: 0,
      };
    }

    const result = await this.emailService.sendBulkPromotionalEmails(
      users.map(u => ({ email: u.email, firstName: u.firstName })),
      body.subject,
      body.content,
      body.template,
      body.ctaButton,
      body.imageUrl,
    );

    // Log the action
    await this.adminService.logAuditAction(
      adminId,
      'SEND_PROMOTIONAL_EMAIL',
      'EMAIL',
      `Sent ${body.template} email to ${body.targetAudience}: "${body.subject}" - ${result.sent} sent, ${result.failed} failed`,
    );

    return {
      success: true,
      message: `Promotional email sent to ${result.sent} users`,
      ...result,
      targetAudience: body.targetAudience,
      totalTargeted: users.length,
    };
  }
}
