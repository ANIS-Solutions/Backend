import AppError from '@/core/utils/AppError';
import { HttpStatusCode, IJwtPayload, ILocationBase } from '@anis/shared';
import mongoose from 'mongoose';

import { notificationModel } from './notifications.model.js';
import {
  DeleteNotificationParamsInput,
  GetAllNotificationParamsInput,
  MarkAsReadNotificationParamsInput,
} from './notifications.schema.js';

export const getAllNotificationService = async (
  userId: string,
  reqParams: GetAllNotificationParamsInput,
) => {
  const parentId = userId;
  const { page = 1, limit = 20 } = reqParams;
  const [notifications, totalCount] = await Promise.all([
    notificationModel
      .find({
        recipientId: new mongoose.Types.ObjectId(parentId),
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    notificationModel.countDocuments({
      recipientId: new mongoose.Types.ObjectId(parentId),
    }),
  ]);

  return {
    notifications,
    totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit),
    unreadCount: notifications.filter((n) => !n.isRead).length,
  };
};

export const deleteNotificationService = async (
  reqParams: DeleteNotificationParamsInput,
) => {
  const { notificationId } = reqParams;
  const deleted = await notificationModel
    .findByIdAndDelete(notificationId)
    .lean();
  if (!deleted) {
    throw new AppError('Notification not found.', HttpStatusCode.NOT_FOUND);
  }
  return { deleted: true, notificationId };
};

export const deleteAllNotificationService = async (parentId: string) => {
  const result = await notificationModel.deleteMany({
    recipientId: new mongoose.Types.ObjectId(parentId),
  });
  return { deleted: true, deletedCount: result.deletedCount };
};

export const markAsReadNotificationService = async (
  reqParams: MarkAsReadNotificationParamsInput,
): Promise<void> => {
  const { notificationId } = reqParams;
  await notificationModel.findByIdAndUpdate(notificationId, {
    isRead: true,
  });
};
