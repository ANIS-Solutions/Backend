import { INotificationBase } from '@anis/shared';
import { Types } from 'mongoose';

import { INotification } from './notifications.model.js';

type LeanNotification = Omit<INotification, 'id'> &
  Required<{ _id: Types.ObjectId }> & { __v: number };

export const toNotificationInfo = (
  notific: INotification | LeanNotification,
): INotificationBase => {
  const safeId =
    (notific as INotification).id ||
    (notific as LeanNotification)._id.toString();
  const safeRecipientId =
    (notific as INotification).recipientId.toString() ||
    (notific as LeanNotification).recipientId.toString();

  return {
    id: safeId,
    recipientId: safeRecipientId,
    type: notific.type,
    title: notific.title,
    body: notific.body,
    data: notific.data,
    isRead: notific.isRead,
    readAt: notific.readAt,
  };
};
