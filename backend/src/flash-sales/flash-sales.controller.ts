import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, FarmerGuard } from '../auth/guards';
import { FlashSalesService } from './flash-sales.service';
import { CreateFlashSaleDto, UpdateFlashSaleDto, QueryFlashSalesDto } from './dto';

@ApiTags('Flash Sales')
@Controller('flash-sales')
export class FlashSalesController {
  constructor(private readonly flashSalesService: FlashSalesService) {}

  @Get()
  @ApiOperation({ summary: 'Get active flash sales' })
  getActive(@Query() query: QueryFlashSalesDto) {
    return this.flashSalesService.getActive(query);
  }

  @Get('today')
  @ApiOperation({ summary: 'Get today\'s deals' })
  getTodaysDeals() {
    return this.flashSalesService.getTodaysDeals();
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming flash sales' })
  getUpcoming(@Query() query: QueryFlashSalesDto) {
    return this.flashSalesService.getUpcoming(query);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, FarmerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my flash sales (farmer)' })
  getMyFlashSales(@Request() req: any, @Query() query: QueryFlashSalesDto) {
    return this.flashSalesService.getByFarmer(req.user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get flash sale by ID' })
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.flashSalesService.getById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, FarmerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a flash sale (farmer)' })
  create(@Request() req: any, @Body() dto: CreateFlashSaleDto) {
    return this.flashSalesService.create(req.user.id, dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, FarmerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a flash sale (farmer)' })
  update(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFlashSaleDto,
  ) {
    return this.flashSalesService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, FarmerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a flash sale (farmer)' })
  cancel(@Request() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.flashSalesService.cancel(id, req.user.id);
  }
}
