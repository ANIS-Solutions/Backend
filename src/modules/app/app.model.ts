import mongoose from 'mongoose';

interface IApp {
  child: mongoose.Types.ObjectId;
  name: string;
  storeId: string;
  category: string[];
  iconUrl: string;
  about: string;
  settings: {
    isBlocked: boolean;
    dailyLimit: number;
  };
  stats: {
    firstInstallAt?: Date;
    lastOpenedAt?: Date;
    totalUsage: number;
    dailyUsage: Map<Date, number>; // {st, ed}
  };
  createdAt: Date;
  updatedAt: Date;
}

const AppSchema = new mongoose.Schema<IApp>(
  {
    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Child',
      required: true,
      index: true,
    },

    iconUrl: { type: String },
    category: { type: [String], default: [] },

    name: { type: String, required: true, trim: true },

    storeId: {
      type: String,
      required: true,
      index: true,
    },
    settings: {
      isBlocked: { type: Boolean, default: false },
      dailyLimit: { type: Number, default: 0 },
    },
    stats: {
      lastOpenedAt: Date,
      totalUsage: { type: Number, default: 0 },
      dailyUsage: {
        type: Map,
        of: Number,
        default: {},
      },
    },
    about: { type: String },
  },
  { timestamps: true },
);

AppSchema.index({ child: 1, storeId: 1 }, { unique: true });

export const AppModel = mongoose.model<IApp>('App', AppSchema);
