import { IsString, IsNumber, IsEnum, IsOptional, MaxLength, Min, Max } from 'class-validator';
import { FavoriteLocationType } from '../entities/favorite-location.entity';
export class UpdateFavoriteLocationDto {
   @IsOptional() @IsString() @MaxLength(255)
   address?: string;

   @IsOptional() @IsNumber() @Min(-90) @Max(90)
   latitude?: number;

   @IsOptional() @IsNumber() @Min(-180) @Max(180)
   longitude?: number;

   @IsOptional() @IsEnum(FavoriteLocationType)
   type?: FavoriteLocationType;

   @IsOptional() @IsString() @MaxLength(100)
   name?: string;
 }