// src/modules/kyc/kyc-document-types.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KycDocumentType } from './entities/kyc-document-type.entity';
import { CreateKycDocumentTypeDto } from './dto/create-kyc-document-type.dto';
import { UpdateKycDocumentTypeDto } from './dto/update-kyc-document-type.dto';

@Injectable()
export class KycDocumentTypesService {
  constructor(
    @InjectRepository(KycDocumentType)
    private readonly docTypeRepository: Repository<KycDocumentType>,
  ) {}

  /**
   * Creates a new KYC document type.
   */
  create(
    createDto: CreateKycDocumentTypeDto,
  ): Promise<KycDocumentType> {
    const docType = this.docTypeRepository.create(createDto);
    return this.docTypeRepository.save(docType);
  }

  /**
   * Finds all available KYC document types.
   * This is the method the frontend is trying to call.
   */
  findAll(): Promise<KycDocumentType[]> {
    return this.docTypeRepository.find({
      where: { isActive: true }, // By default, only show active types to users
      order: { name: 'ASC' },
    });
  }
  
  /**
   * Finds all document types, including inactive ones (for admins).
   */
  findAllForAdmin(): Promise<KycDocumentType[]> {
    return this.docTypeRepository.find({
      order: { name: 'ASC' },
    });
  }


  /**
   * Finds a single KYC document type by its ID.
   */
  async findOne(id: string): Promise<KycDocumentType> {
    const docType = await this.docTypeRepository.findOneBy({ id });
    if (!docType) {
      throw new NotFoundException(`KYC Document Type with ID "${id}" not found.`);
    }
    return docType;
  }

  /**
   * Updates a KYC document type.
   */
  async update(
    id: string,
    updateDto: UpdateKycDocumentTypeDto,
  ): Promise<KycDocumentType> {
    const docType = await this.docTypeRepository.preload({
      id,
      ...updateDto,
    });
    if (!docType) {
      throw new NotFoundException(`KYC Document Type with ID "${id}" not found.`);
    }
    return this.docTypeRepository.save(docType);
  }

  /**
   * Deletes a KYC document type.
   */
  async remove(id: string): Promise<void> {
    const result = await this.docTypeRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`KYC Document Type with ID "${id}" not found.`);
    }
  }
}