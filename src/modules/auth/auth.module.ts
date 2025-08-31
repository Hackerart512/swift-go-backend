// src/modules/auth/auth.module.ts

import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { HttpModule } from '@nestjs/axios';
import { SmsOtpModule } from '../smsotp/smsotp.module';
import { DriverJwtAuthGuard } from './guards/driver-jwt-auth.guard';
import { DriversModule } from '../drivers/drivers.module';
import { DriverAuthService } from './driver-auth.service';
import { DriverAuthController } from './driver-auth.controller';
import { UserJwtAuthGuard } from './guards/user-jwt-auth.guard';
import { KycModule } from '../kyc/kyc.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION_TIME'),
        },
      }),
      inject: [ConfigService],
    }),
    HttpModule,
    ConfigModule,
    SmsOtpModule,
    DriversModule,
    forwardRef(() => KycModule),
  ],
  controllers: [AuthController, DriverAuthController],
  providers: [
    AuthService,
    DriverAuthService,
    JwtStrategy,
    DriverJwtAuthGuard,
    UserJwtAuthGuard,
  ],
  exports: [PassportModule, JwtModule, AuthService],
})
export class AuthModule {}