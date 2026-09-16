const request = require('supertest');
const app = require('../src/app');

async function getAuthTokens() {
  const adminRes = await request(app).post('/api/auth/login').send({
    email: 'admin@udyam.local',
    password: 'admin123',
  });

  const salesRes = await request(app).post('/api/auth/login').send({
    email: 'sales@udyam.local',
    password: 'sales123',
  });

  return {
    adminToken: adminRes.body.data.token,
    adminUser: adminRes.body.data.user,
    salesToken: salesRes.body.data.token,
    salesUser: salesRes.body.data.user,
  };
}

module.exports = {
  getAuthTokens,
};
