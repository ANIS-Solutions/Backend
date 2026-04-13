import { verifyChildOwnership } from '@/core/middleware/isParent.middleware';
import bindRoute from '@/core/utils/routeBounder';
import {
  addLocation,
  getAllLocation,
  getLocation,
  removeLocation,
  stream_location,
  updateLocation,
  updateTrackLocation,
} from '@/modules/locations/location.controller';
import {
  addLocationSchema,
  getAllLocationSchema,
  getLocationSchema,
  removeLocationSchema,
  telemetryTrackLocationSchema,
  updateLocationSchema,
} from '@/modules/locations/location.schema';
import { API } from '@anis/shared';
import { Router } from 'express';

const locationRouter = Router();
const { ADD, GET_ALL, GET, UPDATE, DELETE } = API.LOCATIONS.ROUTES;
locationRouter.get('/stream/:childId', /* authMiddleware, */ stream_location);

bindRoute(locationRouter, ADD, addLocation, addLocationSchema);
bindRoute(locationRouter, UPDATE, updateLocation, updateLocationSchema);
bindRoute(locationRouter, DELETE, removeLocation, removeLocationSchema);
bindRoute(locationRouter, GET_ALL, getAllLocation, getAllLocationSchema);
bindRoute(locationRouter, GET, getLocation, getLocationSchema);
bindRoute(
  locationRouter,
  { method: 'post', path: '/telemetry/:childId', auth: true },
  updateTrackLocation,
  telemetryTrackLocationSchema,
);
export default locationRouter;
