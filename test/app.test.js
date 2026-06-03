import request from 'supertest';
import app from '#src/app.js';
import { describe, it, expect } from '@jest/globals';

describe('App', () => {
  describe('GET /', () => {
    it('should return 200 OK', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
    });
  });
});

describe('GET /health', () => {
  it('should return 200 OK with status ok', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});
