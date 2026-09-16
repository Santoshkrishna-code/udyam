const inventoryService = require('../services/inventoryService');
const { sendSuccess } = require('../utils/response');

class InventoryController {
  async getAll(req, res, next) {
    try {
      const records = await inventoryService.getAll();
      return sendSuccess(res, records, 200);
    } catch (error) {
      next(error);
    }
  }

  async getByProductId(req, res, next) {
    try {
      const record = await inventoryService.getByProductId(req.params.productId);
      return sendSuccess(res, record, 200);
    } catch (error) {
      next(error);
    }
  }

  async updatePhysicalQuantity(req, res, next) {
    try {
      const { physicalQuantity } = req.body;
      const updated = await inventoryService.updatePhysicalQuantity(req.params.productId, physicalQuantity);
      return sendSuccess(res, updated, 200, 'Inventory stock updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new InventoryController();
