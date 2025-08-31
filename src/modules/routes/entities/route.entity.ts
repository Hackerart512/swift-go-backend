// src/modules/routes/entities/route.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { RouteStop } from './route-stop.entity';
import { ScheduledTrip } from '../../trips/entities/scheduled-trip.entity';

@Entity('routes')
export class Route {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  @Index()
  name: string; // e.g., "Manikonda to Gachibowli (Morning Shuttle)"

  @Column({ length: 255 })
  originAreaName: string; // e.g., "Manikonda Area"

  @Column({ length: 255 })
  destinationAreaName: string; // e.g., "Gachibowli Financial District"

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: true })
  isActive: boolean;

  // This relationship is crucial. `cascade: true` allows us to save a route and all its
  // new/updated stops in a single .save() call from the service.
  @OneToMany(() => RouteStop, (stop) => stop.route, {
    cascade: true,
    eager: false, // Eager false is a good choice for performance.
  })
  stops: RouteStop[];

  @OneToMany(() => ScheduledTrip, (scheduledTrip) => scheduledTrip.route)
  scheduledTrips: ScheduledTrip[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}