import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { FaqItem } from './faq-item.entity';

@Entity('help_categories')
export class HelpCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  @Index()
  title: string; // e.g., "Ride & Billing", "Account & App"

  @Column({ length: 100, nullable: true })
  iconName?: string; // Name of an icon for the client to use, e.g., "billing_icon"

  @Column({ type: 'int', default: 0 })
  sortOrder: number; // For ordering categories in the UI

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => FaqItem, faqItem => faqItem.category, { cascade: true })
  faqItems: FaqItem[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}