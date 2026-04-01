import mongoose, { Schema } from 'mongoose';

export interface ILocations {
  title: string;
  address: string;
}

const locationsSchema = new Schema<ILocations>({
  title: { type: String, required: true },
  address: { type: String, required: true },
});

export const locationModel = mongoose.model<ILocations>(
  'Locations',
  locationsSchema,
);
