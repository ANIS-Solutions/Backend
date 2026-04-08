import { EventEmitter } from 'events';

import { emailReasons } from '@anis/shared';

class AppEventBus extends EventEmitter {}
export const eventBus = new AppEventBus();

export const AppEvents = {
  SEND_EMAIL: 'SEND_EMAIL',
} as const;

export type EmailEventPayload =
  | {
      type: typeof emailReasons.VERIFY_OTP;
      to: string;
      data: {
        name: string;
        otp: string;
        expiry_minutes: string;
        expiry_time: string;
      };
    }
  | {
      type: typeof emailReasons.RESET_PASSWORD;
      to: string;
      data: { name: string; reset_url: string; expiry_minutes: string };
    }
  | {
      type: typeof emailReasons.REACTIVATE;
      to: string;
      data: { name: string; url: string; expiry_minutes: string };
    }
  | {
      type: typeof emailReasons.REGISTER;
      to: string;
      data: { name: string; otp: string; expiry_minutes: string };
    };
