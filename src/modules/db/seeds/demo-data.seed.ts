import { Point } from 'typeorm';
import { User } from '../../users/users.entity';
import { Route } from '../../routes/entities/route.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { getRepository } from 'typeorm';

// Helper function to create Point from latitude, longitude (user-friendly order)
function toPointFromLatLng(lat: number, lng: number): Point {
  return { type: 'Point', coordinates: [lng, lat] };
}

const lancoHillsCoords: Point = toPointFromLatLng(17.4169, 78.3720);   // (lat, lng)
const myHomeBhoojaCoords: Point = toPointFromLatLng(17.4325, 78.3785); // (lat, lng)
const wiproCircleCoords: Point = toPointFromLatLng(17.4428, 78.3490);  // (lat, lng)
const kphbMetroCoords: Point = toPointFromLatLng(17.4948, 78.3919);    // (lat, lng)
// ...
const madhapurMetroCoords: Point = toPointFromLatLng(17.4474, 78.3910);
const inorbitMallCoords: Point = toPointFromLatLng(17.4336, 78.3827);
const gachibowliStadiumCoords: Point = toPointFromLatLng(17.4401, 78.3556);
const miyapurMetroCoords: Point = toPointFromLatLng(17.5002, 78.3639);
// ... 

const userRepo = getRepository(User);
const routeRepo = getRepository(Route);
const vehicleRepo = getRepository(Vehicle); 