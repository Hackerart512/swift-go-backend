// src/modules/drivers/dto/update-driver-location.dto.ts
import { IsLatitude, IsLongitude, IsNotEmpty } from 'class-validator';

export class UpdateDriverLocationDto {
  @IsNotEmpty()
  @IsLatitude()
  latitude: number;

  @IsNotEmpty()
  @IsLongitude()
  longitude: number;
}