import { ApiProperty } from '@nestjs/swagger';

export class OptimizedRouteDto {
  @ApiProperty({ description: 'Encoded polyline for the optimized route', example: 'abcd1234...' })
  polyline: string;

  @ApiProperty({ description: 'Waypoints in order', example: [{ latitude: 17.4169, longitude: 78.3720 }] })
  waypoints: { latitude: number; longitude: number }[];

  @ApiProperty({ description: 'Total distance in meters', example: 8500, required: false })
  totalDistance?: number;
} 