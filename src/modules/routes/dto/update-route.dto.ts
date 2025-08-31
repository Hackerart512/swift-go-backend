import { PartialType } from '@nestjs/mapped-types';
import { CreateRouteDto } from './create-route.dto';
import { IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateRouteStopDto } from './create-route-stop.dto'; // Can reuse for updating stops or create UpdateRouteStopDto
// If updating stops, it's complex: delete existing & add new, or update existing by ID.
 // For simplicity here, let's assume UpdateRouteDto might not allow direct stop manipulation this way,
 // or we'd need a more complex DTO for stops (e.g., with optional ID for existing stops).
 // A simpler approach is separate endpoints for managing a route's stops.

 export class UpdateRouteDto extends PartialType(CreateRouteDto) {
    // We remove 'stops' from here to handle stop updates separately for simplicity
    // If you want to update stops with the route, the DTO and service logic become more complex
    // to handle existing stops (update/delete) and new stops (create).
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateRouteStopDto) // Or an UpdateRouteStopDto with optional id
    stops?: CreateRouteStopDto[]; // This implies replacing all stops, or requires complex logic
 }
/*
 * Note on `UpdateRouteDto` and `stops`: Updating nested arrays like stops can be tricky. Options:
    1.  Replace all stops (client sends the full new list).
    2.  Have separate endpoints: `POST /routes/{routeId}/stops`, `PATCH /routes/{routeId}/stops/{stopId}`, `DELETE /routes/{routeId}/stops/{stopId}`. This is often cleaner.
    For now, `UpdateRouteDto`
*/