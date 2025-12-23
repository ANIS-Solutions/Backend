import mongoose, { Document, Schema } from 'mongoose';

export interface IReport extends Document {
  child: mongoose.Types.ObjectId;
  parent: mongoose.Types.ObjectId;
  content: string;
  releasedDate: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    child: {
      type: Schema.Types.ObjectId,
      ref: 'Child',
      required: true,
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Parent',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    releasedDate: {
      type: Date,
      default: Date.now(),
      required: true,
    },
  },
  { timestamps: true },
);
export const ReportModel = mongoose.model<IReport>('Report', ReportSchema);
