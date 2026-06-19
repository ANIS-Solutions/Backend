import { IDeviceBase, IParentBase } from '@anis/shared';
import mongoose, { Document, Schema } from 'mongoose';

const PLATFORM_VALUES = ['ios', 'android', 'web'] as const;
const DeviceSchema = new Schema<IDeviceBase>(
  {
    fcmToken: {
      type: String,
      required: true,
      trim: true,
    },
    platform: {
      type: String,
      enum: PLATFORM_VALUES,
      required: true,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
    timestamps: { createdAt: true, updatedAt: false },
  },
);
export interface IParent extends Omit<IParentBase, 'id'>, Document {
  id: string;
  password: string;
  isVerified: boolean;
  refreshToken?: string | undefined;
  passwordChangedAt: Date;
  googleId?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  fullName: string;
}

const ParentSchema = new Schema<IParent>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      required: false,
    },
    password: {
      type: String,
      required: false,
      select: false,
      private: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    birthDate: {
      type: Date,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    refreshToken: String,
    passwordChangedAt: { type: Date, default: Date.now },
    googleId: { type: String, index: true, sparse: true },
    avatar: { type: String },

    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
    devices: {
      type: [DeviceSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
ParentSchema.index({ 'devices.fcmToken': 1 });
ParentSchema.virtual('fullName').get(function (this: IParent) {
  return `${this.firstName} ${this.lastName}`;
});

export const ParentModel = mongoose.model<IParent>('Parent', ParentSchema);
