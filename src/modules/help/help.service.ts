// src/modules/help/help.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HelpCategory } from './entities/help-category.entity';
import { FaqItem } from './entities/faq-item.entity';
import { CreateHelpCategoryDto } from './dto/create-help-category.dto';
import { UpdateHelpCategoryDto } from './dto/update-help-category.dto';
import { CreateFaqItemDto } from './dto/create-faq-item.dto';
import { UpdateFaqItemDto } from './dto/update-faq-item.dto';

@Injectable()
export class HelpService {
  constructor(
    @InjectRepository(HelpCategory)
    private readonly categoryRepository: Repository<HelpCategory>,
    @InjectRepository(FaqItem)
    private readonly faqItemRepository: Repository<FaqItem>,
  ) {}

  // --- Admin: Category Management ---
  async createCategory(dto: CreateHelpCategoryDto): Promise<HelpCategory> {
    const existing = await this.categoryRepository.findOneBy({ title: dto.title });
    if (existing) throw new ConflictException('A help category with this title already exists.');
    const category = this.categoryRepository.create(dto);
    return this.categoryRepository.save(category);
  }
  async updateCategory(id: string, dto: UpdateHelpCategoryDto): Promise<HelpCategory> {
    const category = await this.categoryRepository.preload({ id, ...dto });
    if (!category) throw new NotFoundException(`Help category with ID ${id} not found.`);
    return this.categoryRepository.save(category);
  }
  async removeCategory(id: string): Promise<void> {
    const result = await this.categoryRepository.delete(id); // Cascade will delete related FAQs
    if (result.affected === 0) throw new NotFoundException(`Help category with ID ${id} not found.`);
  }
  async findAllCategoriesForAdmin(): Promise<HelpCategory[]> {
    return this.categoryRepository.find({ order: { sortOrder: 'ASC' } });
  }

  // --- Admin: FAQ Item Management ---
  async createFaqItem(dto: CreateFaqItemDto): Promise<FaqItem> {
    const category = await this.categoryRepository.findOneBy({ id: dto.categoryId });
    if (!category) throw new NotFoundException(`Help category with ID ${dto.categoryId} not found.`);
    const faqItem = this.faqItemRepository.create(dto);
    return this.faqItemRepository.save(faqItem);
  }
  async updateFaqItem(id: string, dto: UpdateFaqItemDto): Promise<FaqItem> {
    const faqItem = await this.faqItemRepository.preload({ id, ...dto });
    if (!faqItem) throw new NotFoundException(`FAQ item with ID ${id} not found.`);
    return this.faqItemRepository.save(faqItem);
  }
  async removeFaqItem(id: string): Promise<void> {
    const result = await this.faqItemRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException(`FAQ item with ID ${id} not found.`);
  }
  async findAllFaqItemsForAdmin(): Promise<FaqItem[]> {
    return this.faqItemRepository.find({ 
      relations: ['category'], 
      order: { 
        category: { sortOrder: 'ASC' },
        sortOrder: 'ASC' 
      } 
    });
  }


  // --- Passenger Facing Methods ---
  async findActiveCategories(): Promise<HelpCategory[]> {
    return this.categoryRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
      select: ['id', 'title', 'iconName'], // Only return fields needed for the list
    });
  }

  async findActiveFaqsByCategory(categoryId: string): Promise<FaqItem[]> {
    // First, check if the category itself is active
    const category = await this.categoryRepository.findOneBy({ id: categoryId, isActive: true });
    if (!category) throw new NotFoundException('Help category not found or is not active.');

    return this.faqItemRepository.find({
      where: { categoryId, isActive: true },
      order: { sortOrder: 'ASC' },
      select: ['id', 'question'], // Only return fields needed for the question list
    });
  }

  async findOneFaqItem(faqId: string): Promise<FaqItem> {
    const faqItem = await this.faqItemRepository.findOne({
      where: { id: faqId, isActive: true },
    });
    if (!faqItem) {
      throw new NotFoundException(`FAQ item with ID ${faqId} not found or is not active.`);
    }
    return faqItem; // Returns the full object including question and answer
  }

  async submitFaqFeedback(faqId: string, wasHelpful: boolean): Promise<void> {
    const query = wasHelpful
      ? { helpfulCount: () => 'helpfulCount + 1' }
      : { notHelpfulCount: () => 'notHelpfulCount + 1' };
    const result = await this.faqItemRepository.update({ id: faqId }, query);
    if (result.affected === 0) {
      throw new NotFoundException(`FAQ item with ID ${faqId} not found.`);
    }
  }
}