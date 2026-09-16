const productService = require('../services/productService');
const { sendSuccess } = require('../utils/response');

class ProductController {
  async getAll(req, res, next) {
    try {
      const products = await productService.getAll();
      return sendSuccess(res, products, 200);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const product = await productService.getById(req.params.id);
      return sendSuccess(res, product, 200);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const product = await productService.create(req.body);
      return sendSuccess(res, product, 201, 'Product created successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();
