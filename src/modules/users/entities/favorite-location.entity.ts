// src/modules/users/entities/favorite-location.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users.entity'; // User entity from the same module

export enum FavoriteLocationType {
  HOME = 'home',
  WORK = 'work',
  OTHER = 'other',
}

@Entity('favorite_locations')
export class FavoriteLocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, user => user.favoriteLocations, { onDelete: 'CASCADE' }) // Define the inverse relation in User entity
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 255 })
  address: string;

  @Column('decimal', { precision: 10, scale: 7 }) // For latitude
  latitude: number;

  @Column('decimal', { precision: 10, scale: 7 }) // For longitude
  longitude: number;

  @Column({
    type: 'enum',
    enum: FavoriteLocationType,
  })
  type: FavoriteLocationType;

  @Column({ type: 'varchar', length: 100, nullable: true }) // Name for 'other' type or general label
  name?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}