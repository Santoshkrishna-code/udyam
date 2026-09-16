const quotationService = require('../services/quotationService');
const salesOrderService = require('../services/salesOrderService');
const { sendSuccess } = require('../utils/response');

class QuotationController {
  async getAll(req, res, next) {
    try {
      const quotations = await quotationService.getAll();
      return sendSuccess(res, quotations, 200);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const quotation = await quotationService.getById(req.params.id);
      return sendSuccess(res, quotation, 200);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const quotation = await quotationService.create(req.user.id, req.body);
      return sendSuccess(res, quotation, 201, 'Quotation generated successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      const updated = await quotationService.updateStatus(req.params.id, status);
      return sendSuccess(res, updated, 200, `Quotation status updated to ${status}`);
    } catch (error) {
      next(error);
    }
  }

  async convertToSalesOrder(req, res, next) {
    try {
      const salesOrder = await salesOrderService.convertFromQuotation(req.user.id, req.params.id);
      return sendSuccess(res, salesOrder, 201, 'Quotation converted to Sales Order successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new QuotationController();
