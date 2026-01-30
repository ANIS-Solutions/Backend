import mongoose, { Document, Schema } from 'mongoose';

export interface IApp extends Document {
  child: mongoose.Types.ObjectId;
  parent: mongoose.Types.ObjectId;
  appName: string;
  category: 'game' | 'education' | 'social' | 'browser' | 'other';
  icon?: string;
  isSystemApp?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const appSchema = new Schema<IApp>(
  {
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
    appName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: 'other',
    },
    icon: {
      type: String,
    },
    isSystemApp: {
      type: Boolean,
      default: false,
    },
    createdAt: Date,
    updatedAt: Date,
  },
  { timestamps: true },
);
export const App = mongoose.model<IApp>('App', appSchema);
