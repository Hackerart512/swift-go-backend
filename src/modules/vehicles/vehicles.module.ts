import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { VehicleType } from './entities/vehicle-type.entity';
import { VehiclesService } from './vehicle.service';
import { VehicleTypesService } from './vehicle-types.service';
import { VehiclesController } from './vehicles.controller';
import { VehicleTypesController } from './vehicle-types.controller';
// import { AuthModule } from '../auth/auth.module'; // If using JwtAuthGuard

@Module({
  imports: [
    TypeOrmModule.forFeature([Vehicle, VehicleType]),
    // AuthModule,
  ],
  controllers: [VehiclesController, VehicleTypesController],
  providers: [VehiclesService, VehicleTypesService],
  exports: [VehiclesService, VehicleTypesService],
})
export class VehiclesModule {}
