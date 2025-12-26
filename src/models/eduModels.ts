import mongoose, { Schema } from 'mongoose';

export interface IEdu {
  name: string;
  startDate: Date;
  endDate: Date;
  schedule: {
    title: string;
    type: 'SCHOOL' | 'COURSE' | 'PRIVATE_LESSON';
    day:
      | 'Sunday'
      | 'Monday'
      | 'Tuesday'
      | 'Wednesday'
      | 'Thursday'
      | 'Friday'
      | 'Saturday';
    startTime: string;
    endTime: string;
  }[];
  location?: string | undefined;
  description?: string | undefined;
  isActive: boolean;
}

const eduSchema = new Schema<IEdu>(
  {
    name: { type: String, required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    schedule: {
      type: [
        {
          title: { type: String },
          type: { type: ['SCHOOL', 'COURSE', 'PRIVATE_LESSON'] },
          day: {
            type: [
              'Sunday',
              'Monday',
              'Tuesday',
              'Wednesday',
              'Thursday',
              'Friday',
              'Saturday',
            ],
            required: false,
          },
          startTime: { type: String },
          endTime: { type: String },
        },
      ],
    },
    location: { type: String, required: false },
    description: { type: String, required: false },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    toJSON: {
      /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
      transform: function (doc, ret: any): object {
        delete ret.__v;
        delete ret._id;
        return ret as object;
      },
    },
  },
);

export const eduModel = mongoose.model<IEdu>('Edu', eduSchema);
