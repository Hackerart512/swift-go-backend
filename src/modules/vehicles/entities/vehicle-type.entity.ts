// src/modules/vehicles/entities/vehicle-type.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Vehicle } from './vehicle.entity';

export interface SimpleCarSeat {
  seatId: string;
  description: string;
  isBookable: boolean;
}

@Entity('vehicle_types')
export class VehicleType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  @Index()
  name: string; // e.g., "Sedan - 3 Passengers"

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int' })
  passengerCapacity: number;

  @Column({ type: 'jsonb', nullable: true })
  simpleSeatIdentifiers?: SimpleCarSeat[];

  // --- THESE ARE THE TWO NEWLY ADDED-BACK COLUMNS ---
  @Column({ nullable: true }) // Assuming string like 'Automatic' or 'Manual'
  transmissionType: string;

  @Column({ nullable: true }) // Assuming string like 'Economy', 'SUV', 'Luxury'
  category: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Vehicle, (vehicle) => vehicle.vehicleType)
  vehicles: Vehicle[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}