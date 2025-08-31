// src/modules/drivers/drivers.controller.ts
import {
    Controller,
    Post,
    UseGuards,
    Request as NestRequest,
    UploadedFile,
    UseInterceptors,
    BadRequestException,
    Get,
    Patch,
    Body,
    UsePipes,
    ValidationPipe,
    NotFoundException
  } from '@nestjs/common';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { DriversService } from './drivers.service';
  import { TripsService } from '../trips/trips.service';
  import { DriverJwtAuthGuard } from '../auth/guards/driver-jwt-auth.guard';
  import { driverDocumentMulterOptions, selfieMulterOptions } from '../../common/config/multer.config';
  import { UpdateDriverProfileDto } from './dto/update-driver-profile.dto';
  import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody, ApiResponse } from '@nestjs/swagger';
  import { DriverDashboardDto, DriverProfileDto, EarningsResponseDto } from './dto';

  interface AuthenticatedDriverRequest extends Request {
      user: { id: string; role: 'driver'; };
  }
  
  @ApiTags('Driver - Profile & Documents')
  @ApiBearerAuth()
  @UseGuards(DriverJwtAuthGuard)
  @Controller('driver')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  export class DriversController {
    constructor(
      private readonly driversService: DriversService,
      private readonly tripsService: TripsService,
    ) {}
  
    @Get('me')
    @ApiResponse({ status: 200, description: 'Returns the authenticated driver\'s profile.', type: DriverProfileDto })
    async getMyProfile(@NestRequest() req: AuthenticatedDriverRequest): Promise<DriverProfileDto> {
      const driver = await this.driversService.findById(req.user.id);
      if (!driver) throw new NotFoundException('Driver profile not found.');
      return new DriverProfileDto(driver);
    }
  
    @Patch('me')
    @ApiResponse({ status: 200, description: 'Profile updated successfully.', type: DriverProfileDto })
    async updateMyProfile(
      @NestRequest() req: AuthenticatedDriverRequest,
      @Body() updateDto: UpdateDriverProfileDto,
    ): Promise<DriverProfileDto> {
      const updatedDriver = await this.driversService.updateProfile(req.user.id, updateDto);
      return new DriverProfileDto(updatedDriver);
    }
  
    @Get('dashboard')
    @ApiResponse({ status: 200, description: 'Returns data for the driver dashboard.', type: DriverDashboardDto })
    async getDashboardData(@NestRequest() req: AuthenticatedDriverRequest): Promise<DriverDashboardDto> {
      const driverId = req.user.id;
      const [earningsData, tripData] = await Promise.all([
        this.driversService.getDashboardData(driverId),
        this.tripsService.getDriverDashboardTripInfo(driverId),
      ]);
      return new DriverDashboardDto(earningsData, tripData);
    }

    // --- NEW EARNINGS ENDPOINT ---
    @Get('earnings')
    @ApiResponse({
      status: 200,
      description: 'Returns detailed earnings data for the driver app screen.',
      type: EarningsResponseDto,
    })
    async getEarnings(@NestRequest() req: AuthenticatedDriverRequest): Promise<EarningsResponseDto> {
        return this.driversService.getEarningsData(req.user.id);
    }
  
    @Post('upload-license')
    @ApiConsumes('multipart/form-data')
    @ApiBody({ description: 'Driver\'s License File (JPG, PNG, PDF)', schema: { type: 'string', format: 'binary' } })
    @UseInterceptors(FileInterceptor('license', driverDocumentMulterOptions))
    async uploadLicense(
      @NestRequest() req: AuthenticatedDriverRequest,
      @UploadedFile() file: Express.Multer.File,
    ) {
      if (!file) throw new BadRequestException("Driver's license file is required.");
      const fileUrl = `/driver-documents/${file.filename}`;
      await this.driversService.updateDocumentUrl(req.user.id, 'driversLicenseUrl', fileUrl);
      return { message: "Driver's license uploaded successfully.", url: `/static${fileUrl}` };
    }
  
    @Post('upload-rc')
    @ApiConsumes('multipart/form-data')
    @ApiBody({ description: 'Vehicle RC File', schema: { type: 'string', format: 'binary' } })
    @UseInterceptors(FileInterceptor('rc', driverDocumentMulterOptions))
    async uploadVehicleRc(
      @NestRequest() req: AuthenticatedDriverRequest,
      @UploadedFile() file: Express.Multer.File,
    ) {
      if (!file) throw new BadRequestException('Vehicle RC file is required.');
      const fileUrl = `/driver-documents/${file.filename}`;
      await this.driversService.updateDocumentUrl(req.user.id, 'vehicleRcUrl', fileUrl);
      return { message: 'Vehicle RC uploaded successfully.', url: `/static${fileUrl}` };
    }
  
    @Post('upload-insurance')
    @ApiConsumes('multipart/form-data')
    @ApiBody({ description: 'Vehicle Insurance File', schema: { type: 'string', format: 'binary' } })
    @UseInterceptors(FileInterceptor('insurance', driverDocumentMulterOptions))
    async uploadVehicleInsurance(
      @NestRequest() req: AuthenticatedDriverRequest,
      @UploadedFile() file: Express.Multer.File,
    ) {
      if (!file) throw new BadRequestException('Vehicle insurance file is required.');
      const fileUrl = `/driver-documents/${file.filename}`;
      await this.driversService.updateDocumentUrl(req.user.id, 'vehicleInsuranceUrl', fileUrl);
      return { message: 'Vehicle insurance uploaded successfully.', url: `/static${fileUrl}` };
    }
  
    @Post('upload-selfie')
    @ApiConsumes('multipart/form-data')
    @ApiBody({ description: 'Driver\'s Selfie (JPG, PNG)', schema: { type: 'string', format: 'binary' } })
    @UseInterceptors(FileInterceptor('selfie', selfieMulterOptions))
    async uploadSelfie(
      @NestRequest() req: AuthenticatedDriverRequest,
      @UploadedFile() file: Express.Multer.File,
    ) {
      if (!file) throw new BadRequestException('Selfie file is required.');
      const fileUrl = `/profile-photos/${file.filename}`;
      await this.driversService.updateDocumentUrl(req.user.id, 'profilePhotoUrl', fileUrl);
      return { message: 'Selfie uploaded successfully.', url: `/static${fileUrl}` };
    }
  }