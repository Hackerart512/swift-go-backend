// src/tasks/subscription.task.ts

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserSubscriptionsService } from '../modules/user-subscriptions/user-subscriptions.service';

@Injectable()
export class SubscriptionTasksService {
  private readonly logger = new Logger(SubscriptionTasksService.name);

  constructor(
    private readonly userSubscriptionsService: UserSubscriptionsService,
  ) {}

  /**
   * This task runs every 5 minutes.
   * It finds subscriptions that are 'SCHEDULED' and whose start date has passed,
   * then updates their status to 'ACTIVE'.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleActivateScheduledSubscriptions() {
    this.logger.log('Running job: Activate Scheduled Subscriptions...');
    try {
      await this.userSubscriptionsService.activateScheduledSubscriptions();
      this.logger.log('Successfully activated due subscriptions.');
    } catch (error) {
      this.logger.error('Failed to activate scheduled subscriptions', error.stack);
    }
  }

  /**
   * This task runs once a day at midnight.
   * It finds subscriptions that are 'ACTIVE' or 'TRIAL' and whose end date has passed,
   * then updates their status to 'EXPIRED'.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpireSubscriptions() {
    this.logger.log('Running job: Expire Old Subscriptions...');
    try {
      await this.userSubscriptionsService.updateExpiredSubscriptions();
      this.logger.log('Successfully expired old subscriptions.');
    } catch (error) {
      this.logger.error('Failed to expire old subscriptions', error.stack);
    }
  }
}