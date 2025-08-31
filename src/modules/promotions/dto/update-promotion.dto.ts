import { IsString, IsOptional, IsUrl, IsDateString, IsBoolean, MaxLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types'; // For easy partial updates
import { CreatePromotionDto } from './create-promotion.dto';
export class UpdatePromotionDto extends PartialType(CreatePromotionDto) {}
 // This automatically makes all fields from CreatePromotionDto optional
 // and inherits their validation decorators.

