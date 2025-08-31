import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
  IsBoolean,
  IsInt,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PlanDurationUnit } from '../entities/subscription-plan.entity';
export class CreateSubscriptionPlanDto {
  @ApiProperty({ description: 'Name of the subscription plan', example: 'Monthly Saver' })
  @IsString() @IsNotEmpty() name: string;

  @ApiProperty({ description: 'Description of the plan', example: 'Unlimited rides for a month', required: false })
  @IsOptional() @IsString() description?: string;

  @ApiProperty({ description: 'Price of the plan', example: 499 })
  @IsNumber() @Min(0) price: number;

  @ApiProperty({ description: 'Currency for the plan', example: 'INR', required: false })
  @IsOptional() @IsString() currency?: string = 'INR';

  @ApiProperty({ description: 'Duration value', example: 1 })
  @IsInt() @Min(1) durationValue: number;

  @ApiProperty({ description: 'Duration unit', enum: PlanDurationUnit, example: PlanDurationUnit.MONTH })
  @IsEnum(PlanDurationUnit) durationUnit: PlanDurationUnit;

  @ApiProperty({ description: 'Number of rides included', example: 30, required: false })
  @IsOptional() @IsInt() @Min(1) ridesIncluded?: number;

  @ApiProperty({ description: 'Number of trial days', example: 7, required: false })
  @IsOptional() @IsInt() @Min(0) trialDays?: number = 0;

  @ApiProperty({ description: 'Whether the plan is active', example: true, required: false })
  @IsOptional() @IsBoolean() isActive?: boolean = true;

  @ApiProperty({ description: 'Sort order for display', example: 0, required: false })
  @IsOptional() @IsInt() sortOrder?: number = 0;
}
