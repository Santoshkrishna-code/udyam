const express = require('express');
const enquiryController = require('../controllers/enquiryController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', enquiryController.getAll);
router.get('/:id', enquiryController.getById);
router.post('/', authorize(['ADMIN', 'SALES_USER']), enquiryController.create);
router.patch('/:id/status', authorize(['ADMIN', 'SALES_USER']), enquiryController.updateStatus);

module.exports = router;
