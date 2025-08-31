// src/modules/routes/routes.module.ts

import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoutesService } from './routes.service';
import { RoutesController } from './routes.controller';
import { Route } from './entities/route.entity';
import { RouteStop } from './entities/route-stop.entity';
import { AdminRoutesController } from './admin-routes.controller';

// --- We need the entity to register its repository ---
import { ScheduledTrip } from '../trips/entities/scheduled-trip.entity'; 

@Module({
  imports: [
    // --- THIS IS THE FIX ---
    // Add ScheduledTrip here to make its repository available inside this module
    TypeOrmModule.forFeature([Route, RouteStop, ScheduledTrip]),

    // We no longer need to import TripsModule or AuthModule here for this specific fix,
    // unless other parts of your Routes module depend on them.
    // For now, let's keep it clean.
  ],
  controllers: [RoutesController, AdminRoutesController], 
  providers: [RoutesService],
  exports: [RoutesService],
})
export class RoutesModule {}