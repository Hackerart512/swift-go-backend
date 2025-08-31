// src/modules/auth/guards/driver-jwt-auth.guard.ts
import { Injectable, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '../../users/users.entity'; // Or from a shared enum file

// Define the shape of the user object that our JwtStrategy attaches to the request
// This should match what your strategy's validate() method returns
interface JwtUserPayload {
  id: string; // or sub: string
  role: UserRole; // This is the crucial field
  // other fields like email, phone...
}

@Injectable()
export class DriverJwtAuthGuard extends AuthGuard('jwt') {
  
  // This method is called after the built-in logic of AuthGuard('jwt') runs.
  // The 'user' argument will be the object returned by your JwtStrategy's validate() method.
  handleRequest<TUser extends JwtUserPayload = JwtUserPayload>(
    err: any,
    user: TUser,
    info: any,
    context: ExecutionContext,
    status?: any
  ): TUser {
    // 1. First, handle standard JWT errors (e.g., token expired, invalid signature)
    // The default AuthGuard logic does this, and if it fails, 'user' will be falsy.
    if (err || !user) {
      // You can customize the error message based on the 'info' object
      let message = 'Unauthorized';
      if (info?.name === 'TokenExpiredError') {
        message = 'Access token has expired. Please log in again.';
      } else if (info?.name === 'JsonWebTokenError') {
        message = 'Invalid access token.';
      }
      throw err || new UnauthorizedException(message);
    }

    // 2. If the user is authenticated, now check their role.
    if (user.role !== UserRole.DRIVER) {
      console.warn(`Authorization Failed: User ${user.id} with role '${user.role}' attempted to access a DRIVER-only route.`);
      throw new ForbiddenException('Access denied. You do not have permission to access this resource.');
    }

    // 3. If everything passes, return the user object to be attached to req.user
    return user;
  }
}