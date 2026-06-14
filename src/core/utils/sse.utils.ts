import { HttpStatusCode } from '@anis/shared';
import { Response } from 'express';

export const SseUtils = {
  init(res: Response): void {
    res.writeHead(HttpStatusCode.OK, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    res.write('retry: 10000\n\n');
  },
  send<T>(res: Response, data: T): void {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  },
};
