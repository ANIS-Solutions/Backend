import mongoose, { Document, Schema } from 'mongoose';

export interface IAppCategory {
  name: string;
  id: string | null;
}

export interface IAppPackage extends Document<string> {
  id: string;
  title: string;
  categories: IAppCategory[];
  url: string | null;
  iconUrl: string | null;
  genreId: string | null;
  score: number;
  description: string | null;
  screenshots: string[];
  videoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const AppCategorySchema = new Schema<IAppCategory>(
  {
    name: { type: String, required: true },
    id: { type: String, default: null },
  },
  { _id: false },
);

const AppPackageSchema = new Schema<IAppPackage>(
  {
    _id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    categories: { type: [AppCategorySchema], default: [] },
    url: { type: String, default: null },
    iconUrl: { type: String, default: null },
    genreId: { type: String, default: null },
    score: { type: Number, default: 0 },
    description: { type: String, default: null },
    screenshots: { type: [String], default: [] },
    videoUrl: { type: String, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

export const AppPackageModel = mongoose.model<IAppPackage>(
  'AppPackage',
  AppPackageSchema,
);
