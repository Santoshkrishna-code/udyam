const salesOrderService = require('../services/salesOrderService');
const dispatchService = require('../services/dispatchService');
const { sendSuccess } = require('../utils/response');

class SalesOrderController {
  async getAll(req, res, next) {
    try {
      const orders = await salesOrderService.getAll();
      return sendSuccess(res, orders, 200);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const order = await salesOrderService.getById(req.params.id);
      return sendSuccess(res, order, 200);
    } catch (error) {
      next(error);
    }
  }

  async confirm(req, res, next) {
    try {
      const confirmedOrder = await salesOrderService.confirmOrder(req.user.id, req.params.id);
      return sendSuccess(
        res,
        confirmedOrder,
        200,
        'Sales Order confirmed and inventory reserved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  async dispatch(req, res, next) {
    try {
      const dispatchRecord = await dispatchService.processDispatch(
        req.user.id,
        req.params.id,
        req.body
      );
      return sendSuccess(
        res,
        dispatchRecord,
        201,
        'Sales Order dispatched and inventory updated successfully'
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SalesOrderController();
