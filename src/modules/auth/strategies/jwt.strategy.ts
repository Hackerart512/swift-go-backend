// src/modules/auth/strategies/jwt.strategy.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { DriversService } from '../../drivers/drivers.service'; // <-- 1. Import DriversService
import { User } from '../../users/users.entity';
import { Driver } from '../../drivers/entities/driver.entity';

// Define the shape of the data encoded in our JWT
interface JwtPayload {
  sub: string; // The user or driver ID
  role: 'user' | 'driver'; // This role field is CRITICAL
  // You might have other fields like email, phone, etc.
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly driversService: DriversService, // <-- 2. Inject DriversService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  // This `validate` method is the core of the strategy.
  // It's called by Passport.js AFTER it verifies the token's signature and expiration.
  // Whatever this method returns is attached to the Request object as `req.user`.
  async validate(payload: JwtPayload): Promise<any> {
    const { sub: id, role } = payload;

    // ======================== THIS IS THE CRITICAL FIX ========================

    // If the token is for a driver, use the DriversService.
    if (role === 'driver') {
      const driver = await this.driversService.findById(id);
      
      // This is the check that was failing before. Now it looks in the correct place.
      if (!driver || !driver.isActive) {
        throw new UnauthorizedException('Driver not found or account is inactive.');
      }
      
      // IMPORTANT: Return the driver entity.
      // It's also good practice to attach the role for other guards/decorators.
      return { ...driver, role: 'driver' }; 
    }

    // If the token is for a user, use the UsersService.
    if (role === 'user') {
      const user = await this.usersService.findById(id);
      
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or account is inactive.');
      }
      
      return { ...user, role: 'user' };
    }
    // ====================== END OF THE CRITICAL FIX =======================

    // If the token has no role or an unknown role, it's invalid.
    throw new UnauthorizedException('Invalid token: role is missing or invalid.');
  }
}