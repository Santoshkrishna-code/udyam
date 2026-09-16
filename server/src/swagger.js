const swaggerJsDoc = require('swagger-jsdoc');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'UDYAM ERP — API Documentation',
      version: '1.0.0',
      description:
        'RESTful API documentation for UDYAM (Business Operations & Inventory ERP). Supports customer management, enquiries, quotations, sales order conversions, atomic inventory reservation, and dispatch workflows with RBAC.',
      contact: {
        name: 'Bandla Santosh Krishna',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token generated via /api/auth/login',
        },
      },
      schemas: {
        StandardSuccess: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            message: { type: 'string', example: 'Operation completed successfully' },
          },
        },
        StandardError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Insufficient inventory' },
            error: {
              type: 'object',
              properties: {
                productId: { type: 'integer', example: 5 },
                requested: { type: 'integer', example: 80 },
                available: { type: 'integer', example: 70 },
              },
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/server.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = swaggerDocs;
