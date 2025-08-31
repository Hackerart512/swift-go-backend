import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { VehicleType } from './vehicle-type.entity';
import { ScheduledTrip } from '../../trips/entities/scheduled-trip.entity';
// import { ScheduledTrip } from '../../trips/entities/scheduled-trip.entity'; // For later
export enum VehicleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  UNDER_MAINTENANCE = 'under_maintenance',
}

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 20 })
  @Index()
  registrationNumber: string;

  @Column({ length: 100, nullable: true })
  modelName?: string; // e.g., "Maruti Dzire", "Hyundai Creta"

  @Column({ length: 50, nullable: true }) // e.g., "White", "Silver"
  color?: string;

  @Column()
  vehicleTypeId: string;

  @ManyToOne(() => VehicleType, (type) => type.vehicles, {
    eager: true,
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'vehicleTypeId' })
  vehicleType: VehicleType; // Eager load type for convenience

  @OneToMany(() => ScheduledTrip, (trip) => trip.vehicle)
  scheduledTrips: ScheduledTrip[];
  // This specific car's usable passenger capacity.
  // If null, defaults to vehicleType.passengerCapacity.
  @Column({ type: 'int', nullable: true })
  actualPassengerCapacity?: number;

  @Column({ type: 'enum', enum: VehicleStatus, default: VehicleStatus.ACTIVE })
  status: VehicleStatus;

  // @OneToMany(() => ScheduledTrip, scheduledTrip => scheduledTrip.vehicle) // For later
  // scheduledTrips: ScheduledTrip[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  get effectivePassengerCapacity(): number {
    return (
      this.actualPassengerCapacity ?? this.vehicleType?.passengerCapacity ?? 0
    );
  }
}
