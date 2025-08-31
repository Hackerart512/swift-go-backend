// src/modules/user-subscriptions/user-subscriptions.service.ts

/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, In, MoreThan, MoreThanOrEqual } from 'typeorm';
import {
  UserSubscription,
  UserSubscriptionStatus,
  SubscriptionCommuteType,
} from './entities/user-subscription.entity';
import { SubscriptionPlan, PlanDurationUnit } from '../subscription-plans/entities/subscription-plan.entity';
import { SubscriptionPlansService } from '../subscription-plans/subscription-plans.service';
import { UsersService } from '../users/users.service';
import { addDays, addMonths, addYears } from 'date-fns';
import { RoutesService } from '../routes/routes.service';
import { CreateCommuterPassDto } from './dto/create-commuter-pass.dto';

interface Coordinates {
  latitude: number;
  longitude: number;
}

@Injectable()
export class UserSubscriptionsService {
  constructor(
    @InjectRepository(UserSubscription)
    private readonly userSubscriptionRepository: Repository<UserSubscription>,
    private readonly plansService: SubscriptionPlansService,
    private readonly usersService: UsersService,
    private readonly routesService: RoutesService,
    private readonly entityManager: EntityManager,
  ) {}

  async createCommuterPass(userId: string, dto: CreateCommuterPassDto): Promise<UserSubscription | UserSubscription[]> {
    // ================== SPYLOG START ==================
    console.log('\n--- [DEBUG] Starting createCommuterPass ---');
    console.log('[DEBUG] Received DTO:', JSON.stringify(dto, null, 2));

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    const plan = await this.plansService.findOneForAdmin(dto.planId);
    if (!plan || !plan.isActive) {
      throw new NotFoundException(`Subscription plan ${dto.planId} not found or is inactive.`);
    }

    const subscriptionStartDate = new Date(dto.subscriptionStartDate);
    if (isNaN(subscriptionStartDate.getTime()) || subscriptionStartDate < new Date()) {
      throw new BadRequestException('Subscription start date must be a valid date and cannot be in the past.');
    }

    const searchRadiusInMeters = 2000;

    console.log('[DEBUG] Searching for ONWARD PICKUP stop near:', dto.pickupLocation);
    const onwardPickupStop = await this.routesService.findNearestStop(dto.pickupLocation, 'pickup', searchRadiusInMeters);
    console.log('[DEBUG] Found ONWARD PICKUP stop:', onwardPickupStop ? { id: onwardPickupStop.id, name: onwardPickupStop.name, routeId: onwardPickupStop.routeId } : 'NONE');

    console.log('[DEBUG] Searching for ONWARD DROPOFF stop near:', dto.dropOffLocation);
    const onwardDropOffStop = await this.routesService.findNearestStop(dto.dropOffLocation, 'dropoff', searchRadiusInMeters);
    console.log('[DEBUG] Found ONWARD DROPOFF stop:', onwardDropOffStop ? { id: onwardDropOffStop.id, name: onwardDropOffStop.name, routeId: onwardDropOffStop.routeId } : 'NONE');

    if (!onwardPickupStop || !onwardDropOffStop) {
        throw new NotFoundException('Could not find a valid pickup or drop-off stop near the provided onward locations.');
    }
    // =================== SPYLOG END ===================

    return this.entityManager.transaction(async (transactionManager) => {
      if (dto.commuteType === SubscriptionCommuteType.ROUNDTRIP) {
        // ... roundtrip logic (we will debug this later if needed)
        const returnPickupStop = await this.routesService.findNearestStop(dto.returnPickupLocation!, 'pickup', searchRadiusInMeters);
        const returnDropOffStop = await this.routesService.findNearestStop(dto.returnDropoffLocation!, 'dropoff', searchRadiusInMeters);
        if (!returnPickupStop || !returnDropOffStop) {
            throw new NotFoundException('Could not find a valid pickup or drop-off stop near the provided return locations.');
        }
        const morningPass = await this.createSinglePass(transactionManager, userId, plan, { commuteType: SubscriptionCommuteType.MORNING, pickupStopId: onwardPickupStop.id, dropOffStopId: onwardDropOffStop.id }, subscriptionStartDate);
        const eveningPass = await this.createSinglePass(transactionManager, userId, plan, { commuteType: SubscriptionCommuteType.EVENING, pickupStopId: returnPickupStop.id, dropOffStopId: returnDropOffStop.id }, subscriptionStartDate);
        return [morningPass, eveningPass];
      } else {
        return this.createSinglePass(transactionManager, userId, plan, {
            commuteType: dto.commuteType,
            pickupStopId: onwardPickupStop.id,
            dropOffStopId: onwardDropOffStop.id,
        }, subscriptionStartDate);
      }
    });
  }

  private async createSinglePass(
    manager: EntityManager,
    userId: string,
    plan: SubscriptionPlan,
    passDetails: {
      commuteType: SubscriptionCommuteType.MORNING | SubscriptionCommuteType.EVENING;
      pickupStopId: string;
      dropOffStopId: string;
    },
    scheduledStartDate: Date,
  ): Promise<UserSubscription> {
    // ================== SPYLOG START ==================
    console.log(`\n--- [DEBUG] Starting createSinglePass for ${passDetails.commuteType} commute ---`);
    console.log(`[DEBUG] Checking for route between stops: ${passDetails.pickupStopId} and ${passDetails.dropOffStopId}`);

    const routeForStops = await this.routesService.findRouteContainingStops(passDetails.pickupStopId, passDetails.dropOffStopId);
    console.log('[DEBUG] Route check successful:', !!routeForStops);
    // =================== SPYLOG END ===================

    if (!routeForStops) {
      throw new BadRequestException(`The selected stops for the ${passDetails.commuteType} commute do not form a valid route.`);
    }

    // ... rest of the function remains the same ...
    const userSubRepo = manager.getRepository(UserSubscription);
    const existingSub = await userSubRepo.findOne({
      where: {
        userId,
        validForPickupStopId: passDetails.pickupStopId,
        validForDropOffStopId: passDetails.dropOffStopId,
        commuteType: passDetails.commuteType,
        status: In([UserSubscriptionStatus.ACTIVE, UserSubscriptionStatus.TRIAL, UserSubscriptionStatus.SCHEDULED]),
        endDate: MoreThan(scheduledStartDate),
      },
    });
    if (existingSub) {
      throw new ConflictException(`You already have an active or scheduled subscription for the ${passDetails.commuteType} commute.`);
    }
    const paymentDetails = { gateway: 'mock', transactionId: `MOCK_TRANS_${Date.now()}`, orderId: `MOCK_ORDER_${Date.now()}`, amountPaid: plan.price, currency: plan.currency };
    let startDate = scheduledStartDate;
    let endDate: Date;
    let trialEndDate: Date | undefined = undefined;
    const now = new Date();
    let status = scheduledStartDate > now ? UserSubscriptionStatus.SCHEDULED : UserSubscriptionStatus.ACTIVE;
    if (plan.trialDays && plan.trialDays > 0) {
      status = scheduledStartDate > now ? UserSubscriptionStatus.SCHEDULED : UserSubscriptionStatus.TRIAL;
      trialEndDate = addDays(startDate, plan.trialDays);
      startDate = trialEndDate;
    }
    switch (plan.durationUnit) {
      case PlanDurationUnit.DAY: endDate = addDays(startDate, plan.durationValue); break;
      case PlanDurationUnit.MONTH: endDate = addMonths(startDate, plan.durationValue); break;
      case PlanDurationUnit.YEAR: endDate = addYears(startDate, plan.durationValue); break;
      default: throw new InternalServerErrorException('Invalid plan duration unit.');
    }
    const newSubscription = userSubRepo.create({
      userId,
      planId: plan.id,
      plan,
      startDate: scheduledStartDate,
      endDate,
      trialEndDate,
      status,
      remainingRides: plan.ridesIncluded,
      paymentDetails,
      autoRenew: false,
      validForPickupStopId: passDetails.pickupStopId,
      validForDropOffStopId: passDetails.dropOffStopId,
      commuteType: passDetails.commuteType,
    });
    return userSubRepo.save(newSubscription);
  }

  // ... other service methods ...
  async findUserSubscriptionHistory(userId: string): Promise<UserSubscription[]> {
    return this.userSubscriptionRepository.find({ where: { userId }, relations: ['plan'], order: { createdAt: 'DESC' } });
  }

  async consumeRide(userId: string, numberOfSeatsToConsume: number, bookingDetails: { pickupStopId: string; dropOffStopId: string; tripTime: Date }, manager?: EntityManager): Promise<{ success: boolean; message?: string; userSubscription?: UserSubscription }> {
    const now = new Date();
    if (!bookingDetails || !manager) {
      return { success: false, message: 'Booking details and transaction manager are required for this operation.' };
    }
    const userSubRepo = manager.getRepository(UserSubscription);
    const commuteType = (bookingDetails.tripTime.getUTCHours() < 12 ? SubscriptionCommuteType.MORNING : SubscriptionCommuteType.EVENING);
    const activeSub = await userSubRepo.findOne({
      where: {
        userId,
        validForPickupStopId: bookingDetails.pickupStopId,
        validForDropOffStopId: bookingDetails.dropOffStopId,
        commuteType: commuteType,
        status: In([UserSubscriptionStatus.ACTIVE, UserSubscriptionStatus.TRIAL]),
        endDate: MoreThan(now),
      },
    });
    if (!activeSub) {
      return { success: false, message: 'No active subscription found for this specific commute.' };
    }
    if (activeSub.plan && activeSub.plan.ridesIncluded != null) {
      if (activeSub.remainingRides != null && activeSub.remainingRides >= numberOfSeatsToConsume) {
        activeSub.remainingRides -= numberOfSeatsToConsume;
        await userSubRepo.save(activeSub);
        return { success: true, message: `${numberOfSeatsToConsume} ride(s) consumed.`, userSubscription: activeSub };
      } else {
        return { success: false, message: `Ride limit reached for your subscription. Available: ${activeSub.remainingRides}, Requested: ${numberOfSeatsToConsume}.` };
      }
    }
    return { success: true, message: 'Unlimited rides plan used for this commute.', userSubscription: activeSub };
  }

  async findUserActiveSubscription(userId: string, manager?: EntityManager): Promise<UserSubscription | null> {
    const repository = manager ? manager.getRepository(UserSubscription) : this.userSubscriptionRepository;
    return await repository.findOne({ where: { userId, status: In([UserSubscriptionStatus.ACTIVE, UserSubscriptionStatus.TRIAL]), endDate: MoreThanOrEqual(new Date()) }, order: { endDate: 'DESC' }, relations: ['plan'] });
  }

  async activateScheduledSubscriptions(): Promise<void> {
    const now = new Date();
    await this.userSubscriptionRepository.createQueryBuilder().update(UserSubscription).set({ status: UserSubscriptionStatus.ACTIVE }).where('startDate <= :now', { now }).andWhere('status = :scheduledStatus', { scheduledStatus: UserSubscriptionStatus.SCHEDULED }).execute();
    console.log('Checked and activated scheduled subscriptions.');
  }

  async updateExpiredSubscriptions(): Promise<void> {
    const now = new Date();
    await this.userSubscriptionRepository.createQueryBuilder().update(UserSubscription).set({ status: UserSubscriptionStatus.EXPIRED }).where('endDate < :now', { now }).andWhere('status IN (:...activeStatuses)', { activeStatuses: [UserSubscriptionStatus.ACTIVE, UserSubscriptionStatus.TRIAL] }).execute();
    console.log('Checked and updated expired subscriptions.');
  }
}