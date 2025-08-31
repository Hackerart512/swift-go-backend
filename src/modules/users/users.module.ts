// src/modules/users/users.module.ts

import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './users.entity';
import { FavoriteLocation } from './entities/favorite-location.entity';
import { AdminUsersController } from './admin-users.controller';
import { AuthModule } from '../auth/auth.module';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, FavoriteLocation]),
    forwardRef(() => AuthModule),
    forwardRef(() => BookingsModule),
  ],
  controllers: [
    UsersController,
    AdminUsersController,
  ],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}