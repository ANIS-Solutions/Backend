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
    const collection = collections[key];
    if (collection) {
      await collection.deleteMany({});
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
    const collection = collections[key];
    if (collection) {
      await collection.deleteMany({});
    }
  }
});

describe('POST /api/v1/auth/register', () => {
  const reqPayload = {
    email: 'example@anis.comr',
    password: 'Very-Hard-P@ssw0rd',
    confirmPassword: 'Very-Hard-P@ssw0rd',
    phone: '+201234567891',
    firstName: 'Ziko',
    lastName: 'Mofied',
    birthDate: '11/05/2004',
  };
  it('should return 201 CREATED on successful registration', async () => {
    const res = await request(app)
      .post(`/api/v1/parent/register`)
      .send(reqPayload);
    //
    // const users = await ParentModel.find();
    // console.log('Users in DB:', users);
    // console.log(res.body);

    expect(res.statusCode).toBe(HttpStatusCode.CREATED);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('User Registered successful');
    expect(res.body.data.user).toMatchObject({
      email: reqPayload.email,
      phone: reqPayload.phone,
      firstName: reqPayload.firstName,
      lastName: reqPayload.lastName,
    });
    expect(res.body.accessToken).toBeDefined();
    const user = await ParentModel.findOne({ email: reqPayload.email });
    expect(user).not.toBeNull();
    expect(user!.password).not.toBe(reqPayload.password);
  });
  it('should return 409 CONFLICT when email already exists', async () => {
    await request(app).post(`/api/v1/parent/register`).send(reqPayload);

    const res = await request(app)
      .post(`/api/v1/parent/register`)
      .send({
        ...reqPayload,
        phone: '+201234567892', // physically different phone
      });

    expect(res.statusCode).toBe(HttpStatusCode.CONFLICT);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Email already exists.');
  });

  it('should return 409 CONFLICT when phone already exists', async () => {
    await request(app).post(`/api/v1/parent/register`).send(reqPayload);

    const res = await request(app)
      .post(`/api/v1/parent/register`)
      .send({
        ...reqPayload,
        email: 'another@example.com', // different email
      });

    expect(res.statusCode).toBe(HttpStatusCode.CONFLICT);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Phone number already exists.');
  });

  it('should return 400 BAD_REQUEST when account exists but is deactivated', async () => {
    const createRes = await request(app)
      .post(`/api/v1/parent/register`)
      .send(reqPayload);

    await ParentModel.findByIdAndUpdate(
      { _id: createRes.body.data.user.id },
      {
        isActive: false,
      },
    );

    const res = await request(app)
      .post(`/api/v1/parent/register`)
      .send({
        ...reqPayload,
        phone: '+201234567891',
      });

    expect(res.statusCode).toBe(HttpStatusCode.BAD_REQUEST);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('This account is deactivated.');
  });

  it('should return 400 for invalid email', async () => {
    const res = await request(app)
      .post(`/api/v1/parent/register`)
      .send({
        ...reqPayload,
        email: 'not-an-email',
      });

    expect(res.statusCode).toBe(HttpStatusCode.BAD_REQUEST);
    // console.log('res.body.message');
    // console.log(res.body);

    expect(JSON.stringify(res.body.errors)).toMatch(/email/i);
  });

  it('should return 400 for weak password', async () => {
    const testCases = [
      { password: 'short', missing: 'length' },
      { password: 'onlylowercase', missing: 'uppercase,number,symbol' },
      { password: 'OnlyUppercase', missing: 'lowercase,number,symbol' },
      { password: 'OnlyNumbers123', missing: 'lowercase,uppercase,symbol' },
      { password: 'Symbols@#$', missing: 'lowercase,uppercase,number' },
    ];

    for (const { password, missing } of testCases) {
      const res = await request(app)
        .post(`/api/v1/parent/register`)
        .send({
          ...reqPayload,
          password,
          confirmPassword: password,
        });

      expect(res.statusCode).toBe(HttpStatusCode.BAD_REQUEST);
      expect(JSON.stringify(res.body.errors)).toMatch(/password/i);
    }
  });
  it('should return 400 when passwords do not match', async () => {
    const res = await request(app)
      .post(`/api/v1/parent/register`)
      .send({
        ...reqPayload,
        confirmPassword: 'DifferentP@ssw0rd',
      });

    expect(res.statusCode).toBe(HttpStatusCode.BAD_REQUEST);
    // console.log(res.body);
    expect(JSON.stringify(res.body.errors)).toMatch(/did not match/i);

    // expect(res.body.message).toMatch(/did not match/i);
  });

  it('should return 400 for invalid phone', async () => {
    const res = await request(app)
      .post(`/api/v1/parent/register`)
      .send({
        ...reqPayload,
        phone: '12345',
      });

    expect(res.statusCode).toBe(HttpStatusCode.BAD_REQUEST);
    // expect(res.body.message).toMatch(/phone/i);
    expect(JSON.stringify(res.body.errors)).toMatch(/phone/i);
  });

  it('should validate first name', async () => {
    let res = await request(app)
      .post(`/api/v1/parent/register`)
      .send({
        ...reqPayload,
        firstName: 'A',
      });
    expect(res.statusCode).toBe(HttpStatusCode.BAD_REQUEST);
    // expect(res.body.message).toMatch(/first name/i);
    expect(JSON.stringify(res.body.errors)).toMatch(/first name/i);

    res = await request(app)
      .post(`/api/v1/parent/register`)
      .send({
        ...reqPayload,
        firstName: 'ThisNameIsWayTooLong',
      });
    expect(res.statusCode).toBe(HttpStatusCode.BAD_REQUEST);

    res = await request(app)
      .post(`/api/v1/parent/register`)
      .send({
        ...reqPayload,
        firstName: 'ahmed123',
      });
    expect(res.statusCode).toBe(HttpStatusCode.BAD_REQUEST);
  });
  it('should validate last name', async () => {
    let res = await request(app)
      .post(`/api/v1/parent/register`)
      .send({
        ...reqPayload,
        lastName: 'B',
      });
    expect(res.statusCode).toBe(HttpStatusCode.BAD_REQUEST);

    res = await request(app)
      .post(`/api/v1/parent/register`)
      .send({
        ...reqPayload,
        lastName: 'ThisLastNameIsWayTooLong',
      });
    expect(res.statusCode).toBe(HttpStatusCode.BAD_REQUEST);

    res = await request(app)
      .post(`/api/v1/parent/register`)
      .send({
        ...reqPayload,
        lastName: 'Abbas!',
      });
    expect(res.statusCode).toBe(HttpStatusCode.BAD_REQUEST);
  });

  it('should return 400 if parent is under 18', async () => {
    const today = new Date();
    const underage = new Date(
      today.getFullYear() - 17,
      today.getMonth(),
      today.getDate(),
    )
      .toISOString()
      .split('T')[0];

    const res = await request(app)
      .post(`/api/v1/parent/register`)
      .send({
        ...reqPayload,
        birthDate: underage,
      });

    expect(res.statusCode).toBe(HttpStatusCode.BAD_REQUEST);
    expect(JSON.stringify(res.body.errors)).toMatch(/older than 18/i);
  });

  it('should return 400 for missing required fields', async () => {
    const requiredFields = [
      'email',
      'password',
      'confirmPassword',
      'phone',
      'firstName',
      'lastName',
      'birthDate',
    ];

    for (const field of requiredFields) {
      const payload = { ...reqPayload };
      delete payload[field as keyof typeof payload];

      const res = await request(app)
        .post(`/api/v1/parent/register`)
        .send(payload);

      expect(res.statusCode).toBe(HttpStatusCode.BAD_REQUEST);
      expect(JSON.stringify(res.body)).toMatch(new RegExp(field, 'i'));
    }
  });
});

describe('POST /api/v1/parent/login', () => {
  const userCredentials = {
    email: 'test@example.com',
    password: 'StrongP@ssw0rd',
  };

  const registerPayload = {
    email: userCredentials.email,
    password: userCredentials.password,
    confirmPassword: userCredentials.password,
    phone: '+201234567890',
    firstName: 'ahmed',
    lastName: 'Abbas',
    birthDate: '2000-01-01',
  };

  const createUser = async (): Promise<void> => {
    await request(app).post(`/api/v1/parent/register`).send(registerPayload);
  };

  it('should return 200 and token on successful login', async () => {
    await createUser();

    const res = await request(app).post('/api/v1/parent/login').send({
      email: userCredentials.email,
      password: userCredentials.password,
    });

    if (res.statusCode !== 200) {
      console.log('LOGIN ERROR:', res.body);
    }

    expect(res.statusCode).toBe(HttpStatusCode.OK);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('User Logged-in successful');
    expect(res.body.accessToken).toBeDefined();

    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie']![0]).toContain('refreshToken');
  });

  it('should return 401 when email mofieeds not exist', async () => {
    const res = await request(app).post('/api/v1/parent/login').send({
      email: 'nonexistent@example.com',
      password: 'AnyPassword123',
    });

    expect(res.statusCode).toBe(HttpStatusCode.UNAUTHORIZED);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Please provide correct email and password.');
  });

  it('should return 401 when password is incorrect', async () => {
    await createUser();

    const res = await request(app).post('/api/v1/parent/login').send({
      email: userCredentials.email,
      password: 'WrongPassword123',
    });

    expect(res.statusCode).toBe(HttpStatusCode.UNAUTHORIZED);
    expect(res.body.message).toBe('Please provide correct email and password.');
  });

  it('should return 400 when account is deactivated', async () => {
    await createUser();

    await ParentModel.findOneAndUpdate(
      { email: userCredentials.email },
      { isActive: false },
    );

    const res = await request(app).post('/api/v1/parent/login').send({
      email: userCredentials.email,
      password: userCredentials.password,
    });

    expect(res.statusCode).toBe(HttpStatusCode.BAD_REQUEST);
    expect(res.body.message).toBe(
      'This account is deactivated, to reactivate it, POST /auth/reactivate .',
    );
  });

  it('should return 400 for invalid email format', async () => {
    const res = await request(app).post('/api/v1/parent/login').send({
      email: 'not-an-email',
      password: 'somepassword',
    });

    expect(res.statusCode).toBe(HttpStatusCode.BAD_REQUEST);
    expect(JSON.stringify(res.body)).toMatch(/email/i);
  });

  it('should return 400 when password is missing', async () => {
    const res = await request(app).post('/api/v1/parent/login').send({
      email: userCredentials.email,
    });

    expect(res.statusCode).toBe(HttpStatusCode.BAD_REQUEST);
    expect(JSON.stringify(res.body)).toMatch(/password/i);
  });

  it('should return 400 when email is missing', async () => {
    const res = await request(app).post('/api/v1/parent/login').send({
      password: 'somepassword',
    });

    expect(res.statusCode).toBe(HttpStatusCode.BAD_REQUEST);
    expect(JSON.stringify(res.body)).toMatch(/email/i);
  });
});

describe('POST /api/v1/parent/otp', () => {
  const validPayload = {
    email: 'test@example.com',
    reason: 'reset_password',
  };

  const registerPayload = {
    email: validPayload.email,
    password: 'StrongP@ssw0rd',
    confirmPassword: 'StrongP@ssw0rd',
    phone: '+201234567890',
    firstName: 'ziko',
    lastName: 'mofieed',
    birthDate: '2000-01-01',
  };

  beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      if (collection) {
        await collection.deleteMany({});
      }
    }
  });

  it('should return 200 and send OTP when user exists, check VPN if timeout (personal note)', async () => {
    const log1 = await request(app)
      .post(`/api/v1/parent/register`)
      .send(registerPayload);

    const res = await request(app).get('/api/v1/parent/otp').send(validPayload);

    expect(res.statusCode).toBe(HttpStatusCode.OK);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe(
      'If an account exists for this email, an OTP has been sent',
    );

    const user = await ParentModel.findOne({
      email: validPayload.email,
    }).select('+otp');
    // console.log(user?.otp?.code);
    // console.log(res.body);
    // expect(user).toBeDefined();
    // expect(await user!.verifyOTP(`${user?.otp?.code}`, 'reset_password')).toBe(
    //   true,
    // );
    // expect(user?.otp?.code).toBe(res.body.otp);
    if (!user?.otp) console.log('OTP IS MISSING IN DB:', user);
    expect(user?.otp?.reason).toBe(validPayload.reason);
    expect(user?.otp?.lastRequest).toBeDefined();
  });

  it('should return 200 without sending OTP when user mofieeds not exist (security by obscurity)', async () => {
    const res = await request(app)
      .get('/api/v1/parent/otp')
      .send({ ...validPayload, email: 'hahahaaha@example.com' });
    console.log(res.body);

    expect(res.statusCode).toBe(HttpStatusCode.OK);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe(
      'If an account exists for this email, an OTP has been sent',
    );
    expect(res.body.otp).toBeUndefined();
  });

  // it('should return 429 when OTP was requested recently', async () => {
  //   await request(app).get(`/api/v1/parent/register`).send(registerPayload);
  //   const limiter = rateLimit({
  //     windowMs: 1000,
  //     max: 3,
  //     message: 'Rate limited',
  //   });

  //   app.use('/api/v1/parent/otp', limiter);

  //   const firstRes = await request(app)
  //     .get('/api/v1/parent/otp')
  //     .send(validPayload);
  //   expect(firstRes.statusCode).toBe(HttpStatusCode.OK);

  //   const secondRes = await request(app)
  //     .get('/api/v1/parent/otp')
  //     .send(validPayload);

  //   expect(secondRes.statusCode).toBe(HttpStatusCode.OK);

  //   const thirdRes = await request(app)
  //     .get('/api/v1/parent/otp')
  //     .send(validPayload);

  //   const fourthRes = await request(app)
  //     .get('/api/v1/parent/otp')
  //     .send(validPayload);

  //   expect(fourthRes.statusCode).toBe(HttpStatusCode.TOO_MANY_REQUESTS);
  //   expect(secondRes.body.message).toMatch(
  //     /Please wait.*minute before requesting another OTP/i,
  //   );
  // });

  it('should return 400 for missing email', async () => {
    const res = await request(app)
      .get('/api/v1/parent/otp')
      .send({ reason: 'reset_password' });

    expect(res.statusCode).toBe(HttpStatusCode.BAD_REQUEST);
    expect(JSON.stringify(res.body)).toMatch(/email/i);
  });

  it('should return 400 for invalid reason', async () => {
    const res = await request(app)
      .get('/api/v1/parent/otp')
      .send({ email: validPayload.email, reason: 'invalid_reason' });

    expect(res.statusCode).toBe(HttpStatusCode.BAD_REQUEST);
    expect(JSON.stringify(res.body)).toMatch(/reason/i);
  });
});
