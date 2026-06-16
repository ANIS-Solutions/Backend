import fs from 'fs';
import path from 'path';

import mongoose from 'mongoose';

import dbConnect from './src/config/db';
// Load queue and worker to process inline
import { childReportQueue } from './src/core/queues/childReports.queue';
import { setupChildReportWorker } from './src/core/workers/childReports.worker';
import { ChildModel } from './src/modules/child/child.model';
import { ChildReportModel } from './src/modules/childReports/childReports.model';
import { requestReportGeneration } from './src/modules/childReports/childReports.services';
import { childSessionModel } from './src/modules/childSessions/childSessions.model';
import { ParentModel } from './src/modules/parent/parent.model';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTest() {
  console.log('Connecting to DB...');
  await dbConnect();

  console.log('Setting up test data...');
  const fakeImagePath = path.join(process.cwd(), 'test_image.png');
  if (!fs.existsSync(fakeImagePath)) {
    const base64Png =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    fs.writeFileSync(fakeImagePath, Buffer.from(base64Png, 'base64'));
  }

  // Clear previous test data
  await ParentModel.deleteOne({ email: 'test_report_e2e@example.com' });
  const parent = await ParentModel.create({
    firstName: 'Test',
    lastName: 'Parent',
    email: 'test_report_e2e@example.com',
    password: 'Password123!',
    phone: '+1234567890',
    birthDate: new Date(),
  });

  await ChildModel.deleteOne({ firstName: 'TestChildE2E' });
  const child = await ChildModel.create({
    parentId: parent._id,
    firstName: 'TestChildE2E',
    lastName: 'E2E',
    gender: 'MALE',
    hobbies: ['gaming'],
    dob: new Date(),
    deviceId: 'fake-device-id',
    deviceName: 'fake-device-name',
    fcmToken: 'fake-fcm-token',
  });

  const randomEmbedding = () =>
    Array.from({ length: 512 }, () => Math.random() * 2 - 1);

  const session = await childSessionModel.create({
    childId: child._id,
    reportDate: new Date(),
    totalSessions: 3,
    sessionEmbeddings: [randomEmbedding(), randomEmbedding()],
    status: 'active',
    imageHighlights: [
      {
        resultId: 1,
        sessionId: 1,
        timestamp: new Date(),
        embedding: randomEmbedding(),
        imageKey: 'test_image.png',
        imagePath: fakeImagePath,
      },
    ],
  });

  console.log(`Created Session: ${session._id}`);

  // Start worker inline for testing
  const worker = setupChildReportWorker();

  // Clean up any old reports for this session
  await ChildReportModel.deleteMany({ sessionDocId: session._id });

  try {
    console.log('Requesting report generation...');
    const reportId = await requestReportGeneration(
      String(child._id),
      String(parent._id),
      String(session._id),
    );
    console.log(`Report generation queued with ID: ${reportId}`);

    console.log('Waiting for worker to process...');
    let report;
    for (let i = 0; i < 30; i++) {
      // Wait up to 30 seconds
      await sleep(1000);
      report = await ChildReportModel.findById(reportId).lean();
      if (
        report &&
        (report.generationStatus === 'completed' ||
          report.generationStatus === 'failed')
      ) {
        break;
      }
    }

    console.log('\n--- Final Report Status ---');
    console.log('Status:', report?.generationStatus);
    console.log('Error Message:', report?.errorMessage);
    console.log('Report Text:', report?.reportText);
    console.log('Semantic Summary:', report?.semanticSummary);
    console.log(
      'Activity Distribution:',
      JSON.stringify(report?.activityDistribution, null, 2),
    );
  } catch (err) {
    console.error('Test Error:', err);
  } finally {
    await worker.close();
    await mongoose.disconnect();
    process.exit(0);
  }
}

runTest();
