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
}

const eduSchema = new Schema<IEdu>({
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
});

export const eduModel = mongoose.model<IEdu>('Edu', eduSchema);
