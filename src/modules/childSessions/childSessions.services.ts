import path from 'path';

import { enqueueChildSessionUpload } from '@/core/queues/childSessions.queue';
import logger from '@/core/utils/logger';
import { deleteLocalFiles } from '@/core/workers/childSessions.worker';
import mongoose from 'mongoose';

import { childSessionModel } from './childSessions.model.js';
import { UploadChildSessionsInput } from './childSessions.schema.js';

export const uploadChildSessionsService = async (
  childId: string,
  reqBody: UploadChildSessionsInput,
  files: Express.Multer.File[],
): Promise<{ docId: string }> => {
  const highlights = reqBody['image-highlights'];
  const sessionEmbeds = reqBody['list-of-embedding'];
  const reportDate = new Date();
  reportDate.setUTCHours(0, 0, 0, 0);

  const fileMap = new Map<string, Express.Multer.File>();
  for (const file of files) {
    // const match = file.originalname.match(/^image_(\d+)_(\d+)\.\w+$/);
    const match = /^image_(\d+)_(\d+)\.\w+$/.exec(file.originalname);
    if (match) fileMap.set(`${match[1]}_${match[2]}`, file);
  }

  const date = reportDate.toISOString().split('T')[0];

  const imageHighlights = highlights.map((h) => {
    const fileKey = `${h.resultId}_${h.sessionId}`;
    const file = fileMap.get(fileKey);
    const imageKey = file
      ? `uploads/highlights/${childId}/${date}/${fileKey}${path.extname(file.originalname)}`
      : null;
    return {
      resultId: h.resultId,
      sessionId: h.sessionId,
      timestamp: new Date(h.timestamp),
      embedding: h.embedding,
      imageKey,
      imagePath: null, // set by worker after file is moved
    };
  });

  const doc = await childSessionModel.findOneAndUpdate(
    { childId: new mongoose.Types.ObjectId(childId), reportDate },
    {
      $set: {
        totalSessions: reqBody.totalSessions,
        sessionEmbeddings: sessionEmbeds,
        imageHighlights,
        status: 'active',
      },
    },
    { upsert: true, new: true },
  );

  const docId = String(doc._id);

  const filesToUpload = highlights
    .map((h) => {
      const fileKey = `${h.resultId}_${h.sessionId}`;
      const file = fileMap.get(fileKey);
      if (!file) return null;
      return {
        resultId: h.resultId,
        sessionId: h.sessionId,
        tempPath: file.path,
        imageKey: `uploads/highlights/${childId}/${date}/${fileKey}${path.extname(file.originalname)}`,
        mimetype: file.mimetype,
      };
    })
    .filter((f): f is NonNullable<typeof f> => f !== null);

  if (filesToUpload.length) {
    await enqueueChildSessionUpload({
      docId,
      childId,
      files: filesToUpload,
    });
  }

  logger.info(`Session highlights stored for child ${childId}, doc ${docId}`);
  return { docId };
};

export const draftExpiredHighlightsService = async (): Promise<void> => {
  const DRAFT_AFTER_DAYS = 5;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DRAFT_AFTER_DAYS);

  const docs = await childSessionModel
    .find({
      status: 'active',
      createdAt: { $lte: cutoff },
    })
    .select('_id imageHighlights')
    .lean();

  if (!docs.length) {
    logger.info('[Cron] No docs ready for drafting');
    return;
  }

  const allPaths = docs.flatMap((d) =>
    d.imageHighlights
      .map((h) => h.imagePath)
      .filter((p): p is string => p !== null),
  );
  if (allPaths.length) await deleteLocalFiles(allPaths);

  await childSessionModel.updateMany(
    { _id: { $in: docs.map((d) => d._id) } },
    {
      $set: {
        status: 'draft',
        draftAt: new Date(),
        sessionEmbeddings: [],
        'imageHighlights.$[].embedding': null,
        'imageHighlights.$[].imageKey': null,
        'imageHighlights.$[].imagePath': null,
      },
    },
  );

  logger.info(
    `[Cron] Drafted ${docs.length} docs, deleted ${allPaths.length} local files`,
  );
};

// export const dispatchToFastApiService = async (): Promise<void> => {
//   const { fastapiDispatchQueue } =
//     await import('@/queues/session-highlights.queue.js');

//   const docs = await SessionHighlightModel.find({
//     status: 'active',
//     fastApiJobId: null, // not yet dispatched
//   })
//     .select('_id')
//     .lean();

//   if (!docs.length) {
//     logger.info('[Cron] No docs pending FastAPI dispatch');
//     return;
//   }

//   const docIds = docs.map((d) => String(d._id));

//   await fastapiDispatchQueue.add('dispatch-batch', { docIds });

//   logger.info(`[Cron] Queued FastAPI dispatch for ${docIds.length} docs`);
// };
