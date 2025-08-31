import { ApiProperty } from '@nestjs/swagger';

export class DailyEarningItemDto {
  @ApiProperty({ example: '2024-04-25T00:00:00.000Z' })
  date: string;

  @ApiProperty({ example: 'Today' })
  label: string;

  @ApiProperty({ example: 1000 })
  amount: number;

  constructor(date: Date, label: string, amount: number) {
    this.date = date.toISOString();
    this.label = label;
    this.amount = Number(amount.toFixed(2));
  }
}