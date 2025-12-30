import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BillsService } from './bills.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { 
  BillType, 
  GetBillersDto, 
  GetBillerPackagesDto, 
  ValidateCustomerDto, 
  PayBillDto,
  BuyAirtimeDto,
  BuyDataDto,
} from './dto';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; role: string };
}

@ApiTags('Bills')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bills')
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Get('billers')
  @ApiOperation({ summary: 'Get list of billers by type' })
  @ApiQuery({ name: 'type', enum: BillType, required: true })
  @ApiResponse({ status: 200, description: 'List of billers retrieved successfully' })
  async getBillers(@Query() dto: GetBillersDto) {
    return this.billsService.getBillers(dto.type);
  }

  @Get('packages')
  @ApiOperation({ summary: 'Get packages/plans for a biller' })
  @ApiQuery({ name: 'billerCode', type: String, required: true })
  @ApiResponse({ status: 200, description: 'Biller packages retrieved successfully' })
  async getBillerPackages(@Query() dto: GetBillerPackagesDto) {
    return this.billsService.getBillerPackages(dto.billerCode);
  }

  @Get('validate')
  @ApiOperation({ summary: 'Validate customer ID (meter number, decoder number, etc.)' })
  @ApiResponse({ status: 200, description: 'Customer validated successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async validateCustomer(@Query() dto: ValidateCustomerDto) {
    return this.billsService.validateCustomer(dto);
  }

  @Post('pay')
  @ApiOperation({ summary: 'Pay a bill using wallet balance' })
  @ApiResponse({ status: 200, description: 'Bill paid successfully' })
  @ApiResponse({ status: 400, description: 'Payment failed' })
  async payBill(@Req() req: AuthenticatedRequest, @Body() dto: PayBillDto) {
    return this.billsService.payBill(req.user.id, dto);
  }

  @Post('airtime')
  @ApiOperation({ summary: 'Quick buy airtime' })
  @ApiResponse({ status: 200, description: 'Airtime purchased successfully' })
  @ApiResponse({ status: 400, description: 'Purchase failed' })
  async buyAirtime(@Req() req: AuthenticatedRequest, @Body() dto: BuyAirtimeDto) {
    return this.billsService.buyAirtime(
      req.user.id,
      dto.phoneNumber,
      dto.amount,
      dto.provider,
    );
  }

  @Post('data')
  @ApiOperation({ summary: 'Buy data bundle' })
  @ApiResponse({ status: 200, description: 'Data purchased successfully' })
  @ApiResponse({ status: 400, description: 'Purchase failed' })
  async buyData(@Req() req: AuthenticatedRequest, @Body() dto: BuyDataDto) {
    return this.billsService.payBill(req.user.id, {
      type: BillType.DATA,
      billerCode: dto.billerCode,
      itemCode: dto.packageCode,
      customerId: dto.phoneNumber,
      amount: dto.amount,
      customerName: dto.phoneNumber,
    });
  }

  @Get('history')
  @ApiOperation({ summary: 'Get bill payment history' })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Bill history retrieved successfully' })
  async getBillHistory(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.billsService.getBillHistory(req.user.id, page || 1, limit || 20);
  }

  @Get('types')
  @ApiOperation({ summary: 'Get available bill types' })
  @ApiResponse({ status: 200, description: 'Bill types retrieved successfully' })
  getBillTypes() {
    return [
      { type: BillType.AIRTIME, name: 'Airtime', icon: 'phone' },
      { type: BillType.DATA, name: 'Data', icon: 'wifi' },
      { type: BillType.ELECTRICITY, name: 'Electricity', icon: 'flash' },
      { type: BillType.TV, name: 'TV/Cable', icon: 'tv' },
      { type: BillType.INTERNET, name: 'Internet', icon: 'globe' },
    ];
  }

  @Get('providers')
  @ApiOperation({ summary: 'Get network providers for airtime/data' })
  @ApiResponse({ status: 200, description: 'Providers retrieved successfully' })
  getNetworkProviders() {
    return [
      { code: 'mtn', name: 'MTN', color: '#FFCC00' },
      { code: 'airtel', name: 'Airtel', color: '#FF0000' },
      { code: 'glo', name: 'Glo', color: '#00A651' },
      { code: '9mobile', name: '9mobile', color: '#006B4F' },
    ];
  }
}
