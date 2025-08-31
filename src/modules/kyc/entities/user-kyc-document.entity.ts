// src/modules/kyc/entities/user-kyc-document.entity.ts
// --- NEW FILE ---

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/users.entity';
import { KycDocumentType } from './kyc-document-type.entity';

export enum KycDocumentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('user_kyc_documents')
@Index(['userId', 'documentTypeId']) // To quickly find docs for a user and type
export class UserKycDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' }) // If user is deleted, their docs are too
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  documentTypeId: string;

  @ManyToOne(() => KycDocumentType, { eager: true, onDelete: 'RESTRICT' }) // Don't delete a type if docs use it
  @JoinColumn({ name: 'documentTypeId' })
  documentType: KycDocumentType;

  @Column({ type: 'varchar', length: 512 })
  documentUrl: string; // URL to the uploaded document in S3, Cloudinary, etc.

  @Column({
    type: 'enum',
    enum: KycDocumentStatus,
    default: KycDocumentStatus.PENDING,
  })
  status: KycDocumentStatus;

  @Column({ type: 'uuid', nullable: true })
  reviewedById: string; // ID of the admin who reviewed this

  @ManyToOne(() => User, { nullable: true }) // Relation to the admin user
  @JoinColumn({ name: 'reviewedById' })
  reviewedBy: User;

  @Column({ type: 'text', nullable: true })
rejectionReason: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}