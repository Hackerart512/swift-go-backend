// src/modules/tracking/tracking.gateway.ts

import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { DriversService } from '../drivers/drivers.service';
import { TripsService } from '../trips/trips.service';
import { TripStatus } from '../trips/entities/scheduled-trip.entity';

interface DriverLocationPayload {
  tripId: string;
  latitude: number;
  longitude: number;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'tracking',
})
export class TrackingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TrackingGateway.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @Inject(forwardRef(() => DriversService))
    private readonly driversService: DriversService,
    @Inject(forwardRef(() => TripsService))
    private readonly tripsService: TripsService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`[CONNECTION] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`[CONNECTION] Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinBookingRoom')
  handleJoinBookingRoom(
    @MessageBody() bookingId: string,
    @ConnectedSocket() client: Socket,
  ): void {
    if (!bookingId) {
      this.logger.warn(
        `[PASSENGER] Client ${client.id} tried to join an invalid room.`,
      );
      return;
    }
    const room = `booking_${bookingId}`;
    client.join(room);
    this.logger.log(
      `[PASSENGER] SUCCESS: Client ${client.id} has joined room: ${room}`,
    );
    client.emit('joinedRoom', `Successfully joined room ${room}`);
  }

  @SubscribeMessage('updateDriverLocation')
  async handleUpdateDriverLocation(
    @MessageBody() payload: DriverLocationPayload,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const { tripId, latitude, longitude } = payload;
    this.logger.log(`[DRIVER] Received 'updateDriverLocation' for trip ${tripId}`);

    if (!tripId || latitude === undefined || longitude === undefined) {
      this.logger.warn(`[DRIVER] Invalid payload received from ${client.id}. Aborting.`);
      return;
    }

    const trip = await this.tripsService.findOneForAdmin(tripId);
    if (!trip) {
      this.logger.warn(`[DRIVER] Trip with ID ${tripId} not found. Aborting broadcast.`);
      return;
    }

    if (trip.status !== TripStatus.ACTIVE) {
      this.logger.warn(`[DRIVER] Trip ${tripId} is not ACTIVE. Broadcast will be skipped.`);
      return;
    }

    const driverId = trip.driverId;
    const location = { latitude, longitude };

    await this.driversService.updateDriverLocation(driverId, location);
    this.logger.log(`[DB] Updated driver ${driverId}'s location in the database.`);

    // ============================= THE FIX =============================
    // Find all bookings for this trip that are either confirmed or ongoing.
    // This ensures passengers who have been onboarded still get updates.
    const bookings = await this.bookingRepository.find({
      where: {
        scheduledTripId: tripId,
        status: In([BookingStatus.CONFIRMED, BookingStatus.ONGOING]), // <-- THE FIX
      },
    });
    // =================================================================

    if (bookings.length === 0) {
      this.logger.warn(`[BROADCAST] Found 0 relevant bookings for trip ${tripId}. No one to notify.`);
      return;
    }

    this.logger.log(`[BROADCAST] Preparing to broadcast location to ${bookings.length} booking room(s).`);
    for (const booking of bookings) {
      this.sendDriverLocationToBooking(booking.id, {
        ...location,
        rideStarted: booking.status === BookingStatus.ONGOING, // Also tell the app if the individual ride has started
      });
    }
    this.logger.log(`[BROADCAST] Broadcast complete for trip ${tripId}.`);
  }

  public sendDriverLocationToBooking(
    bookingId: string,
    locationData: { latitude: number; longitude: number; rideStarted: boolean },
  ) {
    const room = `booking_${bookingId}`;
    // Use 'driverLocationUpdate' to match the Flutter client
    this.server.to(room).emit('driverLocationUpdate', locationData); 
    this.logger.log(`  -> Sent update to room: ${room}`);
  }

  // --- Passenger-side specific methods from your ViewModel ---
  @SubscribeMessage('leaveBookingRoom')
  handleLeaveBookingRoom(
    @MessageBody() bookingId: string,
    @ConnectedSocket() client: Socket,
  ) {
    if (bookingId) {
      const room = `booking_${bookingId}`;
      client.leave(room);
      this.logger.log(`[PASSENGER] Client ${client.id} has left room: ${room}`);
    }
  }

  // No changes needed for driver-side rooms
  @SubscribeMessage('joinDriverRoom')
  handleJoinDriverRoom() { /* ... */ }

  @SubscribeMessage('leaveDriverRoom')
  handleLeaveDriverRoom() { /* ... */ }

  @SubscribeMessage('tripStarted')
  handleTripStarted() { /* ... */ }
}