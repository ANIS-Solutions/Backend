import { IQuestBase, QuestProgress } from '@anis/shared';
import mongoose, { Document, Schema } from 'mongoose';

export interface IQuest extends Omit<IQuestBase, 'id' | 'childId'>, Document {
  id: string;
  childId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const QuestSchema = new Schema<IQuest>(
  {
    childId: {
      type: mongoose.Types.ObjectId,
      ref: 'Child',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
    type: {
      type: String,
      required: true,
    },
    points: {
      type: Number,
      required: false,
      default: 0,
    },
    deadline: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: QuestProgress,
      required: true,
    },
  },
  { timestamps: true },
);

export const QuestModel = mongoose.model<IQuest>('Quest', QuestSchema);
