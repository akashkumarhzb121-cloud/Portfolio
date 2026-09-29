import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { ContactEnquiry } from '../src/models/enquiry.model.js';
import * as emailService from '../src/services/email.service.js';

describe('Portfolio Backend API Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Health Check Endpoints', () => {
    it('GET /health returns 200 and healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'healthy');
      expect(res.body).toHaveProperty('service', 'portfolio-backend');
      expect(res.body).toHaveProperty('uptime');
      expect(res.body).toHaveProperty('timestamp');
    });

    it('GET /api/health returns 200 and healthy status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'healthy');
    });

    it('GET /non-existent-route returns 404', async () => {
      const res = await request(app).get('/non-existent-route');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/contact - Valid Submission', () => {
    it('successfully validates, saves enquiry in DB, sends email, and returns 201', async () => {
      const mockSavedDoc = {
        _id: 'mock_doc_id_123',
        name: 'Jane Doe',
        email: 'jane@example.com',
        service: 'Full-Stack Web Development',
        message: 'I would like to discuss building a SaaS platform.',
        createdAt: new Date()
      };

      vi.spyOn(ContactEnquiry, 'create').mockResolvedValue(mockSavedDoc as any);
      vi.spyOn(emailService, 'sendContactNotification').mockResolvedValue({
        success: true,
        messageId: 'smtp_msg_123'
      });

      const payload = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        service: 'Full-Stack Web Development',
        message: 'I would like to discuss building a SaaS platform.'
      };

      const res = await request(app)
        .post('/api/contact')
        .send(payload)
        .set('Content-Type', 'application/json');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Message delivered successfully');
      expect(ContactEnquiry.create).toHaveBeenCalledTimes(1);
      expect(emailService.sendContactNotification).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /api/contact - Validation Failures', () => {
    it('returns 400 when name is shorter than 2 characters', async () => {
      const res = await request(app)
        .post('/api/contact')
        .send({
          name: 'A',
          email: 'valid@example.com',
          service: 'Full-Stack Web Development',
          message: 'This is a valid length project inquiry message.'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toHaveProperty('name');
    });

    it('returns 400 when email is invalid', async () => {
      const res = await request(app)
        .post('/api/contact')
        .send({
          name: 'Alex Rivera',
          email: 'not-an-email',
          service: 'Full-Stack Web Development',
          message: 'This is a valid length project inquiry message.'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toHaveProperty('email');
    });

    it('returns 400 when service is empty', async () => {
      const res = await request(app)
        .post('/api/contact')
        .send({
          name: 'Alex Rivera',
          email: 'alex@example.com',
          service: '   ',
          message: 'This is a valid length project inquiry message.'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toHaveProperty('service');
    });

    it('returns 400 when message is shorter than 10 characters', async () => {
      const res = await request(app)
        .post('/api/contact')
        .send({
          name: 'Alex Rivera',
          email: 'alex@example.com',
          service: 'Full-Stack Web Development',
          message: 'Hi'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toHaveProperty('message');
    });

    it('returns 400 when body is completely empty', async () => {
      const res = await request(app)
        .post('/api/contact')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toHaveProperty('name');
      expect(res.body.errors).toHaveProperty('email');
      expect(res.body.errors).toHaveProperty('service');
      expect(res.body.errors).toHaveProperty('message');
    });
  });

  describe('POST /api/contact - Failure Handling', () => {
    it('returns 500 when database save fails', async () => {
      vi.spyOn(ContactEnquiry, 'create').mockRejectedValue(new Error('MongoDB connection timeout'));

      const res = await request(app)
        .post('/api/contact')
        .send({
          name: 'Sarah Connor',
          email: 'sarah@example.com',
          service: 'Backend Architecture & APIs',
          message: 'Need help designing high-throughput distributed microservices.'
        });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Database error');
    });

    it('returns 502 when database succeeds but email notification fails', async () => {
      const mockSavedDoc = {
        _id: 'mock_doc_id_456',
        name: 'Sarah Connor',
        email: 'sarah@example.com',
        service: 'Backend Architecture & APIs',
        message: 'Need help designing high-throughput distributed microservices.',
        createdAt: new Date()
      };

      vi.spyOn(ContactEnquiry, 'create').mockResolvedValue(mockSavedDoc as any);
      vi.spyOn(emailService, 'sendContactNotification').mockResolvedValue({
        success: false,
        error: 'SMTP connection timeout',
        errorCode: 'ETIMEDOUT'
      });

      const res = await request(app)
        .post('/api/contact')
        .send({
          name: 'Sarah Connor',
          email: 'sarah@example.com',
          service: 'Backend Architecture & APIs',
          message: 'Need help designing high-throughput distributed microservices.'
        });

      expect(res.status).toBe(502);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('email notification delivery failed');
      expect(res.body).toHaveProperty('enquiryId', 'mock_doc_id_456');
      expect(res.body).toHaveProperty('deliveryCode', 'ETIMEDOUT');
    });
  });
});
