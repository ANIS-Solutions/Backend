import { ILocationBase } from '@anis/shared';
import mongoose, { Document, Schema } from 'mongoose';

export interface ILocation
  extends Omit<ILocationBase, 'id' | 'childId'>, Document {
  id: string;
  childId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const locationSchema = new Schema<ILocation>(
  {
    title: { type: String, required: true },
    childId: {
      type: Schema.Types.ObjectId,
      ref: 'Child',
      required: true,
      index: true,
    },
    safeRadius: { type: Number, required: true },
    address: { type: String, required: true },
    location: {
      type: { type: String, enum: ['Point'], required: true },
      coordinates: { type: [Number], required: true },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
locationSchema.index({ location: '2dsphere' });
export const locationModel = mongoose.model<ILocation>(
  'Locations',
  locationSchema,
);
