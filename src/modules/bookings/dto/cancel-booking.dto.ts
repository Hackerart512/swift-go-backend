/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// src/modules/bookings/dto/cancel-booking.dto.ts
import {
  IsString,
  IsOptional,
  MaxLength,
  IsEnum,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Define the predefined reasons from the UI as an enum
export enum CancellationReasonCode {
  WAITING_TOO_LONG = 'waiting_too_long',
  UNABLE_TO_CONTACT_DRIVER = 'unable_to_contact_driver',
  // Add more predefined codes as your UI evolves
  // e.g., DRIVER_DENIED_PICKUP = 'driver_denied_pickup',
  //      PLANS_CHANGED = 'plans_changed'
}

export class CancelBookingDto {
  @ApiProperty({ description: 'Predefined cancellation reason code', enum: CancellationReasonCode, example: CancellationReasonCode.WAITING_TOO_LONG, required: false })
  @IsOptional()
  @IsEnum(CancellationReasonCode, {
    message: 'Predefined reason is not valid.',
  })
  predefinedReason?: CancellationReasonCode; // e.g., 'waiting_too_long'

  @ApiProperty({ description: 'Custom cancellation reason', example: 'Plans changed', required: false })
  @IsOptional()
  @IsString({ message: 'Custom reason must be a string.' })
  @MaxLength(255, { message: 'Custom reason cannot exceed 255 characters.' })
  // This validation will only run if predefinedReason is not provided.
  @ValidateIf((o) => !o.predefinedReason && o.otherReason)
  otherReason?: string; // For the "Other" text field
}
