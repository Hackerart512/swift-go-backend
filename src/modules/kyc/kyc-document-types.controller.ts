// src/modules/kyc/kyc-document-types.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { KycDocumentTypesService } from './kyc-document-types.service';
import { CreateKycDocumentTypeDto } from './dto/create-kyc-document-type.dto';
import { UpdateKycDocumentTypeDto } from './dto/update-kyc-document-type.dto';

@ApiTags('Admin - KYC Document Types')
@Controller('admin/kyc-document-types')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class KycDocumentTypesController {
  constructor(private readonly docTypesService: KycDocumentTypesService) {}

  @Post()
  create(@Body() createDto: CreateKycDocumentTypeDto) {
    return this.docTypesService.create(createDto);
  }

  // This is the endpoint the frontend needs to fix the 404 error.
  @Get()
  findAll() {
    // We'll use the admin-specific method to get all types, including inactive ones.
    return this.docTypesService.findAllForAdmin();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.docTypesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateKycDocumentTypeDto,
  ) {
    return this.docTypesService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.docTypesService.remove(id);
  }
}