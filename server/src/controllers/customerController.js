const customerService = require('../services/customerService');
const { sendSuccess } = require('../utils/response');

class CustomerController {
  async getAll(req, res, next) {
    try {
      const customers = await customerService.getAll();
      return sendSuccess(res, customers, 200);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const customer = await customerService.getById(req.params.id);
      return sendSuccess(res, customer, 200);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const customer = await customerService.create(req.body);
      return sendSuccess(res, customer, 201, 'Customer created successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CustomerController();
