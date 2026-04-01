import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import mongoose from 'mongoose';
import request from 'supertest';

import app from '../src/app';
import { emailService } from '../src/core/handlers/email.handler';
import HttpStatusCode from '../src/core/utils/HttpStatusCode';
import { ParentModel } from '../src/modules/auth/auth.model';
import { server, startServer } from '../src/server';

jest.spyOn(emailService, 'send').mockResolvedValue(true);

beforeAll(async () => {
  await startServer();
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    if (collections[key]) {
      await collections[key].deleteMany({});
    }
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await server.close();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    if (collections[key]) {
      await collections[key].deleteMany({});
    }
  }
});

const registerPayload = {
  email: 'ext@example.com',
  password: 'StrongP@ssw0rd',
  confirmPassword: 'StrongP@ssw0rd',
  phone: '+201555555555',
  firstName: 'Extended',
  lastName: 'User',
  birthDate: '2000-01-01',
};

describe('Extended Auth Endpoints', () => {
  const createUser = async () => {
    return request(app).post(`/api/v1/parent/register`).send(registerPayload);
  };
  const getTokens = async () => {
    const res = await request(app).post('/api/v1/parent/login').send({
      email: registerPayload.email,
      password: registerPayload.password,
    });
    if (res.statusCode !== 200) console.log('EXT LOGIN ERROR:', res.body);
    return { token: res.body.accessToken, cookies: res.headers['set-cookie'] };
  };

  it('GET /api/v1/parent/me should return user profile', async () => {
    await createUser();
    const { token, cookies } = await getTokens();
    const res = await request(app)
      .get('/api/v1/parent/me')
      .set('Authorization', `Bearer ${token}`)
      .set('Cookie', cookies!);
    expect(res.statusCode).toBe(HttpStatusCode.OK);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(registerPayload.email);
  });

  it('PATCH /api/v1/parent/change-password should change password', async () => {
    await createUser();
    const { token, cookies } = await getTokens();
    const res = await request(app)
      .patch('/api/v1/parent/change-password')
      .set('Authorization', `Bearer ${token}`)
      .set('Cookie', cookies!)
      .send({
        oldPassword: registerPayload.password,
        password: 'NewStrongP@ssw0rd',
        confirmPassword: 'NewStrongP@ssw0rd',
      });
    expect(res.statusCode).toBe(HttpStatusCode.OK);
    expect(res.body.success).toBe(true);

    const loginRes = await request(app).post('/api/v1/parent/login').send({
      email: registerPayload.email,
      password: 'NewStrongP@ssw0rd',
    });
    expect(loginRes.statusCode).toBe(HttpStatusCode.OK);
  });

  it('PATCH /api/v1/parent/update-profile should update user details', async () => {
    await createUser();
    const { token, cookies } = await getTokens();
    const res = await request(app)
      .patch('/api/v1/parent/update-profile')
      .set('Authorization', `Bearer ${token}`)
      .set('Cookie', cookies!)
      .send({
        firstName: 'UpdatedName',
        lastName: 'LastNameToo',
      });
    if (res.statusCode !== 200) console.log('UPDATE PROFILE ERROR:', res.body);
    expect(res.statusCode).toBe(HttpStatusCode.OK);
    expect(res.body.data.updatedUser.firstName).toBe('UpdatedName');
  });

  it('POST /api/v1/parent/refresh-token should generate new token using refresh cookie', async () => {
    await createUser();
    const { cookies } = await getTokens();
    const res = await request(app)
      .post('/api/v1/parent/refresh-token')
      .set('Cookie', cookies!);
    expect(res.statusCode).toBe(HttpStatusCode.OK);
    expect(res.body.accessToken).toBeDefined();
  });

  it('GET /api/v1/parent/logout should clear cookie and logout user', async () => {
    await createUser();
    const { cookies, token } = await getTokens();
    const res = await request(app)
      .get('/api/v1/parent/logout')
      .set('Authorization', `Bearer ${token}`)
      .set('Cookie', cookies!);
    expect(res.statusCode).toBe(HttpStatusCode.OK);
    expect(res.body.message).toBe('Logged out successfully');
  });

  it('POST /api/v1/parent/forget-password should send token successfully', async () => {
    await createUser();
    const res = await request(app)
      .post('/api/v1/parent/forget-password')
      .send({ email: registerPayload.email });
    expect(res.statusCode).toBe(HttpStatusCode.OK);
    expect(res.body.message).toBe('Reset token sent to email successfully!');
  });
});
