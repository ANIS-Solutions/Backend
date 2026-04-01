import { toJSON } from '@/core/plugins/toJSON.plugin';
import mongoose, { Document, Schema } from 'mongoose';

import { IChild } from './child.schema.js';

export interface IChildren extends IChild, Document {
  parent: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt?: Date;
}

const ChildSchema = new Schema<IChildren>(
  {
    firstName: {
      type: String,
      required: true,
    },
    gender: {
      type: Boolean,
      required: true,
    },
    hobbies: {
      type: [String],
      default: [],
    },
    dob: {
      type: Date,
      required: true,
    },
    parent: {
      type: mongoose.Types.ObjectId,
      ref: 'Parent',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    updatedAt: {
      type: Date,
      default: Date.now(),
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
export const ChildModel = mongoose.model<IChildren>('Child', ChildSchema);
