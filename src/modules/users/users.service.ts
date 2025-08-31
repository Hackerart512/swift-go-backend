// src/modules/users/users.service.ts

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
  Logger, // Import Logger
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import {
  User,
  KycStatus,
  PhoneVerificationStatus,
  UserGender,
  UserRole,
} from './users.entity';
import * as bcrypt from 'bcrypt';
import {
  FavoriteLocation,
  FavoriteLocationType,
} from './entities/favorite-location.entity';
import { CreateFavoriteLocationDto } from './dto/create-favorite-location.dto';
import { UpdateFavoriteLocationDto } from './dto/update-favorite-location.dto';

// --- DTO IMPORTS ---
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';


@Injectable()
export class UsersService {
  // Add a logger instance for better debugging
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(FavoriteLocation)
    private readonly favoriteLocationRepository: Repository<FavoriteLocation>,
  ) {}

  // ================== THIS IS THE CORRECT, FINAL VERSION ==================
  /**
   * Updates or sets the Firebase Cloud Messaging (FCM) token for a specific user.
   * This method uses a direct database update for efficiency and to avoid race conditions.
   * @param userId The ID of the user.
   * @param fcmToken The new, complete FCM token to be saved.
   */
  async updateFcmToken(userId: string, fcmToken: string): Promise<void> {
    this.logger.log(`[updateFcmToken] Attempting to update FCM token for user ${userId}.`);

    if (!userId || !fcmToken) {
      this.logger.warn('[updateFcmToken] Aborting: received empty userId or fcmToken.');
      // Silently return to avoid sending an error for a malformed request from the client.
      return;
    }

    try {
      // Use the .update() method for a direct query. It's more efficient than findOne + save.
      // CRITICAL FIX: Pass the fcmToken directly without any manipulation.
      const result = await this.usersRepository.update(
        { id: userId },      // Condition: where user id matches
        { fcmToken: fcmToken }, // Data: the new, full token to set
      );

      // The 'result' object contains an 'affected' property. If it's 0, no rows were updated.
      if (result.affected === 0) {
        // This is not a critical error, as the user might not exist yet during registration flow.
        this.logger.warn(`[updateFcmToken] User with ID ${userId} not found in the database. No token was updated.`);
      } else {
        this.logger.log(`[updateFcmToken] Successfully set FCM token for user ${userId}.`);
      }
    } catch (error) {
      // Catch any potential database errors during the update operation.
      this.logger.error(`[updateFcmToken] A database error occurred while updating FCM token for user ${userId}`, error.stack);
      // We don't re-throw the error to prevent the client from receiving a 500 server error
      // for a background task like this. Logging it is crucial.
    }
  }
  // ================== END OF THE CORRECTED METHOD ==================


  // ==================================================================
  // --- Admin Panel CRUD Methods ---
  // ==================================================================

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existing = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existing) {
      throw new ConflictException('A user with this email already exists.');
    }
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  async findAll(role?: UserRole): Promise<User[]> {
    if (role) {
      return this.usersRepository.find({ where: { role } });
    }
    return this.usersRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepository.preload({
      id,
      ...updateUserDto,
    });
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }
  }

  // ==================================================================
  // --- Existing Methods (unchanged) ---
  // ==================================================================

  async findByIdLegacy(id: string): Promise<User | null> {
    return (await this.usersRepository.findOne({ where: { id } })) ?? null;
  }

  async findByMobileNumber(mobileNumber: string): Promise<User | undefined> {
    return (
      (await this.usersRepository
        .createQueryBuilder('user')
        .select([
          'user.id',
          'user.email',
          'user.password',
          'user.fullName',
          'user.aadhaarNumber',
          'user.dateOfBirth',
          'user.gender',
          'user.address',
          'user.mobileNumber',
          'user.phoneVerificationStatus',
          'user.kycStatus',
          'user.profilePhotoUrl',
          'user.preferredMorningRouteOrigin',
          'user.preferredMorningRouteDestination',
          'user.preferredMorningArrivalTime',
          'user.isActive',
          'user.createdAt',
          'user.updatedAt',
          'user.fcmToken',
        ])
        .addSelect(['user.phoneOtp', 'user.phoneOtpExpiresAt'])
        .where('user.mobileNumber = :mobileNumber', { mobileNumber })
        .getOne()) ?? undefined
    );
  }

  async findByAadhaarNumber(aadhaarNumber: string): Promise<User | undefined> {
    return (
      (await this.usersRepository.findOne({ where: { aadhaarNumber } })) ??
      undefined
    );
  }

  async createUser(userData: Partial<User>): Promise<User> {
    if (userData.email) {
      const existing = await this.findByEmail(userData.email);
      if (existing) throw new ConflictException('Email already exists.');
    }
    if (userData.mobileNumber) {
      const existing = await this.findByMobileNumber(userData.mobileNumber);
      if (existing)
        throw new ConflictException('Mobile number already exists.');
    }
    if (!userData.role) {
      userData.role = UserRole.PASSENGER;
    }
    const userEntity = this.usersRepository.create(userData);
    return this.usersRepository.save(userEntity);
  }

  async saveUser(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }

  async getWalletBalance(
    userId: string,
  ): Promise<{ balance: number; currency: string }> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { balance: Number(user.walletBalance), currency: 'INR' };
  }

  async deductFromWallet(
    userId: string,
    amountToDeduct: number,
    entityManager?: EntityManager,
  ): Promise<{ success: boolean; newBalance?: number; message?: string }> {
    const repository = entityManager
      ? entityManager.getRepository(User)
      : this.usersRepository;
    const user = await repository.findOneBy({ id: userId });

    if (!user) {
      throw new NotFoundException('User not found for wallet deduction.');
    }

    const currentBalance = Number(user.walletBalance);
    if (currentBalance < amountToDeduct) {
      return { success: false, message: 'Insufficient wallet balance.' };
    }

    user.walletBalance = currentBalance - amountToDeduct;
    await repository.save(user);
    return { success: true, newBalance: Number(user.walletBalance) };
  }

  async addToWallet(
    userId: string,
    amountToAdd: number,
    entityManager?: EntityManager,
  ): Promise<{ success: boolean; newBalance: number }> {
    const repository = entityManager
      ? entityManager.getRepository(User)
      : this.usersRepository;
    const user = await repository.findOneBy({ id: userId });

    if (!user)
      throw new NotFoundException('User not found for adding to wallet.');

    user.walletBalance = Number(user.walletBalance) + amountToAdd;
    await repository.save(user);
    return { success: true, newBalance: Number(user.walletBalance) };
  }

  async findById(
    id: string,
    relations: string[] = [],
  ): Promise<User | undefined> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations,
    });
    return user ?? undefined;
  }

  async createOrUpdateUserFromKyc(
    aadhaarNumber: string,
    kycData: {
      fullName: string;
      dateOfBirth: Date;
      gender: string;
      address: string;
      mobileNumber?: string;
      rawKycDetails?: any;
    },
  ): Promise<User> {
    let user = await this.findByAadhaarNumber(aadhaarNumber);
    if (!user) {
      user = this.usersRepository.create({ aadhaarNumber });
    }
    user.fullName = kycData.fullName;
    user.dateOfBirth = kycData.dateOfBirth;
    user.gender = kycData.gender as UserGender;
    user.address = kycData.address;
    user.kycStatus = KycStatus.VERIFIED;
    user.kycDetails = kycData.rawKycDetails
      ? { ...kycData.rawKycDetails }
      : {
          fullName: kycData.fullName,
          dateOfBirth: kycData.dateOfBirth,
          gender: kycData.gender,
          address: kycData.address,
        };
    user.isActive = true;
    return this.usersRepository.save(user);
  }

  async updateUserKycDetails(
    userId: string,
    aadhaarNumber: string,
    kycData: {
      fullName: string;
      dateOfBirth: Date;
      gender: string;
      address: string;
      rawKycDetails?: any;
    },
  ): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    const userWithThisAadhaar = await this.findByAadhaarNumber(aadhaarNumber);
    if (userWithThisAadhaar && userWithThisAadhaar.id !== userId) {
      throw new ConflictException(
        'This Aadhaar number is already linked to another account.',
      );
    }

    user.aadhaarNumber = aadhaarNumber;
    user.kycStatus = KycStatus.VERIFIED;
    user.kycDetails = kycData.rawKycDetails || kycData;
    return this.usersRepository.save(user);
  }

  async recordKycSkipped(
    aadhaarNumber?: string | null,
    existingUser?: User,
  ): Promise<User> {
    let userToUpdate = existingUser;
    if (!userToUpdate && aadhaarNumber) {
      userToUpdate = await this.findByAadhaarNumber(aadhaarNumber);
    }

    if (userToUpdate) {
      if (userToUpdate.kycStatus === KycStatus.VERIFIED) {
        throw new ConflictException(
          'User already KYC verified, cannot mark as skipped.',
        );
      }
      userToUpdate.kycStatus = KycStatus.SKIPPED;
      return this.usersRepository.save(userToUpdate);
    } else {
      return this.createUser({
        aadhaarNumber: aadhaarNumber || undefined,
        kycStatus: KycStatus.SKIPPED,
      });
    }
  }

  async completeRegistration(
    userId: string,
    data: {
      password?: string;
      email?: string;
      mobileNumber?: string;
      fullName?: string;
      gender?: UserGender;
      residentialLocation?: string;
      workLocation?: string;
      preferredTiming?: string;
    },
  ): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    if (data.fullName) user.fullName = data.fullName;
    if (data.gender) user.gender = data.gender;
    if (data.residentialLocation)
      user.residentialLocation = data.residentialLocation;
    if (data.workLocation) user.workLocation = data.workLocation;
    if (data.preferredTiming) user.preferredTiming = data.preferredTiming;

    if (data.email && data.email !== user.email) {
      const existingEmailUser = await this.findByEmail(data.email);
      if (existingEmailUser && existingEmailUser.id !== user.id) {
        throw new ConflictException(
          'Email address is already in use by another account.',
        );
      }
      user.email = data.email;
    }

    if (data.password) {
      user.password = data.password;
    }
    user.isActive = true;
    user.phoneVerificationStatus = PhoneVerificationStatus.VERIFIED;
    return this.usersRepository.save(user);
  }

  async updateUserProfile(
    userId: string,
    updateUserProfileDto: UpdateUserProfileDto,
  ): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    Object.assign(user, updateUserProfileDto);

    return this.usersRepository.save(user);
  }

  async updateProfilePhoto(userId: string, photoUrl: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.profilePhotoUrl = photoUrl;
    return this.usersRepository.save(user);
  }

  async addFavoriteLocation(
    userId: string,
    createDto: CreateFavoriteLocationDto,
  ): Promise<FavoriteLocation> {
    if (
      createDto.type === FavoriteLocationType.OTHER &&
      (!createDto.name || createDto.name.trim() === '')
    ) {
      throw new BadRequestException(
        'A custom name is required for favorite locations of type "other".',
      );
    }
    if (
      createDto.type === FavoriteLocationType.HOME ||
      createDto.type === FavoriteLocationType.WORK
    ) {
      const existingTypedFavorite =
        await this.favoriteLocationRepository.findOne({
          where: { userId, type: createDto.type },
        });
      if (existingTypedFavorite) {
        throw new ConflictException(
          `A favorite location of type "${createDto.type}" already exists. Please update it or use type "other".`,
        );
      }
    }
    const favoriteLocation = this.favoriteLocationRepository.create({
      ...createDto,
      userId,
    });
    return this.favoriteLocationRepository.save(favoriteLocation);
  }

  async getFavoriteLocations(userId: string): Promise<FavoriteLocation[]> {
    return this.favoriteLocationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getFavoriteLocationById(
    userId: string,
    locationId: string,
  ): Promise<FavoriteLocation> {
    const favoriteLocation = await this.favoriteLocationRepository.findOne({
      where: { id: locationId, userId },
    });
    if (!favoriteLocation) {
      throw new NotFoundException(
        `Favorite location with ID ${locationId} not found or does not belong to the user.`,
      );
    }
    return favoriteLocation;
  }

  async updateFavoriteLocation(
    userId: string,
    locationId: string,
    updateDto: UpdateFavoriteLocationDto,
  ): Promise<FavoriteLocation> {
    const favoriteLocation = await this.getFavoriteLocationById(
      userId,
      locationId,
    );

    if (
      updateDto.type === FavoriteLocationType.OTHER &&
      !updateDto.name &&
      !favoriteLocation.name
    ) {
      throw new BadRequestException(
        'A custom name is required if changing type to "other" and no name exists/is provided.',
      );
    }
    if (
      updateDto.type &&
      (updateDto.type === FavoriteLocationType.HOME ||
        updateDto.type === FavoriteLocationType.WORK) &&
      updateDto.type !== favoriteLocation.type
    ) {
      const existingTypedFavorite =
        await this.favoriteLocationRepository.findOne({
          where: { userId, type: updateDto.type },
        });
      if (existingTypedFavorite && existingTypedFavorite.id !== locationId) {
        throw new ConflictException(
          `Another favorite location of type "${updateDto.type}" already exists.`,
        );
      }
    }

    Object.assign(favoriteLocation, updateDto);
    return this.favoriteLocationRepository.save(favoriteLocation);
  }

  async deleteFavoriteLocation(
    userId: string,
    locationId: string,
  ): Promise<void> {
    const favoriteLocation = await this.getFavoriteLocationById(
      userId,
      locationId,
    );
    await this.favoriteLocationRepository.remove(favoriteLocation);
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const user = await this.usersRepository.findOne({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        password: true,
      },
    });
    return user ?? undefined;
  }

  async updateUser(id: string, update: Partial<User>): Promise<User> {
    await this.usersRepository.update(id, update);
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }
    return user;
  }
}