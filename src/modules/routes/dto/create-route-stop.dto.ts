import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, Min, Max, IsInt, ValidateIf, MaxLength, IsBoolean } from 'class-validator';
import { StopType } from '../entities/route-stop.entity';
export class CreateRouteStopDto {
   @IsString() @IsNotEmpty() @MaxLength(255)
   name: string;

   @IsOptional() @IsString() @MaxLength(500)
   addressDetails?: string;

   @IsNumber() @Min(-90) @Max(90) @IsNotEmpty()
   latitude: number;

   @IsNumber() @Min(-180) @Max(180) @IsNotEmpty()
   longitude: number;

   @IsEnum(StopType) @IsNotEmpty()
   type: StopType;

   @IsInt() @Min(1) @IsNotEmpty()
   sequence: number;

   @IsOptional() @IsBoolean()
   isActive?: boolean = true;
}