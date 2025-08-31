// src/modules/subscription-plans/subscription-plans.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';

@Injectable()
export class SubscriptionPlansService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly planRepository: Repository<SubscriptionPlan>,
  ) {}

  // --- Admin Methods ---
  async create(
    createDto: CreateSubscriptionPlanDto,
  ): Promise<SubscriptionPlan> {
    const plan = this.planRepository.create(createDto);
    return this.planRepository.save(plan);
  }

  async findAllForAdmin(): Promise<SubscriptionPlan[]> {
    return this.planRepository.find({
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findOneForAdmin(id: string): Promise<SubscriptionPlan> {
    const plan = await this.planRepository.findOneBy({ id });
    if (!plan) {
      throw new NotFoundException(`Subscription plan with ID ${id} not found`);
    }
    return plan;
  }

  async update(
    id: string,
    updateDto: UpdateSubscriptionPlanDto,
  ): Promise<SubscriptionPlan> {
    const plan = await this.planRepository.preload({ id, ...updateDto });
    if (!plan) {
      throw new NotFoundException(`Subscription plan with ID ${id} not found`);
    }
    return this.planRepository.save(plan);
  }

  async remove(id: string): Promise<void> {
    // Consider if a plan can be deleted if users are subscribed to it.
    // Soft delete or deactivation might be better (isActive = false).
    const result = await this.planRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Subscription plan with ID ${id} not found`);
    }
  }

  // --- Passenger Facing Method ---
  async findAllActiveForPassengers(): Promise<SubscriptionPlan[]> {
    return this.planRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', price: 'ASC' }, // Example ordering
    });
  }
}
