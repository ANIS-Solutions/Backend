import { z } from 'zod';

const EMBEDDING_SIZE = 512;

// ─── Multipart form-data sends body fields as JSON strings ────────────────────
// These preprocess wrappers parse them before Zod validation kicks in.
const jsonPreprocess = <T>(schema: z.ZodType<T>) =>
  z.preprocess((val) => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val) as unknown;
      } catch {
        return val;
      }
    }
    return val;
  }, schema);

const ImageHighlightSchema = z.object({
  resultId: z.number().int().positive(),
  sessionId: z.number().int().positive(),
  timestamp: z.number().int().positive(),
  embedding: z
    .array(z.number())
    .length(
      EMBEDDING_SIZE,
      `Embedding must be exactly ${EMBEDDING_SIZE} floats`,
    ),
});

export const uploadChildSessionsSchema = z.object({
  body: z.object({
    totalSessions: jsonPreprocess(z.number().int().positive()),
    'image-highlights': jsonPreprocess(z.array(ImageHighlightSchema).min(1)),
    'list-of-embedding': jsonPreprocess(
      z.array(z.array(z.number()).length(EMBEDDING_SIZE)).min(1),
    ),
  }),
});

export type UploadChildSessionsInput = z.infer<
  typeof uploadChildSessionsSchema
>['body'];
