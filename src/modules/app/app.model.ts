import { IAppBase } from '@anis/shared';
import mongoose, { Document } from 'mongoose';

export interface IApp
  extends Omit<IAppBase, 'id' | 'packageId' | 'childId'>, Document {
  id: string;
  childId: mongoose.Types.ObjectId;
  packageId: string;
  createdAt: Date;
  updatedAt: Date;
}

const AppSchema = new mongoose.Schema<IApp>(
  {
    childId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Child',
      required: true,
      index: true,
    },
    packageId: {
      type: String,
      ref: 'AppPackage',
      required: true,
      index: true,
    },
    settings: {
      isBlocked: { type: Boolean, default: false },
      dailyLimit: { type: Number, default: 0 },
    },
    stats: {
      firstInstallAt: { type: Date },
      lastOpenedAt: { type: Date },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret): void {
        ret.id = ret.packageId;
      },
    },
    toObject: { virtuals: true },
  },
);

AppSchema.index({ childId: 1, packageId: 1 }, { unique: true });
export const AppModel = mongoose.model<IApp>('App', AppSchema);
