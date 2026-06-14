// notifications.model.ts

import { INotificationBase, NotificationType } from '@anis/shared';
import mongoose, { Document, Schema } from 'mongoose';

export interface INotification
  extends Omit<INotificationBase, 'id' | 'recipientId'>, Document {
  id: string;
  recipientId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const notificationsSchema = new Schema<INotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'Parent',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: { type: Schema.Types.Mixed, default: null },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
notificationsSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
export const notificationModel = mongoose.model<INotification>(
  'Notifications',
  notificationsSchema,
);
