import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart, CartItem } from '../database/entities/cart.entity';
import { FlashSale, FlashSaleStatus } from '../database/entities/flash-sale.entity';
import { ProductsService } from '../products/products.service';
import { AddToCartDto, UpdateCartItemDto } from './dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(FlashSale)
    private readonly flashSaleRepository: Repository<FlashSale>,
    private readonly productsService: ProductsService,
  ) {}

  async getOrCreateCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepository.findOne({ where: { userId } });
    if (!cart) {
      cart = this.cartRepository.create({ userId, items: [] });
      await this.cartRepository.save(cart);
    }
    return cart;
  }

  async getCart(userId: string): Promise<Cart> {
    return this.getOrCreateCart(userId);
  }

  async addToCart(userId: string, dto: AddToCartDto): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);
    const product = await this.productsService.findById(dto.productId);

    if (!product.isAvailable) {
      throw new BadRequestException('Product is not available');
    }

    // Check for flash sale
    let flashSale: FlashSale | null = null;
    let itemPrice = Number(product.price);
    let originalPrice: number | undefined;
    let flashSaleEndsAt: string | undefined;

    if (dto.flashSaleId) {
      flashSale = await this.flashSaleRepository.findOne({
        where: { 
          id: dto.flashSaleId, 
          productId: dto.productId,
          status: FlashSaleStatus.ACTIVE,
        },
      });

      if (!flashSale) {
        throw new BadRequestException('Flash sale not found or has ended');
      }

      // Check if flash sale has ended
      if (new Date(flashSale.endTime) < new Date()) {
        throw new BadRequestException('This flash sale has ended');
      }

      // Check remaining quantity
      if (flashSale.soldQuantity + dto.quantity > flashSale.totalQuantity) {
        const remaining = flashSale.totalQuantity - flashSale.soldQuantity;
        throw new BadRequestException(`Only ${remaining} items available in this flash sale`);
      }

      // Use flash sale price
      originalPrice = Number(flashSale.originalPrice);
      itemPrice = Number(flashSale.salePrice);
      flashSaleEndsAt = flashSale.endTime.toISOString();
    } else {
      if (product.stock < dto.quantity) {
        throw new BadRequestException(`Only ${product.stock} items in stock`);
      }
    }

    // Check if item already in cart (with same flash sale)
    const existingIndex = cart.items.findIndex(
      (item) => item.productId === dto.productId && item.flashSaleId === dto.flashSaleId
    );

    if (existingIndex >= 0) {
      // Update quantity
      const newQuantity = cart.items[existingIndex].quantity + dto.quantity;
      
      if (flashSale) {
        if (flashSale.soldQuantity + newQuantity > flashSale.totalQuantity) {
          throw new BadRequestException(`Only ${flashSale.totalQuantity - flashSale.soldQuantity} items available`);
        }
      } else if (newQuantity > product.stock) {
        throw new BadRequestException(`Only ${product.stock} items in stock`);
      }
      
      cart.items[existingIndex].quantity = newQuantity;
    } else {
      // Add new item
      const cartItem: CartItem = {
        productId: product.id,
        title: product.title,
        price: itemPrice,
        originalPrice,
        quantity: dto.quantity,
        unit: product.unit,
        image: product.images?.[0],
        farmerId: product.farmerId,
        farmerName: product.farmer?.name || 'Unknown Farmer',
        pickupState: product.pickupState,
        pickupCity: product.pickupCity || '',
        pickupAddress: product.pickupAddress || 'Farm Location',
        pickupLat: product.pickupLat,
        pickupLng: product.pickupLng,
        flashSaleId: dto.flashSaleId,
        flashSaleEndsAt,
      };
      cart.items.push(cartItem);
    }

    this.recalculateCart(cart);
    return this.cartRepository.save(cart);
  }

  async updateCartItem(userId: string, dto: UpdateCartItemDto): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);
    const product = await this.productsService.findById(dto.productId);

    const itemIndex = cart.items.findIndex((item) => item.productId === dto.productId);
    if (itemIndex < 0) {
      throw new BadRequestException('Item not in cart');
    }

    if (dto.quantity <= 0) {
      // Remove item
      cart.items.splice(itemIndex, 1);
    } else {
      if (dto.quantity > product.stock) {
        throw new BadRequestException(`Only ${product.stock} items in stock`);
      }
      cart.items[itemIndex].quantity = dto.quantity;
    }

    this.recalculateCart(cart);
    return this.cartRepository.save(cart);
  }

  async removeFromCart(userId: string, productId: string): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);
    cart.items = cart.items.filter((item) => item.productId !== productId);
    this.recalculateCart(cart);
    return this.cartRepository.save(cart);
  }

  async clearCart(userId: string): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);
    cart.items = [];
    cart.itemCount = 0;
    cart.total = 0;
    return this.cartRepository.save(cart);
  }

  private recalculateCart(cart: Cart): void {
    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
}
