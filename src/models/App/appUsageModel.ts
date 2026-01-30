import mongoose, { Document, Schema } from 'mongoose';

export interface IAppUsage extends Document {
  child: mongoose.Types.ObjectId;
  parent: mongoose.Types.ObjectId;
  app: mongoose.Types.ObjectId;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

const appUsageSchema = new Schema<IAppUsage>({
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
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  durationMinutes: {
    type: Number,
    required: true,
  },
  createdAt: Date,
  updatedAt: Date,
});

export const AppUsage = mongoose.model<IAppUsage>('App Usage', appUsageSchema);
