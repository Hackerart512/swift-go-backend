import { IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class FaqFeedbackDto {
  @ApiProperty({ description: 'Whether the FAQ was helpful', example: true })
  @IsBoolean() @IsNotEmpty() wasHelpful: boolean;
}