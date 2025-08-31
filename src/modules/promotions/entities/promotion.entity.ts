// src/modules/promotions/entities/promotion.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('promotions')
export class Promotion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string; // e.g., "Get 30% OFF"

  @Column({ type: 'text' })
  description: string; // e.g., "For new users"

  @Column({ type: 'varchar', length: 500, nullable: true }) // URL to the promo image
  imageUrl?: string;

  @Column({ type: 'varchar', length: 500, nullable: true }) // URL to terms and conditions page
  termsLink?: string;

  @Column({ type: 'varchar', length: 50, nullable: true }) // e.g., "NEWUSER30"
  promoCode?: string; // Optional, if the promo involves a code

  @Column({ type: 'timestamptz', nullable: true }) // When the promo starts
  startDate?: Date;

  @Column({ type: 'timestamptz', nullable: true }) // When the promo ends
  endDate?: Date;

  @Column({ default: false }) // Admin sets this to true to make it live
  isActive: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true }) // e.g., "homepage_banner", "ride_discount"
  type?: string; // For categorizing or targeting promotions

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}