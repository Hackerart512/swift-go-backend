// src/modules/auth/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Optional: You can override handleRequest to customize error handling or logic
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Add your custom authentication logic here
    // for example, call super.logIn(request) to establish a session.
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(err: any, user: any, info: any, context: ExecutionContext, status?: any): TUser {
    // You can throw an exception based on either "info" or "err" arguments
    if (err || !user) {
      // Log more details for debugging if needed
      // console.error('JWT Auth Guard Error:', err);
      // console.error('JWT Auth Guard Info:', info);
      // console.error('JWT Auth Guard User:', user);

      // info might contain specifics like 'TokenExpiredError' or 'JsonWebTokenError'
      let message = 'Unauthorized';
      if (info && typeof info.message === 'string') {
         if (info.name === 'TokenExpiredError') {
             message = 'Access token has expired. Please log in again.';
         } else if (info.name === 'JsonWebTokenError') {
             message = 'Invalid access token.';
         } else {
             message = info.message;
         }
      } else if (err && typeof err.message === 'string') {
         message = err.message;
      }

      throw err || new UnauthorizedException(message);
    }
    return user; // If authentication is successful, the user object is returned
  }
}