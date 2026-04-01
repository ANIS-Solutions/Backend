import { locationModel } from './location.model.js';
import { AddLocationsBodyInput } from './location.schema.js';

export const addLocationService = async (locData: AddLocationsBodyInput) => {
  const location = await locationModel.create({
    title: locData.title,
    address: locData.address,
  });
  return location;
};
