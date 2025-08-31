// src/modules/bookings/dto/booking-response.dto.ts
import { Booking, BookingStatus } from '../entities/booking.entity';
import { differenceInMinutes, isValid } from 'date-fns'; // Added isValid
import { ApiProperty } from '@nestjs/swagger';

export class BookingResponseDto {
  @ApiProperty({ description: 'Booking ID', example: 'booking-uuid-1' })
  id: string;

  @ApiProperty({ description: 'Customer Reference Number', example: 'CRN123456' })
  crn: string;

  @ApiProperty({ description: 'User ID', example: 'user-uuid-1' })
  userId: string;

  @ApiProperty({ description: 'Scheduled trip ID', example: 'trip-uuid-1' })
  scheduledTripId: string;

  @ApiProperty({ description: 'Trip departure date and time', example: '2024-06-01T08:00:00Z', required: false })
  tripDepartureDateTime?: string;

  @ApiProperty({ description: 'Trip estimated arrival date and time', example: '2024-06-01T10:00:00Z', required: false })
  tripEstimatedArrivalDateTime?: string;

  @ApiProperty({ description: 'Route name', example: 'Downtown to Airport', required: false })
  routeName?: string;

  @ApiProperty({ description: 'Pickup stop name', example: 'Lanco Hills', required: false })
  pickupStopName?: string;

  @ApiProperty({ description: 'Dropoff stop name', example: 'Wipro Circle', required: false })
  dropoffStopName?: string;

  @ApiProperty({ description: 'Booked seat IDs', example: ['1A', '2B'] })
  bookedSeatIds: string[];

  @ApiProperty({ description: 'Number of seats booked', example: 2 })
  numberOfSeatsBooked: number;

  @ApiProperty({ description: 'Total fare paid', example: 950 })
  totalFarePaid: number;

  @ApiProperty({ description: 'Base fare', example: 1000, required: false })
  baseFare?: number;

  @ApiProperty({ description: 'Discount amount', example: 100, required: false })
  discountAmount?: number;

  @ApiProperty({ description: 'Tax amount', example: 50, required: false })
  taxAmount?: number;

  @ApiProperty({ description: 'Coupon code applied', example: 'WELCOME50', required: false })
  couponCodeApplied?: string;

  @ApiProperty({ description: 'Currency', example: 'INR' })
  currency: string;

  @ApiProperty({ description: 'Booking status', enum: BookingStatus, example: BookingStatus.CONFIRMED })
  bookingStatus: BookingStatus;

  @ApiProperty({ description: 'Payment gateway', example: 'razorpay', required: false })
  paymentGateway?: string;

  @ApiProperty({ description: 'Payment method display', example: 'Card/Online', required: false })
  paymentVia?: string;

  @ApiProperty({ description: 'Boarding OTP', example: '123456', required: false })
  boardingOtp?: string;

  @ApiProperty({ description: 'Booking creation date and time', example: '2024-05-01T12:00:00Z' })
  createdAt: string;

  @ApiProperty({ description: 'Ride type display', example: 'One Way', required: false })
  rideTypeDisplay?: string;

  @ApiProperty({ description: 'Transmission type display', example: 'Manual', required: false })
  transmissionTypeDisplay?: string;

  @ApiProperty({ description: 'Car category display', example: 'Sedan', required: false })
  carCategoryDisplay?: string;

  @ApiProperty({ description: 'Duration display', example: '2 Hr 0 Min', required: false })
  durationDisplay?: string;

  @ApiProperty({ description: 'Booked for name', example: 'Self', required: false })
  bookedForName?: string;

  @ApiProperty({ description: 'Cancellation reason', example: 'Plans changed', required: false })
  cancellationReason?: string;

  @ApiProperty({ description: 'Rating given by user', example: 5, required: false })
  rating?: number;

  @ApiProperty({ description: 'Feedback comment', example: 'Great ride!', required: false })
  feedbackComment?: string;

  constructor(booking: Booking) {
    this.id = booking.id;
    this.crn = booking.crn;
    this.userId = booking.userId;
    this.scheduledTripId = booking.scheduledTripId;

    if (
      booking.scheduledTrip &&
      booking.scheduledTrip.departureDateTime &&
      isValid(new Date(booking.scheduledTrip.departureDateTime))
    ) {
      this.tripDepartureDateTime = new Date(
        booking.scheduledTrip.departureDateTime,
      ).toISOString();
      if (
        booking.scheduledTrip.estimatedArrivalDateTime &&
        isValid(new Date(booking.scheduledTrip.estimatedArrivalDateTime))
      ) {
        this.tripEstimatedArrivalDateTime = new Date(
          booking.scheduledTrip.estimatedArrivalDateTime,
        ).toISOString();
        const durationMinutes = differenceInMinutes(
          new Date(booking.scheduledTrip.estimatedArrivalDateTime),
          new Date(booking.scheduledTrip.departureDateTime),
        );
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        this.durationDisplay =
          `${hours > 0 ? hours + ' Hr ' : ''}${minutes > 0 ? minutes + ' Min' : ''}`.trim() ||
          'N/A';
      }
      if (booking.scheduledTrip.route) {
        this.routeName = booking.scheduledTrip.route.name;
        this.rideTypeDisplay =
          booking.rideType ||
          booking.scheduledTrip.route.description ||
          'One Way';
      }
      if (
        booking.scheduledTrip.vehicle &&
        booking.scheduledTrip.vehicle.vehicleType
      ) {
        this.transmissionTypeDisplay =
          booking.scheduledTrip.vehicle.vehicleType.transmissionType ||
          'Manual';
        this.carCategoryDisplay =
          booking.scheduledTrip.vehicle.vehicleType.category ||
          booking.scheduledTrip.vehicle.vehicleType.name;
      }
    } else {
      // Handle cases where scheduledTrip or its dates might not be fully loaded/valid
      this.tripDepartureDateTime = booking.tripDepartureDateTime
        ? new Date(booking.tripDepartureDateTime).toISOString()
        : 'N/A'; // Use denormalized date
      this.routeName = 'N/A';
      this.rideTypeDisplay = booking.rideType || 'One Way';
      this.transmissionTypeDisplay = 'N/A';
      this.carCategoryDisplay = 'N/A';
      this.durationDisplay = 'N/A';
    }

    this.pickupStopName = booking.pickupStop?.name || 'N/A';
    this.dropoffStopName = booking.dropOffStop?.name || 'N/A'; // Ensure this matches entity
    this.bookedSeatIds = booking.bookedSeatIds;
    this.numberOfSeatsBooked = booking.numberOfSeatsBooked; // Use correct name

    this.totalFarePaid = Number(booking.totalFarePaid); // Use correct name
    this.baseFare = booking.baseFare ? Number(booking.baseFare) : undefined;
    this.discountAmount = booking.discountAmount
      ? Number(booking.discountAmount)
      : undefined;
    this.taxAmount = booking.taxAmount ? Number(booking.taxAmount) : undefined;
    this.couponCodeApplied = booking.couponCodeApplied;

    this.currency = booking.currency;
    this.bookingStatus = booking.status;
    this.paymentGateway = booking.paymentDetails?.gateway;
    this.paymentVia = this.mapPaymentGatewayToDisplay(
      booking.paymentDetails?.gateway,
    );

    if (
      booking.status === BookingStatus.CONFIRMED ||
      booking.status === BookingStatus.ONGOING
    ) {
      // this.boardingOtp = booking.boardingOtp; // Still be careful here
    }
    this.createdAt = new Date(booking.createdAt).toISOString();
    this.bookedForName = booking.user?.fullName || 'Self';
    this.cancellationReason = booking.cancellationReason;
    this.rating = booking.rating;
    this.feedbackComment = booking.feedbackComment;
  }

  private mapPaymentGatewayToDisplay(gateway?: string): string {
    // ... (same as before)
    if (!gateway) return 'N/A';
    switch (gateway.toLowerCase()) {
      case 'cash':
        return 'Cash';
      case 'swiftgo_balance':
      case 'wallet':
        return 'SwiftGo Balance';
      case 'phonepe':
        return 'PhonePe';
      case 'card':
      case 'razorpay':
        return 'Card/Online';
      case 'subscription_credit':
        return 'Subscription';
      default:
        return gateway;
    }
  }
}
