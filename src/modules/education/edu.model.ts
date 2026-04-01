import mongoose, { Document, Schema } from 'mongoose';

import { DayEnum, EduTypeEnum, IEdu } from './edu.schema.js';

export interface EduDocument extends IEdu, Document {}

const eduSchema = new Schema<IEdu>(
  {
    name: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    schedule: [
      {
        title: { type: String, required: true },
        type: { type: String, enum: EduTypeEnum.options, default: 'SCHOOL' },
        day: { type: String, enum: DayEnum.options, required: true },
        startTime: String,
        endTime: String,
      },
    ],
    location: String,
    description: String,
    isActive: { type: Boolean, default: true },
  },
  {
    toJSON: {
      virtuals: true,
    },
  },
);

export const eduModel = mongoose.model<IEdu>('Edu', eduSchema);
