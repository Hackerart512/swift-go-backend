// src/modules/suggestions/suggestions.service.ts
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RouteSuggestion } from './entities/route-suggestion.entity';
import { CreateRouteSuggestionDto } from './dto/create-route-suggestion.dto';
import { UsersService } from '../users/users.service'; // To update user preferences

@Injectable()
export class SuggestionsService {
  constructor(
    @InjectRepository(RouteSuggestion)
    private readonly suggestionRepository: Repository<RouteSuggestion>,
    private readonly usersService: UsersService, // Injected to update user profile
  ) {}

  async createRouteSuggestion(
    userId: string,
    createSuggestionDto: CreateRouteSuggestionDto,
  ): Promise<RouteSuggestion> {
    const { updateProfilePreferences, ...suggestionData } = createSuggestionDto;

    const suggestion = this.suggestionRepository.create({
      ...suggestionData,
      userId,
      updateProfilePreferences: !!updateProfilePreferences, // Ensure boolean
      status: 'pending', // Initial status
    });

    const savedSuggestion = await this.suggestionRepository.save(suggestion);

    if (updateProfilePreferences) {
      try {
        // Update user's profile preferences (from User entity)
        // This assumes you have fields like preferredMorningRouteOrigin etc. on User entity
        // And that UsersService has a method to update them.
        const userProfileUpdateData: any = {};
        if (suggestionData.rideType === 'morning') {
          userProfileUpdateData.preferredMorningRouteOrigin = suggestionData.startLocationAddress;
          userProfileUpdateData.preferredMorningRouteDestination = suggestionData.endLocationAddress;
          userProfileUpdateData.preferredMorningArrivalTime = suggestionData.desiredArrivalTime;
        } else if (suggestionData.rideType === 'evening') {
          // Add similar fields for evening if they exist on User entity
          // userProfileUpdateData.preferredEveningRouteOrigin = suggestionData.startLocationAddress;
          // userProfileUpdateData.preferredEveningRouteDestination = suggestionData.endLocationAddress;
          // userProfileUpdateData.preferredEveningArrivalTime = suggestionData.desiredArrivalTime;
        }

        if (Object.keys(userProfileUpdateData).length > 0) {
          await this.usersService.updateUserProfile(userId, userProfileUpdateData);
        }
      } catch (error) {
        // Log this error, but don't let it fail the suggestion submission
        console.error(`Failed to update user profile preferences for user ${userId} during suggestion submission:`, error);
        // Depending on requirements, you might want to handle this more gracefully
        // or even make it part of the transaction. For now, we'll let suggestion succeed.
      }
    }
    return savedSuggestion;
  }

  // Method for Admin to view suggestions (example)
  async findAllSuggestions(): Promise<RouteSuggestion[]> {
    return this.suggestionRepository.find({
      relations: ['user'], // Load user details along with suggestion
      order: { createdAt: 'DESC' },
    });
  }

  // Method for Admin to update suggestion status (example)
  async updateSuggestionStatus(suggestionId: string, status: string): Promise<RouteSuggestion> {
    const suggestion = await this.suggestionRepository.findOneBy({ id: suggestionId });
    if (!suggestion) {
      throw new NotFoundException(`Suggestion with ID ${suggestionId} not found.`);
    }
    suggestion.status = status;
    return this.suggestionRepository.save(suggestion);
  }
}