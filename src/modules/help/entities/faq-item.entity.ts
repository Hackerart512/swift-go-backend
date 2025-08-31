import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { HelpCategory } from './help-category.entity';

@Entity('faq_items')
export class FaqItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  categoryId: string;

  @ManyToOne(() => HelpCategory, category => category.faqItems, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'categoryId' })
  category: HelpCategory;

  @Column({ type: 'varchar', length: 500 })
  @Index()
  question: string;

  @Column({ type: 'text' })
  answer: string; // Can contain plain text, HTML, or Markdown

  @Column({ type: 'int', default: 0 })
  sortOrder: number; // For ordering questions within a category

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  helpfulCount: number;

  @Column({ type: 'int', default: 0 })
  notHelpfulCount: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}