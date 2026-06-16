import fs from 'fs';
import path from 'path';

import config from './src/config/base';
import { embeddingService } from './src/core/handlers/embeddingService.handler';

async function test() {
  const fakeImagePath = path.join(process.cwd(), 'test_image.png');
  if (!fs.existsSync(fakeImagePath)) {
    const base64Png =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    fs.writeFileSync(fakeImagePath, Buffer.from(base64Png, 'base64'));
  }

  // Create random 512-dim embedding
  const randomEmbedding = () =>
    Array.from({ length: 512 }, () => Math.random() * 2 - 1);

  const payload = {
    childId: '507f1f77bcf86cd799439011',
    totalSessions: 5,
    sessionEmbeddings: [randomEmbedding(), randomEmbedding()],
    imageHighlights: [
      {
        resultId: 1,
        sessionId: 1,
        timestamp: Date.now(),
        embedding: randomEmbedding(),
      },
      {
        resultId: 2,
        sessionId: 2,
        timestamp: Date.now(),
        embedding: randomEmbedding(),
      },
    ],
    images: [
      { path: fakeImagePath, filename: 'image_1_1.png' },
      { path: fakeImagePath, filename: 'image_2_2.png' },
    ],
  };

  try {
    console.log('Sending fake payload to FastAPI...');
    const result = await embeddingService.generateReport(payload);
    console.log('FastAPI Result:\n', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('FastAPI Error:', err);
  } finally {
    process.exit(0);
  }
}

test();
