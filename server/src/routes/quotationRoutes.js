const express = require('express');
const quotationController = require('../controllers/quotationController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', quotationController.getAll);
router.get('/:id', quotationController.getById);
router.post('/', authorize(['ADMIN', 'SALES_USER']), quotationController.create);
router.patch('/:id/status', authorize(['ADMIN', 'SALES_USER']), quotationController.updateStatus);
router.post('/:id/convert', authorize(['ADMIN', 'SALES_USER']), quotationController.convertToSalesOrder);

module.exports = router;
