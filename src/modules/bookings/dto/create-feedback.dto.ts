// src/modules/bookings/dto/create-feedback.dto.ts
import {
  IsInt,
  Min,
  Max,
  IsOptional,
  IsString,
  MaxLength,
  IsNumber,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFeedbackDto {
  @ApiProperty({ description: 'Rating for the ride (1-5)', example: 5 })
  @IsInt({ message: 'Rating must be an integer.' })
  @Min(1, { message: 'Rating must be at least 1.' })
  @Max(5, { message: 'Rating cannot be more than 5.' })
  @IsNotEmpty({ message: 'Rating is required.' }) // Assuming rating is mandatory for feedback
  rating: number;

  @ApiProperty({ description: 'Feedback comment', example: 'Great ride!', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000, {
    message: 'Feedback comment cannot exceed 1000 characters.',
  })
  comment?: string;

  @ApiProperty({ description: 'Tip amount for the driver', example: 50, required: false })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Tip amount must be a number with up to 2 decimal places.' },
  )
  @Min(0, { message: 'Tip amount cannot be negative.' }) // Allow 0 tip
  // @IsPositive({ message: 'Tip amount must be a positive number if provided.' }) // Use if tip must be > 0
  tipAmount?: number;
}
