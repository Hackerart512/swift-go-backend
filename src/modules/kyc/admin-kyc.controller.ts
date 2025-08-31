// src/modules/kyc/admin-kyc.controller.ts
// --- NEW FILE ---

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { KycService } from './kyc.service';
import { UserKycDocument } from './entities/user-kyc-document.entity';
import { ReviewKycDocumentDto } from './dto/review-kyc-document.dto'; // We will create this
import { CreateUserKycDocumentDto } from './dto/create-user-kyc-document.dto'; // We will create this

@ApiTags('Admin: KYC Management')
@Controller('admin/kyc')
// TODO: Add AdminGuard @UseGuards(JwtAuthGuard, AdminGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class AdminKycController {
  constructor(private readonly kycService: KycService) {}

  // This is the endpoint that was causing the 404 error
  @Get('documents/pending-review')
  @ApiOperation({ summary: 'Get all KYC documents pending review (Admin)' })
  async getPendingKycDocuments(): Promise<UserKycDocument[]> {
    return this.kycService.findAllPendingForAdmin();
  }

  @Get('users/:userId/documents')
  @ApiOperation({ summary: "Get a specific user's KYC documents (Admin)" })
  async getUserKycDocuments(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<UserKycDocument[]> {
    return this.kycService.findAllForUserForAdmin(userId);
  }

  @Get('documents/:documentId')
  @ApiOperation({ summary: 'Get a single KYC document by its ID (Admin)' })
  async getKycDocumentById(
    @Param('documentId', ParseUUIDPipe) documentId: string,
  ): Promise<UserKycDocument> {
    return this.kycService.findOneForAdmin(documentId);
  }

  @Patch('documents/:documentId/review')
  @ApiOperation({ summary: 'Approve or reject a KYC document (Admin)' })
  async reviewUserKycDocument(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Body() reviewDto: ReviewKycDocumentDto,
  ): Promise<UserKycDocument> {
    return this.kycService.reviewDocument(documentId, reviewDto);
  }

  // Corresponds to your KycUploadPage.js for admins
  @Post('users/documents')
  @ApiOperation({ summary: 'Submit a KYC document on behalf of a user (Admin)' })
  @HttpCode(HttpStatus.CREATED)
  async submitUserKycDocument(
    @Body() createDto: CreateUserKycDocumentDto,
  ): Promise<UserKycDocument> {
    return this.kycService.createForUser(createDto);
  }
}