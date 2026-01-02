import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PriceAlertsService } from './price-alerts.service';

@Controller('price-alerts')
@UseGuards(JwtAuthGuard)
export class PriceAlertsController {
  constructor(private readonly priceAlertsService: PriceAlertsService) {}

  /**
   * Get recent price drops for user's favorited products
   */
  @Get('drops')
  async getUserPriceDrops(
    @Req() req: any,
    @Query('days') days?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 7;
    const drops = await this.priceAlertsService.getUserPriceDrops(req.user.userId, daysNum);
    
    return {
      success: true,
      data: drops.map(d => ({
        product: {
          id: d.product.id,
          title: d.product.title,
          currentPrice: d.product.price,
          images: d.product.images,
          farmerName: (d.product as any).farmer?.name || 'Unknown',
        },
        priceChange: {
          oldPrice: d.priceHistory.oldPrice,
          newPrice: d.priceHistory.newPrice,
          percentageOff: Math.abs(d.priceHistory.percentageChange),
          changedAt: d.priceHistory.createdAt,
        },
      })),
    };
  }

  /**
   * Get price history for a specific product
   */
  @Get('history/:productId')
  async getProductPriceHistory(
    @Req() req: any,
    @Query('limit') limit?: string,
  ) {
    const productId = req.params.productId;
    const limitNum = limit ? parseInt(limit, 10) : 30;
    const history = await this.priceAlertsService.getPriceHistory(productId, limitNum);
    
    return {
      success: true,
      data: history,
    };
  }
}
