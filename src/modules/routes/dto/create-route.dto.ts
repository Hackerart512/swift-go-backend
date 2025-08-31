import { IsString, IsNotEmpty, IsArray, ValidateNested, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateRouteStopDto } from './create-route-stop.dto';
export class CreateRouteDto {
   @ApiProperty({ description: 'Name of the route', example: 'Downtown to Airport' })
   @IsString() @IsNotEmpty() @MaxLength(255)
   name: string;

   @ApiProperty({ description: 'Origin area name', example: 'Downtown' })
   @IsString() @IsNotEmpty() @MaxLength(255)
   originAreaName: string;

   @ApiProperty({ description: 'Destination area name', example: 'Airport' })
   @IsString() @IsNotEmpty() @MaxLength(255)
   destinationAreaName: string;

   @ApiProperty({ description: 'Description of the route', example: 'Express route with no stops in between', required: false })
   @IsOptional() @IsString()
   description?: string;

   @ApiProperty({ description: 'Whether the route is active', example: true, required: false })
   @IsOptional() @IsBoolean()
   isActive?: boolean = true;

   @ApiProperty({ description: 'Stops for the route', type: [CreateRouteStopDto] })
   @IsArray()
   @ValidateNested({ each: true }) // Validates each object in the array
   @Type(() => CreateRouteStopDto) // Important for class-validator to know the type of array items
   stops: CreateRouteStopDto[];
 }