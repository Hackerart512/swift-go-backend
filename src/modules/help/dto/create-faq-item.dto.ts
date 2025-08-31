import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsBoolean, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFaqItemDto {
   @ApiProperty({ description: 'Category ID for the FAQ', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
   @IsUUID() @IsNotEmpty()
   categoryId: string;
   @ApiProperty({ description: 'Question text', example: 'How do I reset my password?' })
   @IsString() @IsNotEmpty() @MaxLength(500)
   question: string;
   @ApiProperty({ description: 'Answer text', example: 'Go to settings and click on "Reset Password".' })
   @IsString() @IsNotEmpty()
   answer: string;
   @ApiProperty({ description: 'Sort order for display', example: 0, required: false })
   @IsOptional() @IsInt() @Min(0)
   sortOrder?: number = 0;
   @ApiProperty({ description: 'Whether the FAQ is active', example: true, required: false })
   @IsOptional() @IsBoolean()
   isActive?: boolean = true;
 }