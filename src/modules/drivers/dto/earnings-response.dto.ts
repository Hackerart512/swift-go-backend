import { ApiProperty } from '@nestjs/swagger';
import { DailyEarningItemDto } from './daily-earning-item.dto';
import { WeeklyEarningDto } from './weekly-earning.dto';

export class EarningsResponseDto {
  @ApiProperty({
    description: "Total earnings in the last 1 month",
    example: 12491.22,
  })
  lastMonthTotal: number;

  @ApiProperty({
    description: "Total number of rides in the last 1 month",
    example: 244,
  })
  lastMonthRides: number;

  @ApiProperty({
    description: "Total hours online in the last 1 month",
    example: "25D 12H",
  })
  lastMonthHours: string; // Formatted as "XD YH"

  @ApiProperty({
    description: "Current withdrawable balance",
    example: 1544.00,
  })
  totalBalance: number;

  @ApiProperty({
    description: "Earnings for each of the last 7 days for the bar chart",
    type: [WeeklyEarningDto],
    example: [
      { day: 'Mo', amount: 1500 },
      { day: 'Tu', amount: 2100 },
      { day: 'We', amount: 500 },
      { day: 'Th', amount: 1400 },
      { day: 'Fr', amount: 2200 },
      { day: 'Sa', amount: 800 },
      { day: 'Su', amount: 1300 },
    ],
  })
  weeklyEarnings: WeeklyEarningDto[];

  @ApiProperty({
    description: "List of daily earnings for the past several days",
    type: [DailyEarningItemDto],
  })
  dailyEarnings: DailyEarningItemDto[];

  constructor(partial: Partial<EarningsResponseDto>) {
    Object.assign(this, partial);
  }
}