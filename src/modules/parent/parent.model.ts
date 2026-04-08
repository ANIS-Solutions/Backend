import { IParentBase } from '@anis/shared';
import mongoose, { Document, Schema } from 'mongoose';

export interface IParent extends Omit<IParentBase, 'id'>, Document {
  id: string;
  password: string;
  isVerified: boolean;
  refreshToken?: string | undefined;
  passwordChangedAt: Date;
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
      index: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
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

    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

ParentSchema.virtual('fullName').get(function (this: IParent) {
  return `${this.firstName} ${this.lastName}`;
});

export const ParentModel = mongoose.model<IParent>('Parent', ParentSchema);
