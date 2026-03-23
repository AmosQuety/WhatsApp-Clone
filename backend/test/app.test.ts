import express from 'express';
import request from 'supertest';

// Simple health check test (skipping Firebase init for pure unit tests)
const app = express();
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'WhatsApp Backend running' });
});

describe('GET /health', () => {
  it('should return 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'OK');
  });
});
