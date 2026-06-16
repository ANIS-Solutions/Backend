import type { IChildReportBase, ReportGenerationStatus } from '@anis/shared';
import mongoose, { Schema, type Document, type Model } from 'mongoose';

const GENERATION_STATUS_VALUES: ReportGenerationStatus[] = [
  'pending',
  'processing',
  'completed',
  'failed',
];

export interface IChildReportDocument
  extends
    Omit<IChildReportBase, 'childId' | 'parentId' | 'sessionDocId'>,
    Document {
  childId: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId;
  sessionDocId: mongoose.Types.ObjectId;
}

const ActivityEntrySchema = new Schema(
  {
    tag: { type: String, required: true },
    percentage: { type: Number, required: true },
  },
  { _id: false },
);

const ChildReportSchema = new Schema<IChildReportDocument>(
  {
    childId: {
      type: Schema.Types.ObjectId,
      ref: 'Child',
      required: true,
      index: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Parent',
      required: true,
      index: true,
    },
    sessionDocId: {
      type: Schema.Types.ObjectId,
      ref: 'ChildSession',
      required: true,
    },
    reportDate: {
      type: Date,
      required: true,
    },
    totalSessions: {
      type: Number,
      required: true,
    },
    reportText: {
      type: String,
      default: null,
    },
    semanticSummary: {
      type: String,
      default: null,
    },
    activityDistribution: {
      type: [ActivityEntrySchema],
      default: [],
    },
    generationStatus: {
      type: String,
      enum: GENERATION_STATUS_VALUES,
      default: 'pending',
      index: true,
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

ChildReportSchema.index({ childId: 1, sessionDocId: 1 }, { unique: true });

ChildReportSchema.index({ childId: 1, createdAt: -1 });

ChildReportSchema.index({ parentId: 1, createdAt: -1 });

export const ChildReportModel = mongoose.model<IChildReportDocument>(
  'ChildReport',
  ChildReportSchema,
);
