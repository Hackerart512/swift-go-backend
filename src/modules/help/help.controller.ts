// src/modules/help/help.controller.ts
import {
    Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards,
    HttpCode, HttpStatus, UsePipes, ValidationPipe
  } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HelpService } from './help.service';
import { CreateHelpCategoryDto, UpdateHelpCategoryDto, CreateFaqItemDto, UpdateFaqItemDto, FaqFeedbackDto } from './dto'; // Barrel export from dto/index.ts
// import { AdminGuard } from '../../common/guards/admin.guard';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// Controller for public/passenger facing endpoints
@ApiTags('Help')
@Controller('help')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }))
export class HelpController {
  constructor(private readonly helpService: HelpService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Get all active help categories' })
  @ApiResponse({ status: 200, description: 'List of active help categories returned.' })
  async getCategories() {
    return this.helpService.findActiveCategories();
  }

  @Get('categories/:categoryId/faqs')
  @ApiOperation({ summary: 'Get FAQs for a specific category' })
  @ApiResponse({ status: 200, description: 'List of FAQs for the category returned.' })
  async getFaqsForCategory(@Param('categoryId', ParseUUIDPipe) categoryId: string) {
    return this.helpService.findActiveFaqsByCategory(categoryId);
  }

  @Get('faqs/:faqId')
  @ApiOperation({ summary: 'Get details of a specific FAQ' })
  @ApiResponse({ status: 200, description: 'FAQ details returned.' })
  async getFaqDetail(@Param('faqId', ParseUUIDPipe) faqId: string) {
    return this.helpService.findOneFaqItem(faqId);
  }

  @Post('faqs/:faqId/feedback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit feedback for a FAQ' })
  @ApiResponse({ status: 200, description: 'Feedback submitted.' })
  async submitFaqFeedback(
    @Param('faqId', ParseUUIDPipe) faqId: string,
    @Body() feedbackDto: FaqFeedbackDto,
  ): Promise<{ message: string }> {
    await this.helpService.submitFaqFeedback(faqId, feedbackDto.wasHelpful);
    return { message: 'Thank you for your feedback.' };
  }
}

// Separate controller for Admin operations
@ApiTags('Admin')
@Controller('admin/help')
// @UseGuards(JwtAuthGuard, AdminGuard) // TODO: Protect all routes here
@UsePipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }))
export class AdminHelpController {
  constructor(private readonly helpService: HelpService) {}

  // Category Management
  @Post('categories') @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new help category (admin)' })
  @ApiResponse({ status: 201, description: 'Help category created.' })
  createCategory(@Body() dto: CreateHelpCategoryDto) { return this.helpService.createCategory(dto); }
  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a help category (admin)' })
  @ApiResponse({ status: 200, description: 'Help category updated.' })
  updateCategory(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateHelpCategoryDto) { return this.helpService.updateCategory(id, dto); }
  @Delete('categories/:id') @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a help category (admin)' })
  @ApiResponse({ status: 204, description: 'Help category deleted.' })
  removeCategory(@Param('id', ParseUUIDPipe) id: string) { return this.helpService.removeCategory(id); }
  @Get('categories')
  @ApiOperation({ summary: 'Get all help categories (admin)' })
  @ApiResponse({ status: 200, description: 'List of all help categories returned.' })
  getAllCategories() { return this.helpService.findAllCategoriesForAdmin(); }

  // FAQ Item Management
  @Post('faqs') @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new FAQ item (admin)' })
  @ApiResponse({ status: 201, description: 'FAQ item created.' })
  createFaq(@Body() dto: CreateFaqItemDto) { return this.helpService.createFaqItem(dto); }
  @Patch('faqs/:id')
  @ApiOperation({ summary: 'Update a FAQ item (admin)' })
  @ApiResponse({ status: 200, description: 'FAQ item updated.' })
  updateFaq(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateFaqItemDto) { return this.helpService.updateFaqItem(id, dto); }
  @Delete('faqs/:id') @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a FAQ item (admin)' })
  @ApiResponse({ status: 204, description: 'FAQ item deleted.' })
  removeFaq(@Param('id', ParseUUIDPipe) id: string) { return this.helpService.removeFaqItem(id); }
  @Get('faqs')
  @ApiOperation({ summary: 'Get all FAQ items (admin)' })
  @ApiResponse({ status: 200, description: 'List of all FAQ items returned.' })
  getAllFaqs() { return this.helpService.findAllFaqItemsForAdmin(); }
}