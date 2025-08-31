import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Point,
} from 'typeorm';
import { Route } from './route.entity';

export enum StopType {
  PICKUP = 'pickup',
  DROPOFF = 'dropoff',
  PICKUP_DROPOFF = 'pickup_dropoff', // Can be used for both
}

@Entity('route_stops')
@Index(['routeId', 'sequence'], { unique: true }) // Sequence must be unique within a route
export class RouteStop {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  routeId: string;

  @ManyToOne(() => Route, route => route.stops, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'routeId' })
  route: Route;

  @Column({ length: 255 })
  name: string; // e.g., "Lanco Hills Main Gate", "DLF Cyber City Tower 3"

  @Column({ type: 'text', nullable: true })
  addressDetails?: string; // e.g., "Opposite to Starbucks", "Near Building C"

  @Index({ spatial: true }) // Creates a spatial index for fast location queries
  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326, // Standard GPS coordinates (latitude/longitude)
    nullable: true,
  })
  location: { type: 'Point'; coordinates: [number, number] };

  @Column({ type: 'enum', enum: StopType, default: StopType.PICKUP_DROPOFF })
  type: StopType;

  @Column({ type: 'int' })
  sequence: number; // The order of this stop along this specific route

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // You can add virtual getters if you want to easily access lat/lng
  get latitude(): number | undefined {
    return this.location?.coordinates[1];
  }

  get longitude(): number | undefined {
    return this.location?.coordinates[0];
  }
}

// Added `routeId` column explicitly to `RouteStop` for easier querying if needed, though the relation `route: Route` also provides it. It's common to have both for convenience, especially if `route` relation is not always eager-loaded`.
