// src/modules/suggestions/entities/route-suggestion.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/users.entity'; // Assuming User entity path

export enum SuggestedRideType {
  MORNING = 'morning',
  EVENING = 'evening',
}

@Entity('route_suggestions')
export class RouteSuggestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string; // To link to the user who made the suggestion

  @ManyToOne(() => User, { eager: false, onDelete: 'SET NULL' }) // If user is deleted, keep suggestion but nullify userId
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'text' })
  startLocationAddress: string; // e.g., "C95F+J2M, Manikonda Jagir, Hyderabad..."

  @Column({ type: 'text' })
  endLocationAddress: string;

  @Column({ type: 'enum', enum: SuggestedRideType })
  rideType: SuggestedRideType;

  @Column({ type: 'varchar', length: 50 }) // e.g., "09:00 AM"
  desiredArrivalTime: string;

  @Column({ type: 'boolean', default: false })
  updateProfilePreferences: boolean;

  @Column({ type: 'text', nullable: true })
  suggestionText?: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' }) // e.g., pending, considered, implemented, rejected
  status: string; // Admin can update this status

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}