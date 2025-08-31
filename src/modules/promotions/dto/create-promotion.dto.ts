import { IsString, IsNotEmpty, IsOptional, IsUrl, IsDateString, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class CreatePromotionDto {
   @ApiProperty({ description: 'Title of the promotion', example: 'Summer Sale' })
   @IsString() 
   @IsNotEmpty() @MaxLength(255)
   title: string;

   @ApiProperty({ description: 'Description of the promotion', example: 'Get 20% off on all rides this summer.' })
   @IsString() 
   @IsNotEmpty()
   description: string;

   @ApiProperty({ description: 'Image URL for the promotion', example: 'https://example.com/promo.jpg', required: false })
   @IsOptional() @IsUrl() @MaxLength(500)
   imageUrl?: string;

   @ApiProperty({ description: 'Terms and conditions link', example: 'https://example.com/terms', required: false })
   @IsOptional() @IsUrl() @MaxLength(500)
   termsLink?: string;

   @ApiProperty({ description: 'Promo code for the promotion', example: 'SUMMER20', required: false })
   @IsOptional() @IsString() @MaxLength(50)
   promoCode?: string;

   @ApiProperty({ description: 'Start date of the promotion (ISO 8601)', example: '2024-06-01', required: false })
   @IsOptional() @IsDateString()
   startDate?: string;

   @ApiProperty({ description: 'End date of the promotion (ISO 8601)', example: '2024-06-30', required: false })
   @IsOptional() @IsDateString()
   endDate?: string;

   @ApiProperty({ description: 'Whether the promotion is active', example: true, required: false })
   @IsOptional() @IsBoolean()
   isActive?: boolean;

   @ApiProperty({ description: 'Type of the promotion', example: 'discount', required: false })
   @IsOptional() @IsString() @MaxLength(100)
   type?: string;
 }