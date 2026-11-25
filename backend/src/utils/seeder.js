require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Ticket = require('../models/ticket.model');
const Comment = require('../models/comment.model');
const Activity = require('../models/activity.model');
const logger = require('./logger');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/support_tickets');
    logger.info('Connected to MongoDB for seeding...');

    // Clear existing data
    await Promise.all([User.deleteMany(), Ticket.deleteMany(), Comment.deleteMany(), Activity.deleteMany()]);
    logger.info('Cleared existing data');

    // Create admin
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@support.com',
      password: 'Admin@123',
      role: 'admin',
    });

    // Create users
    const users = await User.create([
      { name: 'Alice Johnson', email: 'alice@example.com', password: 'User@123', role: 'user' },
      { name: 'Bob Smith', email: 'bob@example.com', password: 'User@123', role: 'user' },
      { name: 'Carol Davis', email: 'carol@example.com', password: 'User@123', role: 'user' },
    ]);

    // Create tickets
    const tickets = await Ticket.create([
      {
        title: 'Cannot login to my account',
        description: 'I have been trying to login for the past hour but keep getting an error message saying invalid credentials even though I am sure my password is correct.',
        category: 'account',
        priority: 'high',
        status: 'open',
        createdBy: users[0]._id,
        statusHistory: [{ status: 'open', changedBy: users[0]._id, note: 'Ticket created' }],
      },
      {
        title: 'App crashes on startup',
        description: 'The mobile application crashes immediately after the splash screen. I have tried reinstalling but the issue persists.',
        category: 'bug',
        priority: 'critical',
        status: 'in-progress',
        createdBy: users[1]._id,
        assignedTo: admin._id,
        statusHistory: [
          { status: 'open', changedBy: users[1]._id, note: 'Ticket created' },
          { status: 'in-progress', changedBy: admin._id, note: 'Assigned and investigating' },
        ],
      },
      {
        title: 'Request for dark mode feature',
        description: 'It would be great if the application had a dark mode option to reduce eye strain during night time usage.',
        category: 'feature-request',
        priority: 'low',
        status: 'open',
        createdBy: users[2]._id,
        statusHistory: [{ status: 'open', changedBy: users[2]._id, note: 'Ticket created' }],
      },
      {
        title: 'Incorrect billing charge',
        description: 'I was charged twice for my monthly subscription this month. Please refund the duplicate charge.',
        category: 'billing',
        priority: 'high',
        status: 'resolved',
        createdBy: users[0]._id,
        resolvedAt: new Date(),
        statusHistory: [
          { status: 'open', changedBy: users[0]._id, note: 'Ticket created' },
          { status: 'resolved', changedBy: admin._id, note: 'Refund processed' },
        ],
      },
      {
        title: 'API integration documentation',
        description: 'The API documentation for the payment gateway integration is outdated and missing several endpoints.',
        category: 'technical',
        priority: 'medium',
        status: 'pending',
        createdBy: users[1]._id,
        statusHistory: [
          { status: 'open', changedBy: users[1]._id, note: 'Ticket created' },
          { status: 'pending', changedBy: admin._id, note: 'Waiting for documentation team' },
        ],
      },
    ]);

    // Create comments
    await Comment.create([
      { ticket: tickets[0]._id, author: admin._id, content: 'Hi Alice, can you please clear your browser cache and try again?', isInternal: false },
      { ticket: tickets[0]._id, author: users[0]._id, content: 'I tried that but still getting the same error.' },
      { ticket: tickets[1]._id, author: admin._id, content: 'We have reproduced the issue and are working on a fix.', isInternal: false },
      { ticket: tickets[1]._id, author: admin._id, content: 'Internal note: Issue seems related to null pointer in init sequence.', isInternal: true },
      { ticket: tickets[3]._id, author: admin._id, content: 'Your refund has been processed and will appear in 3-5 business days.' },
      { ticket: tickets[3]._id, author: users[0]._id, content: 'Thank you for the quick resolution!' },
    ]);

    logger.info('✅ Database seeded successfully!');
    logger.info(`Admin: admin@support.com / Admin@123`);
    logger.info(`Users: alice@example.com, bob@example.com, carol@example.com / User@123`);
    process.exit(0);
  } catch (err) {
    logger.error('Seeding failed:', err);
    process.exit(1);
  }
};

seed();
