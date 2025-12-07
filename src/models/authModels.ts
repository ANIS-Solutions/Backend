import crypto from 'crypto';

import config from '@configs/base';
import bcrypt from 'bcryptjs';
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IParent extends Document {
  firstName: string;
  lastName: string;
  password: string;
  email: string;
  phone: string;
  isVerified: boolean;
  birthDate: Date;
  otp:
    | {
        code: string;
        reason: string;
        expiresAt: Date;
        reqCount: number;
        lastRequest: Date;
      }
    | undefined;
  refreshToken?: string;
  createdAt: Date;
  updatedAt?: Date;
  fullName?: string;
  passwordChangedAt: Date;
  passwordResetToken: string | undefined;
  passwordResetTokenExpire: Date | undefined;
  isActive: boolean;
}
interface IParentMethods {
  correctPassword(
    candidatePassword: string,
    userPassword: string,
  ): Promise<boolean>;
  changePasswordAfter(JWTTimestamp: number): boolean;
  createPasswordResetToken(): string;
  generateOTP(reason: string): Promise<string>;
  verifyOTP(candidateOTP: string, hashOtp: string): Promise<boolean>;
}
type ParentModelType = Model<IParent, object, IParentMethods>;
const ParentSchema = new Schema<IParent, ParentModelType, IParentMethods>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true, // B-Tree index
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
      reason: { type: String },
      expiresAt: { type: Date },
      reqCount: { type: Number },
      lastRequest: { type: Date },
    },
    refreshToken: { type: String },
    passwordChangedAt: { type: Date, default: Date.now() },
    passwordResetToken: {
      type: String,
    },
    passwordResetTokenExpire: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret): object {
        const {
          firstName,
          lastName,
          email,
          phone,
          isVerified,
          birthDate,
          createdAt,
          otp,
          updatedAt,
          password,
          passwordChangedAt,
          passwordResetToken,
          passwordResetTokenExpire,
          isActive,
          fullName,
        } = ret;
        return {
          firstName,
          lastName,
          email,
          phone,
          isVerified,
          birthDate,
          createdAt,
          otp,
          password,
          updatedAt,
          passwordChangedAt,
          passwordResetToken,
          passwordResetTokenExpire,
          isActive,
          fullName,
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
  const salt = await bcrypt.genSalt(config.BCRYPT_SALT_ROUNDS);
  user.password = await bcrypt.hash(user.password, salt);
});
ParentSchema.pre('save', async function (next) {
  const user = this as unknown as IParent;
  if (!user.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(config.BCRYPT_SALT_ROUNDS);
  user.password = await bcrypt.hash(user.password, salt);
});
// Source - https://stackoverflow.com/a/38946126

ParentSchema.methods.correctPassword = async function (
  candidatePassword: string,
  userPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, userPassword);
};
ParentSchema.methods.changePasswordAfter = function (
  JWTTimestamp: number,
): boolean {
  if (this.createdAt === this.passwordChangedAt) {
    return false;
  }
  // console.log(
  //   parseInt(`${this.passwordChangedAt.getTime() / 1000}`, 10),
  //   JWTTimestamp,
  // );
  // console.log((parseInt(`${Date.now() / 1000}`, 10) - JWTTimestamp) / 60);
  // console.log(JWTTimestamp);
  // console.log(JWTTimestamp - parseInt(`${Date.now().getTime() / 1000}`, 10));
  return (
    parseInt(`${this.passwordChangedAt.getTime() / 1000}`, 10) < JWTTimestamp
  );
};
ParentSchema.methods.createPasswordResetToken = function (): string {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  // console.log(this.passwordResetToken);
  this.passwordResetTokenExpire = new Date(
    Date.now() + config.PASSWORD_RESET_TOKEN_EXPIRES * 60 * 1000,
  );
  return resetToken;
};
ParentSchema.methods.verifyOTP = async function (
  candidateOTP: string,
  hashOtp: string,
): Promise<boolean> {
  return await bcrypt.compare(candidateOTP, hashOtp);
};
ParentSchema.methods.generateOTP = async function (
  reason: string,
): Promise<string> {
  const otp = crypto.randomInt(100_000, 999_999).toString();
  const hashOtp = await bcrypt.hash(otp, config.BCRYPT_SALT_ROUNDS);
  this.otp = {
    code: hashOtp,
    expiresAt: new Date(Date.now() + config.OTP_EXPIRES_IN * 60_000),
    lastRequest: new Date(Date.now()),
    reason,
    reqCount: this.otp?.reqCount ? this.otp?.reqCount + 1 : 1,
  };
  return otp;
};
// export const ParentModel = mongoose.model<IParent>('Parent', ParentSchema);
export const ParentModel = mongoose.model<IParent, ParentModelType>(
  'Parent',
  ParentSchema,
);
