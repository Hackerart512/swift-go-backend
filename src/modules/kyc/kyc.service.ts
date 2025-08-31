// src/modules/kyc/kyc.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, KycStatus } from '../users/users.entity';
import { KycDocumentType } from './entities/kyc-document-type.entity';
import { UserKycDocument, KycDocumentStatus } from './entities/user-kyc-document.entity';
import { CreateUserKycDocumentDto } from './dto/create-user-kyc-document.dto';
import { ReviewKycDocumentDto } from './dto/review-kyc-document.dto';

// --- INTERFACE FOR MOCK KYC DATA ---
interface MockAadhaarKycUserData {
  fullName: string;
  dateOfBirth: Date;
  gender: string;
  address: string;
  mobileNumber?: string;
}

@Injectable()
export class KycService {
  // Property for the mock OTP service
  private mockAadhaarOtps: Map<string, { otp: string; transactionId: string }> = new Map();

  constructor(
    @InjectRepository(UserKycDocument)
    private readonly userKycDocumentRepository: Repository<UserKycDocument>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(KycDocumentType)
    private readonly kycDocTypeRepository: Repository<KycDocumentType>,
  ) {}

  // ================================================================= //
  // =================== ADMIN DOCUMENT MANAGEMENT =================== //
  // ================================================================= //

  async findAllPendingForAdmin(): Promise<UserKycDocument[]> {
    return this.userKycDocumentRepository.find({
      where: { status: KycDocumentStatus.PENDING },
      relations: ['user', 'documentType'],
      order: { createdAt: 'ASC' },
    });
  }

  async findAllForUserForAdmin(userId: string): Promise<UserKycDocument[]> {
    return this.userKycDocumentRepository.find({
      where: { userId },
      relations: ['documentType', 'reviewedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOneForAdmin(documentId: string): Promise<UserKycDocument> {
    const document = await this.userKycDocumentRepository.findOne({
      where: { id: documentId },
      relations: ['user', 'documentType', 'reviewedBy'],
    });
    if (!document) {
      throw new NotFoundException(`KYC document with ID ${documentId} not found.`);
    }
    return document;
  }

  async createForUser(dto: CreateUserKycDocumentDto): Promise<UserKycDocument> {
    // ... (This function is complete and correct)
    const { userId, documentTypeId, documentUrl } = dto;
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }
    const documentType = await this.kycDocTypeRepository.findOneBy({ id: documentTypeId });
    if (!documentType) {
      throw new NotFoundException(`KYC Document Type with ID ${documentTypeId} not found.`);
    }
    const existingDoc = await this.userKycDocumentRepository.findOneBy({
        userId,
        documentTypeId,
        status: KycDocumentStatus.APPROVED,
    });
    if (existingDoc) {
        throw new ConflictException(`User already has an approved or pending document of type '${documentType.name}'.`);
    }
    const newDocument = this.userKycDocumentRepository.create({ userId, documentTypeId, documentUrl, status: KycDocumentStatus.PENDING });
    return this.userKycDocumentRepository.save(newDocument);
  }

  async reviewDocument(documentId: string, dto: ReviewKycDocumentDto): Promise<UserKycDocument> {
    // ... (This function is complete and correct)
    const { status, reviewedById, rejectionReason } = dto;
    const document = await this.findOneForAdmin(documentId);
    if (document.status !== KycDocumentStatus.PENDING) {
      throw new BadRequestException(`Document is not pending review. Current status: ${document.status}`);
    }
    if (status === KycDocumentStatus.REJECTED && !rejectionReason) {
      throw new BadRequestException('A rejection reason is required when rejecting a document.');
    }
    const reviewer = await this.userRepository.findOneBy({ id: reviewedById });
    if (!reviewer || reviewer.role !== 'admin') {
      throw new NotFoundException(`Admin with ID ${reviewedById} not found.`);
    }
    document.status = status;
    document.reviewedById = reviewedById;
    document.rejectionReason = status === KycDocumentStatus.REJECTED ? (rejectionReason || null) : null;
    document.reviewedAt = new Date();
    const savedDocument = await this.userKycDocumentRepository.save(document);
    await this.updateUserKycStatus(document.userId);
    return savedDocument;
  }

  private async updateUserKycStatus(userId: string): Promise<void> {
    // ... (This function is complete and correct)
    const requiredDocTypes = await this.kycDocTypeRepository.findBy({ isRequired: true, isActive: true });
    const userDocs = await this.userKycDocumentRepository.findBy({ userId, status: KycDocumentStatus.APPROVED });
    const approvedDocTypeIds = new Set(userDocs.map(doc => doc.documentTypeId));
    const hasAllRequiredDocs = requiredDocTypes.every(reqType => approvedDocTypeIds.has(reqType.id));
    const user = await this.userRepository.findOneBy({ id: userId });
    if (user) {
        const newKycStatus = hasAllRequiredDocs ? KycStatus.VERIFIED : KycStatus.PENDING;
        if (user.kycStatus !== newKycStatus) {
            user.kycStatus = newKycStatus;
            await this.userRepository.save(user);
        }
    }
  }

  // ================================================================= //
  // ======== EXTERNAL KYC VERIFICATION (MOCK - FOR AUTH) ============ //
  // ================================================================= //

  async sendOtpToAadhaarLinkedMobile(aadhaarNumber: string): Promise<{ success: boolean; message: string; transactionId?: string; otpForTesting?: string; }> {
    console.log(`MOCK_AADHAAR_KYC: OTP requested for Aadhaar: ${aadhaarNumber}`);
    if (!/^\d{12}$/.test(aadhaarNumber)) {
        throw new BadRequestException('Invalid Aadhaar number format for mock.');
    }
    const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const mockTransactionId = `mock_aadhaar_tid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.mockAadhaarOtps.set(aadhaarNumber, { otp: mockOtp, transactionId: mockTransactionId });
    console.log(`MOCK_AADHAAR_KYC: Generated OTP ${mockOtp} for Aadhaar ${aadhaarNumber} with TID ${mockTransactionId}`);
    return {
      success: true,
      message: 'Mock Aadhaar OTP successfully "sent".',
      transactionId: mockTransactionId,
      otpForTesting: mockOtp,
    };
  }

  async verifyAadhaarOtp(aadhaarNumber: string, otpAttempt: string, clientTransactionId?: string): Promise<{ success: boolean; message: string; userData?: MockAadhaarKycUserData; }> {
    console.log(`MOCK_AADHAAR_KYC: Verifying OTP for Aadhaar: ${aadhaarNumber} with OTP attempt: ${otpAttempt}, Client TID: ${clientTransactionId}`);
    const storedOtpData = this.mockAadhaarOtps.get(aadhaarNumber);
    if (!storedOtpData) {
      return { success: false, message: 'No OTP found for this Aadhaar number. Please request OTP first.' };
    }
    if (clientTransactionId && storedOtpData.transactionId !== clientTransactionId) {
        console.warn(`MOCK_AADHAAR_KYC: Transaction ID mismatch. Stored: ${storedOtpData.transactionId}, Client Sent: ${clientTransactionId}`);
    }
    if (storedOtpData.otp === otpAttempt) {
      this.mockAadhaarOtps.delete(aadhaarNumber);
      const mockUserData: MockAadhaarKycUserData = {
        fullName: `Mock User for ${aadhaarNumber.substring(0,4)}XXXX${aadhaarNumber.substring(8)}`,
        dateOfBirth: new Date('1990-01-01'),
        gender: 'Male',
        address: `123 Mock Aadhaar St, Mock City, Pin ${Math.floor(100000 + Math.random() * 800000)}`,
        mobileNumber: `+919XXXXX${Math.floor(1000 + Math.random() * 8999)}`,
      };
      console.log(`MOCK_AADHAAR_KYC: OTP Verified for ${aadhaarNumber}. Returning mock data.`);
      return {
        success: true,
        message: 'Mock Aadhaar OTP Verified successfully.',
        userData: mockUserData,
      };
    } else {
      console.log(`MOCK_AADHAAR_KYC: OTP Verification Failed for ${aadhaarNumber}. Stored: ${storedOtpData.otp}, Attempt: ${otpAttempt}`);
      return { success: false, message: 'Mock Aadhaar OTP is invalid.' };
    }
  }

  public clearMockAadhaarOtp(aadhaarNumber: string): void {
    this.mockAadhaarOtps.delete(aadhaarNumber);
    console.log(`MOCK_AADHAAR_KYC: Cleared stored OTP for Aadhaar ${aadhaarNumber}`);
  }
}