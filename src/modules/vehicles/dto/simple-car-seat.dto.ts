/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class SimpleCarSeatDto {
  @ApiProperty({ description: 'Seat ID', example: '1A' })
  @IsString() @IsNotEmpty() @MaxLength(50) seatId: string;

  @ApiProperty({ description: 'Description of the seat', example: 'Front left window seat' })
  @IsString() @IsNotEmpty() @MaxLength(100) description: string;

  @ApiProperty({ description: 'Whether the seat is bookable', example: true })
  @IsBoolean() @IsNotEmpty() isBookable: boolean;
}
