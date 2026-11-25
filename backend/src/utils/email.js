const nodemailer = require('nodemailer');
const logger = require('./logger');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;
  if (!EMAIL_USER || !EMAIL_PASS || EMAIL_USER === 'your_email@gmail.com') {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(EMAIL_PORT, 10) || 587,
    secure: parseInt(EMAIL_PORT, 10) === 465,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  return transporter;
};

/**
 * Send a notification email. Gracefully logs in dev/test when SMTP is not configured.
 */
const sendNotificationEmail = async ({ to, subject, text, html }) => {
  if (!to) return;

  const mailer = getTransporter();
  if (!mailer) {
    logger.info(`[EMAIL_PREVIEW] To: ${to} | Subject: ${subject} | ${text}`);
    return;
  }

  try {
    await mailer.sendMail({
      from: process.env.EMAIL_FROM || 'Support System <noreply@support.com>',
      to,
      subject,
      text,
      html,
    });
    logger.info(`[EMAIL_SENT] To: ${to} | Subject: ${subject}`);
  } catch (err) {
    logger.error(`[EMAIL_ERROR] Failed to send to ${to}: ${err.message}`);
  }
};

module.exports = { sendNotificationEmail };
