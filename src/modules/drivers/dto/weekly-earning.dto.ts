import { ApiProperty } from '@nestjs/swagger';

export class WeeklyEarningDto {
  @ApiProperty({ example: 'Mo' })
  day: string;

  @ApiProperty({ example: 1500 })
  amount: number;
}