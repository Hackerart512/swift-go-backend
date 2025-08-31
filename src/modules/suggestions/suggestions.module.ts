// src/modules/suggestions/suggestions.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuggestionsService } from './suggestions.service';
import { SuggestionsController } from './suggestions.controller';
import { RouteSuggestion } from './entities/route-suggestion.entity';
import { AuthModule } from '../auth/auth.module'; // For JwtAuthGuard
import { UsersModule } from '../users/users.module'; // For UsersService injection

@Module({
  imports: [
    TypeOrmModule.forFeature([RouteSuggestion]),
    AuthModule, // Provides JwtAuthGuard
    UsersModule, // Provides UsersService for profile updates
  ],
  controllers: [SuggestionsController],
  providers: [SuggestionsService],
  exports: [SuggestionsService], // If any other module needs this service
})
export class SuggestionsModule {}