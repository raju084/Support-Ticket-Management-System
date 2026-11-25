const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../src/server');
const User = require('../src/models/user.model');

// Use in-memory test DB
const MONGO_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/support_tickets_test';

beforeAll(async () => {
  await mongoose.connect(MONGO_URI);
}, 15000);

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
}, 15000);

beforeEach(async () => {
  await User.deleteMany();
});

describe('Auth API', () => {
  const userData = { name: 'Test User', email: 'test@example.com', password: 'Test@123' };

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app).post('/api/auth/register').send(userData);
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(userData.email);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should ignore role=admin on public registration and assign user role', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...userData, role: 'admin' });
      expect(res.statusCode).toBe(201);
      expect(res.body.data.user.role).toBe('user');
    });

    it('should fail with duplicate email', async () => {
      await request(app).post('/api/auth/register').send(userData);
      const res = await request(app).post('/api/auth/register').send(userData);
      expect(res.statusCode).toBe(409);
    });

    it('should fail with invalid email', async () => {
      const res = await request(app).post('/api/auth/register').send({ ...userData, email: 'invalid' });
      expect(res.statusCode).toBe(400);
    });

    it('should fail with short password', async () => {
      const res = await request(app).post('/api/auth/register').send({ ...userData, password: '123' });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(userData);
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password: userData.password });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should fail with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password: 'wrongpass' });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile with valid token', async () => {
      const regRes = await request(app).post('/api/auth/register').send(userData);
      const token = regRes.body.data.accessToken;
      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.user.email).toBe(userData.email);
    });

    it('should fail without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
    });
  });
});
