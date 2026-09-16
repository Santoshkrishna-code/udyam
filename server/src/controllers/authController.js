const authService = require('../services/authService');
const { sendSuccess } = require('../utils/response');

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      return sendSuccess(res, result, 200, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = await authService.getMe(req.user.id);
      return sendSuccess(res, user, 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
