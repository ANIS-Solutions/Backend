import { AppEvents, EmailEventPayload, eventBus } from '@/core/events/eventBus';
import { emailQueue } from '@/core/queues/email.queue';
import logger from '@/core/utils/logger';

const handleEmailQueueing = async (
  payload: EmailEventPayload,
): Promise<void> => {
  try {
    await emailQueue.add(payload.type, payload);

    logger.info(
      `[Event] Added ${payload.type} Email to Queue for ${payload.to}`,
    );
  } catch (error) {
    logger.error(`[Event Error] Failed to add email to queue:`, error);
  }
};

eventBus.on(AppEvents.SEND_EMAIL, (payload: EmailEventPayload) => {
  void handleEmailQueueing(payload);
});
