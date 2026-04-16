import mongoose, { Document, Schema } from 'mongoose';

export interface IAppCategory {
  name: string;
  id?: string | null;
}

export interface IAppPackage extends Document<string> {
  // _id: string;
  id: string;
  title: string;
  categories: IAppCategory[];
  url: string;
  iconUrl: string;
  genreId: string;
  score: number;
  description: string;
  screenshots: string[];
  videoUrl?: string;
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
    categories: [AppCategorySchema],
    url: { type: String, required: true },
    iconUrl: { type: String, required: true },
    genreId: { type: String, required: true },
    score: { type: Number, default: 0 },
    description: { type: String, required: true },
    screenshots: [{ type: String }],
    videoUrl: { type: String },
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
