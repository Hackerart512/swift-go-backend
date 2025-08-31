/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SmsOtpModule } from './modules/smsotp/smsotp.module';
import { SuggestionsModule } from './modules/suggestions/suggestions.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { SubscriptionPlansModule } from './modules/subscription-plans/subscription-plans.module';
import { UserSubscriptionsModule } from './modules/user-subscriptions/user-subscriptions.module';
import { RoutesModule } from './modules/routes/routes.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { TripsModule } from './modules/trips/trips.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { HelpModule } from './modules/help/help.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { VoiceModule } from './modules/voice/voice.module';
import { SubscriptionTasksService } from './tasks/subscription.task';
import { TrackingModule } from './modules/tracking/tracking.module'; 
import { FirebaseModule } from './modules/firebase/firebase.module'; // <-- ADD THIS LINE

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: parseInt(configService.get<string>('DB_PORT') ?? '5432', 10),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // Be cautious with this in production
        logging: true,
        ssl: {
          rejectUnauthorized: false,
        },
      }),
      inject: [ConfigService],
    }),
    FirebaseModule, // <-- AND ADD THIS LINE HERE
    AuthModule,
    UsersModule,
    SmsOtpModule,
    SuggestionsModule,
    PromotionsModule,
    SubscriptionPlansModule,
    UserSubscriptionsModule,
    RoutesModule,
    VehiclesModule,
    TripsModule,
    BookingsModule,
    HelpModule,
    DriversModule,
    VoiceModule,
    TrackingModule,
  ],
  controllers: [],
  providers: [SubscriptionTasksService],
})
export class AppModule {}