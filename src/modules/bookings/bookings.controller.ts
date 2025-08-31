// src/modules/bookings/bookings.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Request as NestRequest,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Query,
  ForbiddenException,
  InternalServerErrorException,
  Patch,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { MyRideItemDto } from './dto/my-ride-item.dto';
import { MyRideDetailDto } from './dto/my-ride-detail.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { UserJwtAuthGuard } from '../auth/guards/user-jwt-auth.guard';

interface AuthenticatedUser {
  id?: string;
  sub?: string;
}
interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@ApiTags('Bookings')
@ApiBearerAuth()
@Controller('bookings')
@UseGuards(UserJwtAuthGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }),
)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  private getUserIdFromRequest(req: AuthenticatedRequest): string {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) {
      throw new InternalServerErrorException('User identification failed.');
    }
    return userId;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new ride booking' })
  @ApiResponse({ status: 201, description: 'Booking successfully created.' })
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() createBookingDto: CreateBookingDto,
  ): Promise<{
    onwardBooking: MyRideDetailDto;
    returnBooking: MyRideDetailDto | null;
  }> {
    const userId = this.getUserIdFromRequest(req);
    try {
      const { onwardBooking, returnBooking } =
        await this.bookingsService.createBooking(userId, createBookingDto);

      const canOnwardBeCancelled =
        this.bookingsService.canUserCancelBooking(onwardBooking);

      let returnBookingDto: MyRideDetailDto | null = null;

      if (returnBooking) {
        const canReturnBeCancelled =
          this.bookingsService.canUserCancelBooking(returnBooking);
        returnBookingDto = new MyRideDetailDto(
          returnBooking,
          canReturnBeCancelled,
        );
      }

      return {
        onwardBooking: new MyRideDetailDto(onwardBooking, canOnwardBeCancelled),
        returnBooking: returnBookingDto,
      };
    } catch (error) {
      if (
        error instanceof ForbiddenException &&
        (error.message === 'KYC_NOT_COMPLETED' ||
          (typeof error.getResponse === 'function' &&
            typeof error.getResponse() === 'object' &&
            error.getResponse() !== null &&
            'errorCode' in (error.getResponse() as object) &&
            (error.getResponse() as { errorCode?: string }).errorCode ==
              'KYC_REQUIRED'))
      ) {
        throw new ForbiddenException({
          message:
            'KYC verification is pending. Please complete your KYC to proceed with booking.',
          error: 'KYC_REQUIRED',
          statusCode: HttpStatus.FORBIDDEN,
        });
      }
      throw error;
    }
  }

  @Get('my-rides')
  @ApiOperation({ summary: "Get a list of the current user's bookings" })
  async findMyBookings(
    @NestRequest() req: AuthenticatedRequest,
    @Query('type') type?: 'upcoming' | 'completed' | 'cancelled' | 'all',
  ): Promise<MyRideItemDto[]> {
    const userId = this.getUserIdFromRequest(req);
    const bookings = await this.bookingsService.findUserBookings(
      userId,
      type || 'all',
    );
    return bookings.map((b) => new MyRideItemDto(b));
  }

  @Get(':bookingId/details')
  @ApiOperation({ summary: 'Get details for a specific booking' })
  async findMyBookingDetailsById(
    @NestRequest() req: AuthenticatedRequest,
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
  ): Promise<MyRideDetailDto> {
    const userId = this.getUserIdFromRequest(req);
    const bookingEntity = await this.bookingsService.findOneForUserWithDetail(
      userId,
      bookingId,
    );
    const canCancel = this.bookingsService.canUserCancelBooking(bookingEntity);
    return new MyRideDetailDto(bookingEntity, canCancel);
  }

  @Get(':bookingId/track')
  @ApiOperation({ summary: "Get a driver's live location for a booking" })
  async trackDriver(
    @NestRequest() req: AuthenticatedRequest,
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
  ) {
    const userId = this.getUserIdFromRequest(req);
    return this.bookingsService.getDriverLocationForBooking(userId, bookingId);
  }

  @Patch(':bookingId/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a booking' })
  async cancelMyBooking(
    @NestRequest() req: AuthenticatedRequest,
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @Body() cancelDto: CancelBookingDto,
  ): Promise<MyRideDetailDto> {
    const userId = this.getUserIdFromRequest(req);
    const bookingEntity = await this.bookingsService.cancelBookingByUser(
      userId,
      bookingId,
      cancelDto,
    );
    return new MyRideDetailDto(bookingEntity, false);
  }

  @Post(':bookingId/feedback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit feedback for a booking' })
  async submitFeedback(
    @NestRequest() req: AuthenticatedRequest,
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @Body() feedbackDto: CreateFeedbackDto,
  ): Promise<{ message: string; booking: MyRideDetailDto }> {
    const userId = this.getUserIdFromRequest(req);
    const updatedBookingEntity =
      await this.bookingsService.addFeedbackToBooking(
        userId,
        bookingId,
        feedbackDto,
      );
    const canCancel: boolean =
      this.bookingsService.canUserCancelBooking(updatedBookingEntity);
    return {
      message: 'Feedback submitted successfully.',
      booking: new MyRideDetailDto(updatedBookingEntity, canCancel),
    };
  }

  @Get(':bookingId/receipt')
  @ApiOperation({ summary: 'Get the receipt for a booking' })
  async getBookingReceipt(
    @NestRequest() req: AuthenticatedRequest,
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
  ): Promise<any> {
    const userId = this.getUserIdFromRequest(req);
    return this.bookingsService.generateReceiptData(userId, bookingId);
  }
}