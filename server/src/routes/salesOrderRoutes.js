const express = require('express');
const salesOrderController = require('../controllers/salesOrderController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', salesOrderController.getAll);
router.get('/:id', salesOrderController.getById);
router.post('/:id/confirm', authorize(['ADMIN']), salesOrderController.confirm);
router.post('/:id/dispatch', authorize(['ADMIN']), salesOrderController.dispatch);

module.exports = router;
