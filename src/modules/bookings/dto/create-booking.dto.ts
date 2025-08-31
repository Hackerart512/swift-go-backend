// src/modules/bookings/dto/create-booking.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsArray,
  ArrayNotEmpty,
  IsOptional,
  IsBoolean,
  MaxLength,
  IsEnum,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Define your enums here
export enum PaymentMethodType {
  SWIFTGO_BALANCE = 'swiftgo_balance',
  PHONEPE = 'phonepe',
  CARD = 'card',
  CASH = 'cash',
  WALLET = 'wallet',
  RAZORPAY = 'razorpay',
}

// --- FIX: Using a clear tripType enum instead of a boolean flag ---
export enum BookingTripType {
  ONE_WAY = 'oneway',
  ROUNDTRIP = 'roundtrip',
}

export class CreateBookingDto {
  // --- FIX: The tripType field is now mandatory ---
  @ApiProperty({
    description: 'The type of booking.',
    enum: BookingTripType,
    example: BookingTripType.ONE_WAY,
  })
  @IsEnum(BookingTripType)
  @IsNotEmpty()
  tripType: BookingTripType;

  // --- Onward Trip Details (Always required) ---
  @ApiProperty({ description: 'The UUID of the onward scheduled trip to book.' })
  @IsUUID('4', { message: 'Onward scheduled trip ID must be a valid UUID.' })
  @IsNotEmpty({ message: 'Onward scheduled trip ID should not be empty.' })
  onwardScheduledTripId: string;

  @ApiProperty({ description: 'The UUID of the onward pickup stop.' })
  @IsUUID('4', { message: 'Onward pickup stop ID must be a valid UUID.' })
  @IsNotEmpty({ message: 'Onward pickup stop ID should not be empty.' })
  onwardPickupStopId: string;

  @ApiProperty({ description: 'The UUID of the onward drop-off stop.' })
  @IsUUID('4', { message: 'Onward drop-off stop ID must be a valid UUID.' })
  @IsNotEmpty({ message: 'Onward drop-off stop ID should not be empty.' })
  onwardDropOffStopId: string;

  @ApiProperty({ description: 'The seat IDs being booked for the onward trip.' })
  @IsArray()
  @ArrayNotEmpty({ message: 'At least one seat must be selected for the onward trip.' })
  @IsString({ each: true })
  onwardSelectedSeatIds: string[];

  // --- Return Trip Details (Validated only if tripType is 'roundtrip') ---
  
  // --- FIX: The validation condition is now clearer and more reliable ---
  @ValidateIf((o) => o.tripType === BookingTripType.ROUNDTRIP)
  @ApiPropertyOptional({ description: 'The UUID of the return scheduled trip (required for round trip).' })
  @IsUUID('4', { message: 'Return scheduled trip ID must be a valid UUID.' })
  @IsNotEmpty({ message: 'Return scheduled trip ID is required for a round trip.' })
  returnScheduledTripId?: string;

  @ValidateIf((o) => o.tripType === BookingTripType.ROUNDTRIP)
  @ApiPropertyOptional({ description: 'The UUID of the return pickup stop (required for round trip).' })
  @IsUUID('4', { message: 'Return pickup stop ID must be a valid UUID.' })
  @IsNotEmpty({ message: 'Return pickup stop ID is required for a round trip.' })
  returnPickupStopId?: string;

  @ValidateIf((o) => o.tripType === BookingTripType.ROUNDTRIP)
  @ApiPropertyOptional({ description: 'The UUID of the return drop-off stop (required for round trip).' })
  @IsUUID('4', { message: 'Return drop-off stop ID must be a valid UUID.' })
  @IsNotEmpty({ message: 'Return drop-off stop ID is required for a round trip.' })
  returnDropOffStopId?: string;

  @ValidateIf((o) => o.tripType === BookingTripType.ROUNDTRIP)
  @ApiPropertyOptional({ description: 'The seat IDs being booked for the return trip (required for round trip).' })
  @IsArray()
  @ArrayNotEmpty({ message: 'At least one seat must be selected for the return trip.' })
  @IsString({ each: true })
  returnSelectedSeatIds?: string[];

  // --- Common Booking Details (Unchanged) ---
  @ApiProperty({ description: 'The payment method chosen by the user.', enum: PaymentMethodType, example: PaymentMethodType.CASH })
  @IsEnum(PaymentMethodType, { message: 'A valid payment method must be provided.' })
  @IsNotEmpty()
  paymentMethod: PaymentMethodType;

  @ApiPropertyOptional({ description: 'Coupon code applied to the booking.' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  couponCode?: string;

  @ApiPropertyOptional({ description: 'Reference ID from the payment gateway.' })
  @IsOptional()
  @IsString()
  paymentGatewayReferenceId?: string;

  @ApiPropertyOptional({ description: 'Additional notes for the booking.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bookingNotes?: string;

  @ApiPropertyOptional({ description: 'Whether vehicle damage protection is opted for.' })
  @IsOptional()
  @IsBoolean()
  vehicleDamageProtection?: boolean;
}