import AppError from '@core/utils/AppError';
import mongoose, { Document, Schema } from 'mongoose';

export enum QuestStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  ARCHIVED = 'archived',
}

export interface IQuest extends Document {
  parent: mongoose.Types.ObjectId;
  child: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  status: QuestStatus;
  target: {
    type: string;
    value: string;
  };

  reward: {
    type: 'points' | 'gift';
    value: string;
    points?: number | undefined;
  };
  schedule: {
    startAt: Date;
    endAt: Date;
  };
  completedAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QuestSchema = new Schema<IQuest>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxLength: 120,
    },
    description: {
      type: String,
      maxLength: 500,
    },
    status: {
      type: String,
      enum: Object.values(QuestStatus),
      default: QuestStatus.PENDING,
      index: true,
    },
    target: {
      kind: {
        type: String,
        required: true,
      },
      value: {
        type: String,
        required: true,
      },
    },
    reward: {
      type: {
        type: String,
        enum: ['points', 'gift'],
        required: true,
      },
      value: {
        type: String,
        required: true,
      },
      points: {
        type: Number,
        min: 1,
        required: function (): boolean {
          // required only if reward.type === 'points'
          return this.reward.type === 'points';
        },
      },
    },

    schedule: {
      startAt: { type: Date, required: true },
      endAt: { type: Date, required: true },
    },

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

    //TODO : should be has default value
    createdAt: Date,
    cancelledAt: Date,
  },
  {
    timestamps: true,
  },
);
QuestSchema.index({ parent: 1, status: 1 });
QuestSchema.index({ child: 1, status: 1 });

QuestSchema.virtual('isExpired').get(function (this: IQuest) {
  return this.schedule.endAt < new Date();
});

QuestSchema.virtual('isActive').get(function (this: IQuest) {
  return [QuestStatus.PENDING, QuestStatus.IN_PROGRESS].includes(this.status);
});

QuestSchema.pre('save', function () {
  if (this.schedule.endAt <= this.schedule.startAt) {
    //REVIEW : should use our AppError through errorMiddleware
    throw new AppError('schedule.endAt must be after schedule.startAt', 400);
  }

  if (
    this.status !== QuestStatus.COMPLETED &&
    this.status !== QuestStatus.CANCELLED &&
    this.schedule.endAt < new Date()
  ) {
    this.status = QuestStatus.EXPIRED;
  }
});

export const QuestModel = mongoose.model<IQuest>('Quest', QuestSchema);
