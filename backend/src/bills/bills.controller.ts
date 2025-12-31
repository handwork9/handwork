import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
  Request,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
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
  PayElectricityDto,
  PayTvDto,
  FundBettingDto,
  PayInternetDto,
  GetBillHistoryDto,
  CalculateFeeDto,
  QueryTransactionDto,
} from './dto';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; role: string };
}

@ApiTags('Bills')
@Controller('bills')
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  // Public endpoints - no auth required for listing billers/packages
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

  // Protected endpoints - require authentication
  @Post('pay')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pay a bill using wallet balance' })
  @ApiResponse({ status: 200, description: 'Bill paid successfully' })
  @ApiResponse({ status: 400, description: 'Payment failed' })
  async payBill(@Req() req: AuthenticatedRequest, @Body() dto: PayBillDto) {
    return this.billsService.payBill(req.user.id, dto);
  }

  @Post('airtime')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Quick buy airtime' })
  @ApiResponse({ status: 200, description: 'Airtime purchased successfully' })
  @ApiResponse({ status: 400, description: 'Purchase failed' })
  async buyAirtime(@Req() req: AuthenticatedRequest, @Body() dto: BuyAirtimeDto) {
    return this.billsService.buyAirtime(req.user.id, dto);
  }

  @Post('data')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get bill payment history' })
  @ApiResponse({ status: 200, description: 'Bill history retrieved successfully' })
  async getBillHistory(
    @Req() req: AuthenticatedRequest,
    @Query() dto: GetBillHistoryDto,
  ) {
    return this.billsService.getBillHistory(req.user.id, dto);
  }

  // New specialized endpoints
  @Post('electricity')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pay electricity bill' })
  @ApiResponse({ status: 200, description: 'Electricity bill paid successfully' })
  async payElectricity(@Req() req: AuthenticatedRequest, @Body() dto: PayElectricityDto) {
    return this.billsService.payElectricity(req.user.id, dto);
  }

  @Post('tv')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pay TV subscription' })
  @ApiResponse({ status: 200, description: 'TV subscription paid successfully' })
  async payTv(@Req() req: AuthenticatedRequest, @Body() dto: PayTvDto) {
    return this.billsService.payTv(req.user.id, dto);
  }

  @Post('betting')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fund betting account' })
  @ApiResponse({ status: 200, description: 'Betting account funded successfully' })
  async fundBetting(@Req() req: AuthenticatedRequest, @Body() dto: FundBettingDto) {
    return this.billsService.fundBetting(req.user.id, dto);
  }

  @Post('internet')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pay internet subscription' })
  @ApiResponse({ status: 200, description: 'Internet subscription paid successfully' })
  async payInternet(@Req() req: AuthenticatedRequest, @Body() dto: PayInternetDto) {
    return this.billsService.payInternet(req.user.id, dto);
  }

  @Get('fee')
  @ApiOperation({ summary: 'Calculate fee for a bill payment' })
  @ApiResponse({ status: 200, description: 'Fee calculated successfully' })
  async calculateFee(@Query() dto: CalculateFeeDto) {
    return this.billsService.getFeeCalculation(dto);
  }

  @Get('transaction/:reference')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Query transaction status' })
  @ApiParam({ name: 'reference', description: 'Transaction reference' })
  @ApiResponse({ status: 200, description: 'Transaction status retrieved' })
  async queryTransaction(@Param('reference') reference: string) {
    return this.billsService.queryTransaction(reference);
  }

  // Public endpoints - bill types and providers
  @Get('types')
  @ApiOperation({ summary: 'Get available bill types with details' })
  @ApiResponse({ status: 200, description: 'Bill types retrieved successfully' })
  async getBillTypes() {
    return this.billsService.getBillTypes();
  }

  @Get('providers')
  @ApiOperation({ summary: 'Get network providers for airtime/data' })
  @ApiResponse({ status: 200, description: 'Providers retrieved successfully' })
  getNetworkProviders() {
    return this.billsService.getNetworkProviders();
  }
}
