import { Injectable, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '../../users/users.entity';

@Injectable()
export class UserJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info, context) {
    if (err || !user) {
      throw err || new UnauthorizedException('Unauthorized');
    }
    // Only allow users (not drivers)
    if (user.role !== UserRole.PASSENGER && user.role !== UserRole.ADMIN && user.role !== 'user') {
      throw new ForbiddenException('Access denied. Only users can access this endpoint.');
    }
    return user;
  }
}
