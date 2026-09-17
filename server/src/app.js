const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');

dotenv.config();

const swaggerDocs = require('./swagger');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const productRoutes = require('./routes/productRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');
const quotationRoutes = require('./routes/quotationRoutes');
const salesOrderRoutes = require('./routes/salesOrderRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/sales-orders', salesOrderRoutes);

// --- Production: Serve React SPA ---
const path = require('path');
const clientDistPath = path.join(__dirname, '../../client/dist');
const clientPublicPath = path.join(__dirname, '../../client/public');

if (process.env.NODE_ENV === 'production') {
  // Serve compiled production build FIRST (contains index.html with injected bundle script)
  app.use(express.static(clientDistPath));
  app.use(express.static(clientPublicPath));

  // SPA fallback: serve index.html from dist for all non-API GET requests
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Central error handler
app.use(errorHandler);

module.exports = app;
