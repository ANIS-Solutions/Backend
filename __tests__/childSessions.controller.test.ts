import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { HttpStatusCode } from '@anis/shared';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';

import app from '../src/app';
import config from '../src/config/base';

// Derive test directory from ESM import.meta – use a unique name to avoid
// collisions with CJS globals that ts-jest may inject.
const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));

// ─── Constants ────────────────────────────────────────────────────────────────

const API_URL = '/api/v1/child-session';
const EMBEDDING_SIZE = 512;
const FIXTURES_DIR = path.resolve(TEST_DIR, '..', '__temp');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeEmbedding(): number[] {
  return Array.from(
    { length: EMBEDDING_SIZE },
    () => +(Math.random() * 0.1 - 0.05).toFixed(4),
  );
}

function signChildToken(childId: string): string {
  return jwt.sign(
    { id: childId, role: 'CHILD', isActive: true, deviceId: 'test-device-001' },
    config.JWT_SECRET,
    { expiresIn: '1h' },
  );
}

// ─── Fixture data ─────────────────────────────────────────────────────────────

let parentId: mongoose.Types.ObjectId;
let childId: mongoose.Types.ObjectId;
let token: string;

const MONGO_URI = `${config.DATABASE}/${process.env.DATABASE_NAME || 'integration_test_anis'}`;

const createTestParentAndChild = async () => {
  parentId = new mongoose.Types.ObjectId();
  childId = new mongoose.Types.ObjectId();

  await mongoose.connection.db!.collection('parents').insertOne({
    _id: parentId,
    firstName: 'TestParent',
    lastName: 'E2E',
    email: `test-e2e-${Date.now()}@anis.test`,
    password: '$2b$10$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    phone: '+201000000000',
    birthDate: new Date('1990-01-01'),
    isActive: true,
    refreshToken: 'dummy-refresh-token',
    devices: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await mongoose.connection.db!.collection('children').insertOne({
    _id: childId,
    parentId,
    firstName: 'TestChild',
    gender: 'MALE',
    hobbies: [],
    dob: new Date('2018-01-01'),
    isActive: true,
    deviceId: 'test-device-001',
    deviceName: 'TestDevice',
    points: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  token = signChildToken(childId.toString());
};

// ─── Lifecycle ────────────────────────────────────────────────────────────────

beforeAll(async () => {
  await mongoose.connect(MONGO_URI);

  // Ensure temp upload dir exists for multer disk storage
  const tempDir = path.resolve('uploads', 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
}, 15000);

afterAll(async () => {
  // Clean test data
  const db = mongoose.connection.db;
  if (db) {
    await db.collection('parents').deleteMany({});
    await db.collection('children').deleteMany({});
    await db.collection('childsessions').deleteMany({});
  }
  await mongoose.disconnect();
});

beforeEach(async () => {
  const db = mongoose.connection.db!;
  await db.collection('parents').deleteMany({});
  await db.collection('children').deleteMany({});
  await db.collection('childsessions').deleteMany({});
  await createTestParentAndChild();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/v1/child-session', () => {
  // ── Happy path ────────────────────────────────────────────────────────────

  it('should return 201 with docId on successful multipart upload', async () => {
    const res = await request(app)
      .post(API_URL)
      .set('Authorization', `Bearer ${token}`)
      .field('totalSessions', '4')
      .field(
        'image-highlights',
        JSON.stringify([
          {
            resultId: 142,
            sessionId: 31,
            timestamp: Date.now(),
            embedding: makeEmbedding(),
          },
          {
            resultId: 187,
            sessionId: 32,
            timestamp: Date.now(),
            embedding: makeEmbedding(),
          },
          {
            resultId: 203,
            sessionId: 33,
            timestamp: Date.now(),
            embedding: makeEmbedding(),
          },
        ]),
      )
      .field(
        'list-of-embedding',
        JSON.stringify([
          makeEmbedding(),
          makeEmbedding(),
          makeEmbedding(),
          makeEmbedding(),
        ]),
      )
      .attach('images', path.join(FIXTURES_DIR, 'image_142_31.png'))
      .attach('images', path.join(FIXTURES_DIR, 'image_187_32.png'))
      .attach('images', path.join(FIXTURES_DIR, 'image_203_33.png'));

    if (res.statusCode !== HttpStatusCode.CREATED) {
      console.log('UPLOAD ERROR:', JSON.stringify(res.body, null, 2));
    }
    expect(res.statusCode).toBe(HttpStatusCode.CREATED);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Session highlights uploaded successfully!');
    expect(res.body.data.docId).toBeDefined();

    // Verify MongoDB document
    const doc = await mongoose.connection
      .db!.collection('childsessions')
      .findOne({ childId });

    expect(doc).not.toBeNull();
    expect(doc!.totalSessions).toBe(4);
    expect(doc!.imageHighlights).toHaveLength(3);
    expect(doc!.sessionEmbeddings).toHaveLength(4);
    expect(doc!.status).toBe('active');

    for (const h of doc!.imageHighlights) {
      expect(h.imageKey).toMatch(/^uploads\/highlights\//);
      expect(h.embedding).toHaveLength(EMBEDDING_SIZE);
    }
  });

  it('should return 201 when uploading without images (embeddings only)', async () => {
    const res = await request(app)
      .post(API_URL)
      .set('Authorization', `Bearer ${token}`)
      .field('totalSessions', '2')
      .field(
        'image-highlights',
        JSON.stringify([
          {
            resultId: 1,
            sessionId: 1,
            timestamp: Date.now(),
            embedding: makeEmbedding(),
          },
        ]),
      )
      .field(
        'list-of-embedding',
        JSON.stringify([makeEmbedding(), makeEmbedding()]),
      );

    expect(res.statusCode).toBe(HttpStatusCode.CREATED);
    expect(res.body.data.docId).toBeDefined();

    const doc = await mongoose.connection
      .db!.collection('childsessions')
      .findOne({ childId });

    expect(doc!.imageHighlights[0].imageKey).toBeNull();
  });

  it('should upsert (overwrite) when same child sends again on the same day', async () => {
    // First upload
    await request(app)
      .post(API_URL)
      .set('Authorization', `Bearer ${token}`)
      .field('totalSessions', '2')
      .field(
        'image-highlights',
        JSON.stringify([
          {
            resultId: 1,
            sessionId: 1,
            timestamp: Date.now(),
            embedding: makeEmbedding(),
          },
        ]),
      )
      .field('list-of-embedding', JSON.stringify([makeEmbedding()]));

    // Second upload — same child, same day
    const res = await request(app)
      .post(API_URL)
      .set('Authorization', `Bearer ${token}`)
      .field('totalSessions', '5')
      .field(
        'image-highlights',
        JSON.stringify([
          {
            resultId: 10,
            sessionId: 10,
            timestamp: Date.now(),
            embedding: makeEmbedding(),
          },
          {
            resultId: 11,
            sessionId: 11,
            timestamp: Date.now(),
            embedding: makeEmbedding(),
          },
        ]),
      )
      .field(
        'list-of-embedding',
        JSON.stringify([makeEmbedding(), makeEmbedding()]),
      );

    expect(res.statusCode).toBe(HttpStatusCode.CREATED);

    const count = await mongoose.connection
      .db!.collection('childsessions')
      .countDocuments({ childId });
    expect(count).toBe(1);

    const doc = await mongoose.connection
      .db!.collection('childsessions')
      .findOne({ childId });
    expect(doc!.totalSessions).toBe(5);
    expect(doc!.imageHighlights).toHaveLength(2);
  });

  // ── Auth errors ───────────────────────────────────────────────────────────

  it('should return 401 when no token is provided', async () => {
    const res = await request(app)
      .post(API_URL)
      .field('totalSessions', '1')
      .field(
        'image-highlights',
        JSON.stringify([
          {
            resultId: 1,
            sessionId: 1,
            timestamp: Date.now(),
            embedding: makeEmbedding(),
          },
        ]),
      )
      .field('list-of-embedding', JSON.stringify([makeEmbedding()]));

    expect(res.statusCode).toBe(HttpStatusCode.UNAUTHORIZED);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 when token is invalid', async () => {
    const res = await request(app)
      .post(API_URL)
      .set('Authorization', 'Bearer invalid.jwt.token')
      .field('totalSessions', '1')
      .field(
        'image-highlights',
        JSON.stringify([
          {
            resultId: 1,
            sessionId: 1,
            timestamp: Date.now(),
            embedding: makeEmbedding(),
          },
        ]),
      )
      .field('list-of-embedding', JSON.stringify([makeEmbedding()]));

    expect(res.statusCode).toBe(HttpStatusCode.UNAUTHORIZED);
  });

  // ── Validation errors ─────────────────────────────────────────────────────

  it('should return 400 when totalSessions is missing', async () => {
    const res = await request(app)
      .post(API_URL)
      .set('Authorization', `Bearer ${token}`)
      .field(
        'image-highlights',
        JSON.stringify([
          {
            resultId: 1,
            sessionId: 1,
            timestamp: Date.now(),
            embedding: makeEmbedding(),
          },
        ]),
      )
      .field('list-of-embedding', JSON.stringify([makeEmbedding()]));

    expect(res.statusCode).toBe(HttpStatusCode.BAD_REQUEST);
  });

  it('should return 400 when image-highlights is missing', async () => {
    const res = await request(app)
      .post(API_URL)
      .set('Authorization', `Bearer ${token}`)
      .field('totalSessions', '2')
      .field('list-of-embedding', JSON.stringify([makeEmbedding()]));

    expect(res.statusCode).toBe(HttpStatusCode.BAD_REQUEST);
  });

  it('should return 400 when list-of-embedding is missing', async () => {
    const res = await request(app)
      .post(API_URL)
      .set('Authorization', `Bearer ${token}`)
      .field('totalSessions', '2')
      .field(
        'image-highlights',
        JSON.stringify([
          {
            resultId: 1,
            sessionId: 1,
            timestamp: Date.now(),
            embedding: makeEmbedding(),
          },
        ]),
      );

    expect(res.statusCode).toBe(HttpStatusCode.BAD_REQUEST);
  });

  it('should return 400 when embedding has wrong size', async () => {
    const badEmbedding = Array.from({ length: 100 }, () => 0.01);

    const res = await request(app)
      .post(API_URL)
      .set('Authorization', `Bearer ${token}`)
      .field('totalSessions', '1')
      .field(
        'image-highlights',
        JSON.stringify([
          {
            resultId: 1,
            sessionId: 1,
            timestamp: Date.now(),
            embedding: badEmbedding,
          },
        ]),
      )
      .field('list-of-embedding', JSON.stringify([makeEmbedding()]));

    expect(res.statusCode).toBe(HttpStatusCode.BAD_REQUEST);
  });

  it('should return 400 when image-highlights is empty array', async () => {
    const res = await request(app)
      .post(API_URL)
      .set('Authorization', `Bearer ${token}`)
      .field('totalSessions', '1')
      .field('image-highlights', JSON.stringify([]))
      .field('list-of-embedding', JSON.stringify([makeEmbedding()]));

    expect(res.statusCode).toBe(HttpStatusCode.BAD_REQUEST);
  });

  // ── File validation ───────────────────────────────────────────────────────

  it('should reject files with disallowed mimetype', async () => {
    const res = await request(app)
      .post(API_URL)
      .set('Authorization', `Bearer ${token}`)
      .field('totalSessions', '1')
      .field(
        'image-highlights',
        JSON.stringify([
          {
            resultId: 1,
            sessionId: 1,
            timestamp: Date.now(),
            embedding: makeEmbedding(),
          },
        ]),
      )
      .field('list-of-embedding', JSON.stringify([makeEmbedding()]))
      .attach('images', Buffer.from('not an image'), {
        filename: 'image_1_1.txt',
        contentType: 'text/plain',
      });

    expect(res.statusCode).toBe(HttpStatusCode.UNPROCESSABLE_ENTITY);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not allowed/i);
  });
});
