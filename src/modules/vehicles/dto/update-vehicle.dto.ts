import { PartialType } from '@nestjs/mapped-types';
import { CreateVehicleDto } from './create-vehicle.dto';
import { IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {
  @ApiProperty({
    description: 'The UUID of the user (driver) who owns/is assigned to the vehicle. Can be null to un-assign.',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsUUID('4', { message: 'ownerId must be a valid UUID if provided.' })
  ownerId?: string | null;
}