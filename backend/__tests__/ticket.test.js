const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../src/server');
const User = require('../src/models/user.model');
const Ticket = require('../src/models/ticket.model');
const { generateTokenPair } = require('../src/utils/helpers');

const MONGO_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/support_tickets_test_tickets';

let userToken, adminToken, userId, adminId, ticketId, commentId;

beforeAll(async () => {
  await mongoose.connect(MONGO_URI);

  // Create regular user via public register
  const userRes = await request(app)
    .post('/api/auth/register')
    .send({ name: 'User', email: 'user@test.com', password: 'User@123' });
  userToken = userRes.body.data.accessToken;
  userId = userRes.body.data.user.id;

  // Create admin directly in DB (public registration cannot self-assign admin)
  const admin = await User.create({
    name: 'Admin',
    email: 'admin@test.com',
    password: 'Admin@123',
    role: 'admin',
  });
  adminId = admin._id.toString();
  adminToken = generateTokenPair(admin._id, admin.role).accessToken;
}, 15000);

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
}, 15000);

describe('Ticket API', () => {
  const ticketData = {
    title: 'Test Ticket Title',
    description: 'This is a detailed description of the test ticket.',
    category: 'technical',
    priority: 'medium',
  };

  describe('POST /api/tickets', () => {
    it('should create a ticket', async () => {
      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send(ticketData);
      expect(res.statusCode).toBe(201);
      expect(res.body.data.ticket.title).toBe(ticketData.title);
      ticketId = res.body.data.ticket._id;
    });

    it('should fail without auth', async () => {
      const res = await request(app).post('/api/tickets').send(ticketData);
      expect(res.statusCode).toBe(401);
    });

    it('should fail with short title', async () => {
      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ ...ticketData, title: 'Hi' });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/tickets', () => {
    it('should get user own tickets', async () => {
      const res = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.tickets)).toBe(true);
    });
  });

  describe('GET /api/tickets/:id', () => {
    it('should get a specific ticket', async () => {
      const res = await request(app)
        .get(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toBe(200);
    });

    it('should deny access from other user', async () => {
      // Create another user
      const other = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Other', email: 'other@test.com', password: 'Other@123' });
      const res = await request(app)
        .get(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${other.body.data.accessToken}`);
      expect(res.statusCode).toBe(403);
    });
  });

  describe('PUT /api/tickets/:id', () => {
    it('should update ticket', async () => {
      const res = await request(app)
        .put(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Updated Ticket Title Here' });
      expect(res.statusCode).toBe(200);
    });

    it('should not allow user to change status', async () => {
      const res = await request(app)
        .put(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'resolved' });
      expect(res.statusCode).toBe(403);
    });
  });

  describe('Admin ticket management', () => {
    it('admin should see all tickets', async () => {
      const res = await request(app)
        .get('/api/admin/tickets')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
    });

    it('admin should update ticket status', async () => {
      const res = await request(app)
        .patch(`/api/admin/tickets/${ticketId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'in-progress' });
      expect(res.statusCode).toBe(200);
    });

    it('user should not access admin routes', async () => {
      const res = await request(app)
        .get('/api/admin/tickets')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toBe(403);
    });
  });

  describe('Comments & Activity API', () => {
    it('user should add a comment to their ticket', async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'Please look into this soon.' });
      expect(res.statusCode).toBe(201);
      commentId = res.body.data.comment._id;
    });

    it('admin should add an internal note hidden from user', async () => {
      const addRes = await request(app)
        .post(`/api/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ content: 'Internal triage note', isInternal: true });
      expect(addRes.statusCode).toBe(201);

      const userComments = await request(app)
        .get(`/api/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(userComments.statusCode).toBe(200);
      expect(userComments.body.data.comments.some((c) => c.isInternal)).toBe(false);

      const adminComments = await request(app)
        .get(`/api/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminComments.statusCode).toBe(200);
      expect(adminComments.body.data.comments.some((c) => c.isInternal)).toBe(true);
    });

    it('should return activity logs for ticket owner and admin', async () => {
      // Allow async eventBus handlers to flush
      await new Promise((r) => setTimeout(r, 100));
      const res = await request(app)
        .get(`/api/activities/ticket/${ticketId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.activities.length).toBeGreaterThan(0);
    });
  });

  describe('DELETE /api/tickets/:id', () => {
    it('should delete an open ticket', async () => {
      // Reset ticket to open
      await Ticket.findByIdAndUpdate(ticketId, { status: 'open' });
      const res = await request(app)
        .delete(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toBe(200);
    });
  });
});
