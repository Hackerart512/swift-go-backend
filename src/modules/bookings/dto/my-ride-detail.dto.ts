// src/modules/bookings/dto/my-ride-detail.dto.ts

import { Booking, BookingStatus } from '../entities/booking.entity';
import { differenceInMinutes, format } from 'date-fns';
import { MyRideItemDto } from './my-ride-item.dto';
import { KycStatus } from '../../users/users.entity';
// --- IMPORT THE TRIP STATUS ENUM ---
import { TripStatus } from '../../trips/entities/scheduled-trip.entity';

export class MyRideDetailDto extends MyRideItemDto {
  // Inherits from list item DTO
  mapPolyline?: string; // Placeholder for future map data

  // --- NEW PROPERTY TO EXPOSE TRIP STATUS ---
  tripStatus?: TripStatus;

  rideDetail: {
    rideType: string;
    transmissionType: string;
    carCategory: string;
    duration: string; // e.g., "2 Hrs"
    dateTime: string; // Full date & time "18/11/2023, 10:24 AM"
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
  
  // --- NEW PROPERTY TO ENABLE/DISABLE TRACKING BUTTON ON THE FRONTEND ---
  canTrack: boolean;

  passengerKycStatus: KycStatus;
  isKycVerified: boolean;

  constructor(booking: Booking, canCancelRide: boolean = false) {
    super(booking); // Call parent constructor

    // this.mapPolyline = booking.scheduledTrip?.route?.googleMapsPolyline; // Example

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

    // --- ASSIGN THE NEW PROPERTIES ---
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
      booking.status === BookingStatus.CONFIRMED && canCancelRide; // Logic for cancellability
    this.canRate =
      booking.status === BookingStatus.COMPLETED && !booking.rating; // Can rate if completed and not yet rated

    if (booking.user) {
      this.passengerKycStatus = booking.user.kycStatus;
      this.isKycVerified = booking.user.kycStatus === KycStatus.VERIFIED;
    } else {
      this.passengerKycStatus = KycStatus.PENDING;
      this.isKycVerified = false;
    }
  }
}