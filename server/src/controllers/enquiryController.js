const enquiryService = require('../services/enquiryService');
const { sendSuccess } = require('../utils/response');

class EnquiryController {
  async getAll(req, res, next) {
    try {
      const enquiries = await enquiryService.getAll();
      return sendSuccess(res, enquiries, 200);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const enquiry = await enquiryService.getById(req.params.id);
      return sendSuccess(res, enquiry, 200);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const enquiry = await enquiryService.create(req.user.id, req.body);
      return sendSuccess(res, enquiry, 201, 'Customer enquiry created successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      const updated = await enquiryService.updateStatus(req.params.id, status);
      return sendSuccess(res, updated, 200, 'Enquiry status updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EnquiryController();
