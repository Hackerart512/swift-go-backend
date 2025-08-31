import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional, MaxLength, Min, Max } from 'class-validator';
import { FavoriteLocationType } from '../entities/favorite-location.entity';
 
 export class CreateFavoriteLocationDto {
   @IsString() @IsNotEmpty() @MaxLength(255)
   address: string;

   @IsNumber() @IsNotEmpty() @Min(-90) @Max(90)
   latitude: number;

   @IsNumber() @IsNotEmpty() @Min(-180) @Max(180)
   longitude: number;

   @IsEnum(FavoriteLocationType) @IsNotEmpty()
   type: FavoriteLocationType;

   @IsOptional() @IsString() @MaxLength(100)
   name?: string; // Required if type is 'other', can be validated in service
 }
