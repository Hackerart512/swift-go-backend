import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class DeclineBookingDto {
  @ApiProperty({
    description: 'The reason why the driver is declining the booking.',
    example: 'Passenger was not at the pickup location.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  reason: string;
}