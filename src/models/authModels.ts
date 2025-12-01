import mongoose, { Document, Schema } from 'mongoose';

export interface IParent extends Document {
  firstName: string;
  lastName: string;
  password: string;
  phone: string;
  isVerified: boolean;
  otp?: {
    code: string;
    expiresAt: Date;
  };
  refreshToken?: string;
  createdAt: Date;
  updatedAt?: Date;
}

const ParentSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true, // B-Tree index
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
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
    otp: {
      code: { type: String },
      expiresAt: { type: String },
    },
    refreshToken: { type: String },
  },
  {
    timestamps: true,
    virtuals: {
      fullName: {
        get(): string {
          return this.firstName + ' ' + this.lastName;
        },
      },
    },
  },
);

export const UserModel = mongoose.model<IParent>('Parent', ParentSchema);
