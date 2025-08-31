// src/modules/users/users.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
  ParseUUIDPipe,
  BadRequestException,
  UsePipes,
  ValidationPipe,
  NotFoundException,
  HttpStatus,
  HttpCode,
  Logger, // Import Logger
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { User } from './users.entity';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { CreateFavoriteLocationDto } from './dto/create-favorite-location.dto';
import { UpdateFavoriteLocationDto } from './dto/update-favorite-location.dto';
import { FavoriteLocation } from './entities/favorite-location.entity';
import { UserJwtAuthGuard } from '../auth/guards/user-jwt-auth.guard';
import { selfieMulterOptions } from '../../common/config/multer.config';
// Ensure the DTO for the FCM token is imported
import { UpdateFcmTokenDto } from './dto/update-fcm-token.dto';

@ApiTags('Users (Passenger/Driver Facing)')
@ApiBearerAuth()
@Controller('users')
@UseGuards(UserJwtAuthGuard) // Apply the guard to the whole controller
// Apply validation pipes to the whole controller for consistency
@UsePipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }))
export class UsersController {
  // Add a logger instance
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMyProfile(@Request() req: { user: { id: string } }): Promise<Partial<User>> {
    const user = await this.usersService.findById(req.user.id);
    if (!user) throw new NotFoundException('User profile not found.');
    // Destructure to remove sensitive fields before returning
    const { password, phoneOtp, phoneOtpExpiresAt, kycDetails, ...result } = user;
    return result;
  }

  @Patch('me/profile')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateMyProfile(
    @Request() req: { user: { id: string } },
    @Body() updateUserProfileDto: UpdateUserProfileDto,
  ): Promise<Partial<User>> {
    const user: User = await this.usersService.updateUserProfile(req.user.id, updateUserProfileDto);
    const { password, phoneOtp, phoneOtpExpiresAt, kycDetails, ...result } = user;
    return result;
  }
  
  // ================== THIS IS THE FINAL, CORRECTED ENDPOINT ==================
  /**
   * Endpoint for the mobile client to register or update its FCM token.
   * This is a critical function for enabling push notifications.
   */
  @Post('me/fcm-token')
  // Use 204 No Content: The server successfully processed the request,
  // but there is no content to return. This is perfect for this action.
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update or register the FCM token for the current user' })
  async updateFcmToken(
    @Request() req: { user: { id: string } }, // Get the user from the validated JWT
    @Body() updateFcmTokenDto: UpdateFcmTokenDto,
  ): Promise<void> {
    const userId = req.user.id;
    const { fcmToken } = updateFcmTokenDto;
    
    this.logger.log(`Received request to update FCM token for user ${userId}.`);

    if (!fcmToken) {
      // Although the DTO validation should catch this, an extra check doesn't hurt.
      this.logger.warn(`Request for user ${userId} is missing FCM token in the body.`);
      throw new BadRequestException('fcmToken is required in the request body.');
    }

    // Call the service method to perform the database update.
    await this.usersService.updateFcmToken(userId, fcmToken);
    
    // With @HttpCode(204), we don't need to return anything. The framework handles it.
  }
  // ================== END OF THE FINAL ENDPOINT ==================

  @Post('me/profile-photo')
  @ApiOperation({ summary: 'Upload profile photo' })
  @UseInterceptors(FileInterceptor('photo', selfieMulterOptions))
  async uploadMyProfilePhoto(
    @Request() req: { user: { id: string } },
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ message: string; url?: string }> {
    if (!file) {
      throw new BadRequestException('Profile photo file is required.');
    }
    // Note: In a real production app, this URL should be the full, absolute URL.
    const photoUrl = `/static/profile-photos/${file.filename}`;
    await this.usersService.updateProfilePhoto(String(req.user.id), photoUrl);
    return { message: 'Profile photo uploaded successfully.', url: photoUrl };
  }

  // --- The rest of the controller remains unchanged ---

  @Post('me/favorite-locations')
  @HttpCode(HttpStatus.CREATED)
  async addFavoriteLocation(
    @Request() req: { user: { id: string } },
    @Body() createDto: CreateFavoriteLocationDto,
  ): Promise<FavoriteLocation> {
    return this.usersService.addFavoriteLocation(req.user.id, createDto);
  }

  @Get('me/favorite-locations')
  async getMyFavoriteLocations(@Request() req: { user: { id: string } }): Promise<FavoriteLocation[]> {
    return this.usersService.getFavoriteLocations(req.user.id);
  }

  @Get('me/favorite-locations/:locationId')
  async getMyFavoriteLocationById(
    @Request() req: { user: { id: string } },
    @Param('locationId', ParseUUIDPipe) locationId: string,
  ): Promise<FavoriteLocation> {
    return this.usersService.getFavoriteLocationById(req.user.id, locationId);
  }

  @Patch('me/favorite-locations/:locationId')
  async updateMyFavoriteLocation(
    @Request() req: { user: { id: string } },
    @Param('locationId', ParseUUIDPipe) locationId: string,
    @Body() updateDto: UpdateFavoriteLocationDto,
  ): Promise<FavoriteLocation> {
    return this.usersService.updateFavoriteLocation(req.user.id, locationId, updateDto);
  }

  @Delete('me/favorite-locations/:locationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMyFavoriteLocation(
    @Request() req: { user: { id:string } },
    @Param('locationId', ParseUUIDPipe) locationId: string,
  ): Promise<void> {
    await this.usersService.deleteFavoriteLocation(req.user.id, locationId);
  }

  @Get('me/wallet')
  async getMyWalletBalance(
    @Request() req: { user: { id: string } },
  ): Promise<{ balance: number; currency: string }> {
    return this.usersService.getWalletBalance(req.user.id);
  }
}