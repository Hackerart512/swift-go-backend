// src/modules/bookings/dto/my-ride-item.dto.ts

import { Booking, BookingStatus } from '../entities/booking.entity';
import { differenceInMinutes, format } from 'date-fns';
import { ApiProperty } from '@nestjs/swagger';
import { KycStatus } from '../../users/users.entity';
import { TripStatus } from '../../trips/entities/scheduled-trip.entity';

class IntermediateStopDto {
  @ApiProperty()
  name: string;
  @ApiProperty()
  latitude: number;
  @ApiProperty()
  longitude: number;
}

export class MyRideItemDto {
  @ApiProperty({ description: 'Booking ID', example: 'booking-uuid-1' })
  bookingId: string;

  @ApiProperty({ description: 'Customer Reference Number', example: 'CRN123456' })
  crn: string;

  @ApiProperty({ description: 'Vehicle description', example: 'Manual - Sedan' })
  vehicleDescription: string;

  @ApiProperty({ description: 'Date of the ride', example: '18/11/2023' })
  date: string;

  @ApiProperty({ description: 'Time of the ride', example: '10:24 AM' })
  time: string;

  @ApiProperty({ description: 'Fare for the ride', example: '₹1053.99' })
  fare: string;
  
  @ApiProperty({ description: 'Payment method icon', example: 'cash_icon', required: false })
  paymentMethodIcon?: string;

  @ApiProperty({ description: 'Payment method display value', example: 'Cash' })
  paymentMethodDisplay: string;

  @ApiProperty({ description: 'Pickup location name', example: 'Lanco Hills' })
  pickupLocation: string;

  @ApiProperty({ description: 'Destination location name', example: 'Wipro Circle' })
  destinationLocation: string;

  @ApiProperty({ description: 'Booking status', enum: BookingStatus, example: BookingStatus.CONFIRMED })
  status: BookingStatus;

  @ApiProperty({ description: 'User-friendly status display', example: 'Upcoming' })
  statusDisplay: string;

  @ApiProperty({
    type: [IntermediateStopDto],
    required: false,
    description: "The list of stops for the passenger's specific journey, including start, end, and intermediate points.",
  })
  stops?: IntermediateStopDto[];

  constructor(booking: Booking) {
    this.bookingId = booking.id;
    this.crn = booking.crn;
    this.vehicleDescription = `${booking.scheduledTrip?.vehicle?.vehicleType?.transmissionType || 'N/A'} - ${booking.scheduledTrip?.vehicle?.vehicleType?.category || 'Car'}`;
    this.date = booking.tripDepartureDateTime
      ? format(new Date(booking.tripDepartureDateTime), 'dd/MM/yyyy')
      : 'N/A';
    this.time = booking.tripDepartureDateTime
      ? format(new Date(booking.tripDepartureDateTime), 'hh:mm a')
      : 'N/A';
    const totalFare = Number(booking.totalFarePaid);
    this.fare = `${booking.currency === 'INR' ? '₹' : ''}${isNaN(totalFare) ? 0 : totalFare.toFixed(2)}`;
    const paymentDetails = booking.paymentDetails as
      | { displayValue?: string; gateway?: string }
      | undefined;
    this.paymentMethodDisplay =
      paymentDetails?.displayValue &&
      typeof paymentDetails.displayValue === 'string'
        ? paymentDetails.displayValue
        : paymentDetails?.gateway && typeof paymentDetails.gateway === 'string'
          ? paymentDetails.gateway
          : 'N/A';
    this.pickupLocation = booking.pickupStop?.name || 'N/A';
    this.destinationLocation = booking.dropOffStop?.name || 'N/A';
    this.status = booking.status;
    this.statusDisplay = formatBookingStatus(booking.status);

    // This new logic block populates the 'stops' array for the passenger.
    const allRouteStops = booking.scheduledTrip?.route?.stops;
    const pickupStopId = booking.pickupStop?.id;
    const dropOffStopId = booking.dropOffStop?.id;

    if (allRouteStops && pickupStopId && dropOffStopId) {
      const sortedStops = [...allRouteStops].sort((a, b) => a.sequence - b.sequence);

      const startIndex = sortedStops.findIndex(s => s.id === pickupStopId);
      const endIndex = sortedStops.findIndex(s => s.id === dropOffStopId);

      if (startIndex !== -1 && endIndex !== -1 && startIndex <= endIndex) {
        const relevantStops = sortedStops.slice(startIndex, endIndex + 1);

        this.stops = relevantStops.map(stop => ({
          name: stop.name,
          latitude: stop.location?.coordinates?.[1] || 0,
          longitude: stop.location?.coordinates?.[0] || 0,
        }));
      }
    }
  }
}

export class MyRideDetailDto extends MyRideItemDto {
  mapPolyline?: string;
  tripStatus?: TripStatus;
  rideDetail: {
    rideType: string;
    transmissionType: string;
    carCategory: string;
    duration: string;
    dateTime: string;
    bookedFor: string;
  };
  paymentBreakdown: {
    rideFare: string;
    promo?: string;
    tax?: string;
    total: string;
    paymentVia: string;
  };
  cancellationReason?: string;
  canCancel: boolean;
  canRate: boolean;
  canTrack: boolean;
  passengerKycStatus: KycStatus;
  isKycVerified: boolean;

  constructor(booking: Booking, canCancelRide: boolean = false) {
    super(booking); // Calls the parent constructor which now has our new logic

    const dep = booking.scheduledTrip?.departureDateTime;
    const arr = booking.scheduledTrip?.estimatedArrivalDateTime;
    let durationStr = 'N/A';
    if (dep && arr) {
      const durationMinutes = differenceInMinutes(new Date(arr), new Date(dep));
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      durationStr =
        `${hours > 0 ? hours + ' Hr ' : ''}${minutes > 0 ? minutes + ' Min' : ''}`.trim() ||
        'N/A';
    }

    this.tripStatus = booking.scheduledTrip?.status;
    this.canTrack = booking.scheduledTrip?.status === TripStatus.ACTIVE;

    this.rideDetail = {
      rideType: booking.rideType || 'One Way',
      transmissionType:
        booking.scheduledTrip?.vehicle?.vehicleType?.transmissionType ||
        'Manual',
      carCategory:
        booking.scheduledTrip?.vehicle?.vehicleType?.category ||
        booking.scheduledTrip?.vehicle?.vehicleType?.name ||
        'Car',
      duration: durationStr,
      dateTime: booking.tripDepartureDateTime
        ? format(new Date(booking.tripDepartureDateTime), 'dd/MM/yyyy, hh:mm a')
        : 'N/A',
      bookedFor: booking.user?.fullName || 'Self (Personal)',
    };

    this.paymentBreakdown = {
      rideFare: `${booking.currency === 'INR' ? '\u20b9' : ''}${Number(booking.baseFare ?? booking.totalFarePaid).toFixed(2)}`,
      promo: booking.discountAmount
        ? `-\u20b9${Number(booking.discountAmount).toFixed(2)}`
        : undefined,
      tax: booking.taxAmount
        ? `\u20b9${Number(booking.taxAmount).toFixed(2)}`
        : undefined,
      total: `${booking.currency === 'INR' ? '\u20b9' : ''}${Number(booking.totalFarePaid).toFixed(2)}`,
      paymentVia: this.paymentMethodDisplay,
    };

    this.cancellationReason = booking.cancellationReason;
    this.canCancel =
      booking.status === BookingStatus.CONFIRMED && canCancelRide;
    this.canRate =
      booking.status === BookingStatus.COMPLETED && !booking.rating;

    if (booking.user) {
      this.passengerKycStatus = booking.user.kycStatus;
      this.isKycVerified = booking.user.kycStatus === KycStatus.VERIFIED;
    } else {
      this.passengerKycStatus = KycStatus.PENDING;
      this.isKycVerified = false;
    }
  }
}

function formatBookingStatus(status: BookingStatus | string): string {
  let normalizedStatus: BookingStatus = status as BookingStatus;
  if (
    typeof status === 'string' &&
    Object.prototype.hasOwnProperty.call(BookingStatus, status)
  ) {
    normalizedStatus = (BookingStatus as Record<string, BookingStatus>)[status];
  }

  switch (normalizedStatus) {
    case BookingStatus.CONFIRMED:
      return 'Upcoming';
    case BookingStatus.ONGOING:
      return 'Ongoing';
    case BookingStatus.COMPLETED:
      return 'Completed';
    case BookingStatus.CANCELLED_BY_ADMIN:
    case BookingStatus.CANCELLED_BY_USER:
      return 'Cancelled';
    case BookingStatus.NO_SHOW:
      return 'No Show';
    case BookingStatus.PENDING_PAYMENT:
      return 'Pending Payment';
    default:
      return String(normalizedStatus)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
  }
}