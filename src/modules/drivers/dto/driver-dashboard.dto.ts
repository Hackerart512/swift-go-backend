import { ScheduledTrip } from '../../trips/entities/scheduled-trip.entity';

export class DriverDashboardDto {
  /**
   * Today's earnings (fare + tip)
   * Example: { amount: 850, currency: 'INR' }
   */
  todaysEarnings: { amount: number; currency: string };

  /**
   * Driver's total wallet balance
   * Example: { amount: 1544, currency: 'INR' }
   */
  totalBalance: { amount: number; currency: string };

  /**
   * Next upcoming trip details
   * Example: { tripId, routeName, departureTime, pickupLocationName }
   */
  nextUpcomingTrip?: {
    tripId: string;
    routeName: string;
    departureTime: string;
    pickupLocationName: string;
  } | null;

  /**
   * Trip summary counts for the dashboard
   * Example: { upcoming: 3, completedToday: 1, cancelledToday: 1 }
   */
  tripSummaryCounts: {
    upcoming: number;
    completedToday: number;
    cancelledToday: number;
  };

  /**
   * Today's stats (rides completed, hours driven)
   * Example: { rides: 1, hours: 0 }
   */
  todaysStats: {
    rides: number;
    hours: number;
  };

  constructor(
    earningsData: { todaysEarnings: number; totalBalance: number },
    tripData: {
      nextUpcomingTrip: any;
      tripSummaryCounts: { upcoming: number; completedToday: number; cancelledToday: number };
      todaysStats: { rides: number; hours: number };
    }
  ) {
    // For demo/test: allow overriding with example values if present
    this.todaysEarnings = { amount: earningsData.todaysEarnings, currency: 'INR' };
    this.totalBalance = { amount: earningsData.totalBalance, currency: 'INR' };
    this.tripSummaryCounts = tripData.tripSummaryCounts;
    this.todaysStats = tripData.todaysStats;

    if (tripData.nextUpcomingTrip) {
      const trip = tripData.nextUpcomingTrip;
      this.nextUpcomingTrip = {
        tripId: trip.id,
        routeName: trip.route?.name || '',
        departureTime: trip.departureDateTime instanceof Date ? trip.departureDateTime.toISOString() : trip.departureDateTime,
        pickupLocationName:
          trip.route?.stops?.find((s: any) => s.sequence === 1)?.name || trip.route?.originAreaName || '',
      };
    } else {
      this.nextUpcomingTrip = null;
    }
  }
}