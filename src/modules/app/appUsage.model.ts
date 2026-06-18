import mongoose, { Document } from 'mongoose';

export interface IAppUsageDocument extends Document {
  childId: mongoose.Types.ObjectId;
  date: Date;
  totalScreenTimeMinutes: number;
  apps: {
    packageName: string;
    totalAppTimeMinutes: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const AppUsageSchema = new mongoose.Schema<IAppUsageDocument>(
  {
    childId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Child',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
    },
    totalScreenTimeMinutes: {
      type: Number,
      required: true,
      default: 0,
    },
    apps: [
      {
        _id: false,
        packageName: { type: String, required: true },
        totalAppTimeMinutes: { type: Number, required: true, default: 0 },
      },
    ],
  },
  { timestamps: true },
);

AppUsageSchema.index({ childId: 1, date: 1 }, { unique: true });

export const AppUsageModel = mongoose.model<IAppUsageDocument>(
  'AppUsage',
  AppUsageSchema,
);
