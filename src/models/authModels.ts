import config from '@configs/base';
import bcrypt from 'bcryptjs';
import mongoose, { Document, Schema } from 'mongoose';

export interface IParent extends Document {
  firstName: string;
  lastName: string;
  password: string;
  email: string;
  phone: string;
  isVerified: boolean;
  birthDate: Date;
  otp?: {
    code: string;
    expiresAt: Date;
  };
  refreshToken?: string;
  createdAt: Date;
  updatedAt?: Date;
  fullName?: string;
}

const ParentSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true, // B-Tree index
    },
    password: {
      type: String,
      required: true,
      select: false,
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
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    updatedAt: {
      type: Date,
      default: Date.now(),
    },
    otp: {
      code: { type: String },
      expiresAt: { type: Date },
    },
    refreshToken: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (
        doc,
        ret,
      ):
        | Pick<
            IParent,
            | 'firstName'
            | 'lastName'
            | 'email'
            | 'phone'
            | 'isVerified'
            | 'birthDate'
            | 'createdAt'
            | 'updatedAt'
            | 'password'
          >
        | undefined {
        const {
          firstName,
          lastName,
          email,
          phone,
          isVerified,
          birthDate,
          createdAt,
          updatedAt,
          password,
        } = ret;
        return {
          firstName,
          lastName,
          email,
          phone,
          isVerified,
          birthDate,
          createdAt,
          password,
          updatedAt,
        };
      },
    },
    toObject: { virtuals: true },
  },
);

ParentSchema.virtual('fullName').get(function (this: IParent) {
  return `${this.firstName} ${this.lastName}`;
});

ParentSchema.pre('save', async function () {
  const user = this as unknown as IParent;
  if (!user.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(config.BYCRPT_SALT_ROUNDS);
  user.password = await bcrypt.hash(user.password, salt);
});

export const ParentModel = mongoose.model<IParent>('Parent', ParentSchema);
