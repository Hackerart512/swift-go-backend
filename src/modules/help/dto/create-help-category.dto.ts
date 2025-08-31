import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateHelpCategoryDto {
   @ApiProperty({ description: 'Title of the help category', example: 'Account Issues' })
   @IsString() @IsNotEmpty() @MaxLength(100)
   title: string;
   @ApiProperty({ description: 'Icon name for the category', example: 'help-outline', required: false })
   @IsOptional() @IsString() @MaxLength(100)
   iconName?: string;
   @ApiProperty({ description: 'Sort order for display', example: 0, required: false })
   @IsOptional() @IsInt() @Min(0)
   sortOrder?: number = 0;
   @ApiProperty({ description: 'Whether the category is active', example: true, required: false })
   @IsOptional() @IsBoolean()
   isActive?: boolean = true;
 }