import { IPromptBase, PromptAction, PromptsStrictness } from '@anis/shared';
import mongoose, { Document, Schema } from 'mongoose';

export interface IPrompt extends Omit<IPromptBase, 'id' | 'childId'>, Document {
  id: string;
  childId: mongoose.Types.ObjectId;
  embedding: IPromptEmbedding | null;
  embeddingStatus: 'pending' | 'processing' | 'done' | 'failed';
  embeddedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
export interface IPromptEmbedding {
  Baseline: number[];
  [threatLabel: string]: number[];
}

const PromptSchema = new Schema<IPrompt>(
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
    key: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
    LevelOfStrictness: {
      type: String,
      enum: PromptsStrictness,
      required: true,
    },
    threat: {
      type: Boolean,
      required: true,
    },
    action: {
      type: String,
      enum: PromptAction,
      required: true,
    },
    embedding: {
      type: Schema.Types.Mixed,
      default: null,
    },
    embeddingStatus: {
      type: String,
      enum: ['pending', 'processing', 'done', 'failed'],
      default: 'pending',
      index: true,
    },
    embeddedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

export const PromptModel = mongoose.model<IPrompt>('Prompt', PromptSchema);
