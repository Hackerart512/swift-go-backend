import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Driver } from './driver.entity';

@Entity('driver_wallets')
export class DriverWallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  driverId: string;

  @OneToOne(() => Driver, { onDelete: 'CASCADE' }) // If driver is deleted, wallet is too
  @JoinColumn({ name: 'driverId' })
  driver: Driver;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  withdrawableBalance: number;

  @Column({ type: 'varchar', length: 10, default: 'INR' })
  currency: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}