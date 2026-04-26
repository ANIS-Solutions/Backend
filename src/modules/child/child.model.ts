import { IChildBase } from '@anis/shared';
import mongoose, { Document, Schema } from 'mongoose';

export interface IChild extends Omit<IChildBase, 'id' | 'parentId'>, Document {
  id: string;
  parentId: mongoose.Types.ObjectId;
  fcmToken: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChildSchema = new Schema<IChild>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE'],
      required: true,
    },
    hobbies: {
      type: [String],
      default: [],
    },
    dob: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    deviceId: {
      type: String,
      required: false,
    },
    deviceName: {
      type: String,
      required: false,
    },
    fcmToken: {
      type: String,
      required: true,
    },
    points: {
      type: Number,
      default: 0,
    },
    parentId: {
      type: mongoose.Types.ObjectId,
      ref: 'Parent',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
ChildSchema.virtual('locations', {
  ref: 'Locations',
  localField: '_id',
  foreignField: 'childId',
  justOne: false,
});
export const ChildModel = mongoose.model<IChild>('Child', ChildSchema);
