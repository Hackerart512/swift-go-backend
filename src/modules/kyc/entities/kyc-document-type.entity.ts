// src/modules/kyc/entities/kyc-document-type.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('kyc_document_types')
export class KycDocumentType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string; // e.g., "Aadhaar Card", "Driver's License"

  @Column({ type: 'text', nullable: true })
  description: string; // Optional description

  @Column({ type: 'boolean', default: false })
  isRequired: boolean; // Is this document mandatory for all users of a certain type?

  @Column({ type: 'boolean', default: true })
  isActive: boolean; // Allows an admin to enable/disable a type

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}