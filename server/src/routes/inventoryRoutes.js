const express = require('express');
const inventoryController = require('../controllers/inventoryController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', inventoryController.getAll);
router.get('/:productId', inventoryController.getByProductId);
router.patch('/:productId', authorize(['ADMIN']), inventoryController.updatePhysicalQuantity);

module.exports = router;
