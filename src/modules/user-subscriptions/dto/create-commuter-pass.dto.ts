// src/modules/user-subscriptions/dto/create-commuter-pass.dto.ts

// --- MODIFICATION: Added IsDateString to the import list ---
import { IsString, IsNotEmpty, IsOptional, IsObject, IsUUID, IsEnum, ValidateIf, ValidateNested, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SubscriptionCommuteType } from '../entities/user-subscription.entity';

class CoordinatesDto {
  @ApiProperty({ example: 17.4169 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 78.372 })
  @IsNumber()
  longitude: number;
}

class MockPaymentDetailsDto {
  @ApiProperty({ description: 'Transaction ID for the payment', example: 'MOCK_PAY_123' })
  @IsString() @IsNotEmpty() transactionId: string;
  @ApiProperty({ description: 'Payment gateway used', example: 'mock' })
  @IsString() @IsNotEmpty() gateway: string = 'mock';
}

export class CreateCommuterPassDto {
  @ApiProperty({ description: 'ID of the subscription plan to purchase.', example: '90a0f9dc-2741-4855-b243-256f8de67159' })
  @IsUUID() @IsNotEmpty()
  planId: string;

  // --- NEW FIELD START ---
  @ApiProperty({
    description: 'The date and time when the subscription should start. Must be in ISO 8601 format.',
    example: '2025-08-15T09:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  subscriptionStartDate: string;
  // --- NEW FIELD END ---

  @ApiProperty({ description: 'The type of commute pass.', enum: SubscriptionCommuteType, example: SubscriptionCommuteType.ROUNDTRIP })
  @IsEnum(SubscriptionCommuteType) @IsNotEmpty()
  commuteType: SubscriptionCommuteType;

  @ApiProperty({ description: 'The primary (e.g., home) pickup location.' })
  @IsObject() @ValidateNested() @Type(() => CoordinatesDto) @IsNotEmpty()
  pickupLocation: CoordinatesDto;

  @ApiProperty({ description: 'The primary (e.g., work) drop-off location.' })
  @IsObject() @ValidateNested() @Type(() => CoordinatesDto) @IsNotEmpty()
  dropOffLocation: CoordinatesDto;

  @ApiProperty({ description: 'The return pickup location. Required for roundtrip.', required: false })
  @ValidateIf(o => o.commuteType === SubscriptionCommuteType.ROUNDTRIP)
  @IsObject() @ValidateNested() @Type(() => CoordinatesDto) @IsNotEmpty({ message: 'Return pickup location is required for a roundtrip pass.' })
  returnPickupLocation?: CoordinatesDto;

  @ApiProperty({ description: 'The return drop-off location. Required for roundtrip.', required: false })
  @ValidateIf(o => o.commuteType === SubscriptionCommuteType.ROUNDTRIP)
  @IsObject() @ValidateNested() @Type(() => CoordinatesDto) @IsNotEmpty({ message: 'Return drop-off location is required for a roundtrip pass.' })
  returnDropoffLocation?: CoordinatesDto;
}

// NOTE: The decorators in this class will now work because of the updated import statement.
export class SubscribeToRouteDto {
  @ApiProperty({ description: 'ID of the subscription plan', example: 'plan_abc123' })
  @IsString()
  @IsNotEmpty()
  planId: string;

  @ApiProperty({ description: 'ID of the route', example: 'route_abc123' })
  @IsUUID() @IsNotEmpty()
  routeId: string;
  
  @ApiProperty({ description: 'Payment confirmation details', type: MockPaymentDetailsDto, required: false })
  @IsOptional()
  @IsObject()
  paymentConfirmation?: MockPaymentDetailsDto;
}