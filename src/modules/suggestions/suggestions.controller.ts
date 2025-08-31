// src/modules/suggestions/suggestions.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Patch,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  BadRequestException,
  InternalServerErrorException, // Added for explicit error
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SuggestionsService } from './suggestions.service';
import { CreateRouteSuggestionDto } from './dto/create-route-suggestion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RouteSuggestion } from './entities/route-suggestion.entity';
// import { AdminGuard } from '../../common/guards/admin.guard'; // If you create an AdminGuard

@ApiTags('Suggestions')
@Controller('suggestions')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }))
export class SuggestionsController {
  constructor(private readonly suggestionsService: SuggestionsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('routes')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a new route suggestion' })
  @ApiResponse({ status: 201, description: 'Route suggestion submitted.' })
  async createRouteSuggestion(
    @Request() req: any, // Using `any` for req to easily access req.user.id or req.user.sub
    @Body() createSuggestionDto: CreateRouteSuggestionDto,
  ): Promise<{ message: string; suggestion: RouteSuggestion }> {
    console.log('--- Route Suggestion Request ---');
    console.log('req.user from JWT:', JSON.stringify(req.user, null, 2)); // Log the structure of req.user

    let userId: string | undefined;

    // Determine how to get the userId from req.user
    // This depends on what your JwtStrategy.validate() returns
    if (req.user && req.user.sub) {
      // If JwtStrategy returns the raw JWT payload which has a 'sub' field for user ID
      userId = req.user.sub;
      console.log('Extracted userId from req.user.sub:', userId);
    } else if (req.user && req.user.id) {
      // If JwtStrategy returns the full User entity object (which has an 'id' field)
      userId = req.user.id;
      console.log('Extracted userId from req.user.id:', userId);
    } else {
      // If req.user is undefined or doesn't have 'sub' or 'id'
      console.error('CRITICAL: req.user is undefined or does not contain "sub" or "id" property.');
      console.error('req.user content:', JSON.stringify(req.user, null, 2));
      throw new InternalServerErrorException('Authenticated user ID could not be determined from token.');
    }

    if (!userId) { // Extra check, though the block above should catch it
        console.error("UserId is undefined/null after attempting extraction!");
        throw new InternalServerErrorException("Authenticated user ID is missing.");
    }

    const suggestion = await this.suggestionsService.createRouteSuggestion(userId, createSuggestionDto);
    return { message: 'Route suggestion submitted successfully.', suggestion };
  }

  // --- Admin Endpoints (Example - Protect with AdminGuard) ---
  // @UseGuards(JwtAuthGuard, AdminGuard) // TODO: Implement AdminGuard for these
  @Get()
  @ApiOperation({ summary: 'Get all route suggestions (admin)' })
  @ApiResponse({ status: 200, description: 'List of all route suggestions returned.' })
  async getAllSuggestions(): Promise<RouteSuggestion[]> {
    // This should ideally be protected for admin users only
    return this.suggestionsService.findAllSuggestions();
  }

  // @UseGuards(JwtAuthGuard, AdminGuard) // TODO: Implement AdminGuard for these
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update the status of a route suggestion (admin)' })
  @ApiResponse({ status: 200, description: 'Route suggestion status updated.' })
  async updateSuggestionStatus(
    @Param('id', ParseUUIDPipe) id: string,
    // It's better to use a DTO here for validation
    @Body('status') status: string,
  ): Promise<RouteSuggestion> {
    // This should ideally be protected for admin users only
    if (!status || typeof status !== 'string' || status.trim() === '') {
      throw new BadRequestException('Status is required and must be a non-empty string.');
    }
    return this.suggestionsService.updateSuggestionStatus(id, status);
  }
}