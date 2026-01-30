import mongoose, { Document, Schema } from 'mongoose';

export interface IAppPolicy extends Document {
  child: mongoose.Types.ObjectId;
  parent: mongoose.Types.ObjectId;
  app: mongoose.Types.ObjectId;
  isBlocked: boolean;
  dailyLimitMinutes?: number;
  allowedFrom?: string;
  allowedTo?: string;
  unlimitedLearning: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const appPolicySchema = new Schema<IAppPolicy>(
  {
    child: {
      type: Schema.Types.ObjectId,
      ref: 'Child',
      required: true,
      index: true,
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Parent',
      required: true,
    },
    app: {
      type: Schema.Types.ObjectId,
      ref: 'App',
      required: true,
      index: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    dailyLimitMinutes: { type: Number },
    allowedFrom: { type: String },
    allowedTo: { type: String },
    unlimitedLearning: {
      type: Boolean,
      default: false,
    },
    createdAt: Date,
    updatedAt: Date,
  },
  { timestamps: true },
);

export const AppPolicy = mongoose.model<IAppPolicy>(
  'AppPolicy',
  appPolicySchema,
);
