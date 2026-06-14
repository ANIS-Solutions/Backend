import { IChildSessionBase, SessionStatus } from '@anis/shared';
import mongoose, { Document, Model, Schema } from 'mongoose';

const STATUS_VALUES: SessionStatus[] = ['active', 'draft', 'deleted'];

const DRAFT_AFTER_DAYS = 5;

const DELETE_AFTER_DAYS = 30;

export interface IChildSessionDocument
  extends Omit<IChildSessionBase, 'childId'>, Document {
  childId: mongoose.Types.ObjectId;
}

const ImageHighlightSchema = new Schema(
  {
    resultId: { type: Number, required: true },
    sessionId: { type: Number, required: true },
    timestamp: { type: Date, required: true },
    embedding: { type: [Number], default: null },
    imageKey: { type: String, default: null },
    imagePath: { type: String, default: null },
  },
  { _id: false },
);

const ChildSessionSchema = new Schema<IChildSessionDocument>(
  {
    childId: {
      type: Schema.Types.ObjectId,
      ref: 'Child',
      required: true,
      index: true,
    },
    reportDate: {
      type: Date,
      required: true,
    },
    totalSessions: {
      type: Number,
      required: true,
    },
    sessionEmbeddings: {
      type: [[Number]],
      default: [],
    },
    imageHighlights: {
      type: [ImageHighlightSchema],
      default: [],
    },
    status: {
      type: String,
      enum: STATUS_VALUES,
      default: 'active',
      index: true,
    },
    draftAt: {
      type: Date,
      default: null,
    },
    fastApiJobId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: { virtuals: true },
  },
);

ChildSessionSchema.index({ childId: 1, reportDate: 1 }, { unique: true });

ChildSessionSchema.index({ childId: 1, status: 1, createdAt: -1 });

ChildSessionSchema.index(
  { draftAt: 1 },
  { expireAfterSeconds: DELETE_AFTER_DAYS * 24 * 60 * 60, sparse: true },
);

export const childSessionModel = mongoose.model<IChildSessionDocument>(
  'ChildSession',
  ChildSessionSchema,
);
