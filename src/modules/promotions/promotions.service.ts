// src/modules/promotions/promotions.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, IsNull, Or } from 'typeorm';
import { Promotion } from './entities/promotion.entity';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';

@Injectable()
export class PromotionsService {
  constructor(
    @InjectRepository(Promotion)
    private readonly promotionRepository: Repository<Promotion>,
  ) {}

  // --- Admin Methods ---
  async create(createPromotionDto: CreatePromotionDto): Promise<Promotion> {
    const promotion = this.promotionRepository.create({
      ...createPromotionDto,
      // Convert date strings to Date objects if necessary
      startDate: createPromotionDto.startDate ? new Date(createPromotionDto.startDate) : undefined,
      endDate: createPromotionDto.endDate ? new Date(createPromotionDto.endDate) : undefined,
    });
    return this.promotionRepository.save(promotion);
  }

  async findAllForAdmin(): Promise<Promotion[]> { // Admin sees all, active or not
    return this.promotionRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOneForAdmin(id: string): Promise<Promotion> {
    const promotion = await this.promotionRepository.findOneBy({ id });
    if (!promotion) {
      throw new NotFoundException(`Promotion with ID ${id} not found`);
    }
    return promotion;
  }

  async update(id: string, updatePromotionDto: UpdatePromotionDto): Promise<Promotion> {
    // TypeORM's preload method is good for updates: it loads the entity and merges new data.
    const promotion = await this.promotionRepository.preload({
      id: id,
      ...updatePromotionDto,
      // Convert date strings to Date objects if present in DTO
      ...(updatePromotionDto.startDate && { startDate: new Date(updatePromotionDto.startDate) }),
      ...(updatePromotionDto.endDate && { endDate: new Date(updatePromotionDto.endDate) }),
    });
    if (!promotion) {
      throw new NotFoundException(`Promotion with ID ${id} not found`);
    }
    return this.promotionRepository.save(promotion);
  }

  async remove(id: string): Promise<void> {
    const result = await this.promotionRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Promotion with ID ${id} not found`);
    }
  }

  // --- Passenger Facing Method ---
  async findActiveForPassengers(): Promise<Promotion[]> {
    const currentDate = new Date();
    return this.promotionRepository.find({
      where: {
        isActive: true,
        // Promo is active if:
        // 1. startDate is null OR startDate is in the past/present
        // AND
        // 2. endDate is null OR endDate is in the future/present
        startDate: Or(IsNull(), LessThanOrEqual(currentDate)),
        endDate: Or(IsNull(), MoreThanOrEqual(currentDate)),
      },
      order: { createdAt: 'DESC' }, // Or some other priority field
    });
  }
}