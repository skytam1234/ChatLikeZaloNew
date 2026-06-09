import aiService from '../services/ai.service.js';
import { ValidationError } from '../middleware/error.middleware.js';

export class AIController {
  /**
   * POST /api/ai/translate
   * Non-streaming translation
   */
  async translateMessage(req, res, next) {
    try {
      const { text } = req.body;

      if (!text || typeof text !== 'string' || !text.trim()) {
        throw new ValidationError('Text is required and must be a non-empty string');
      }

      const result = await aiService.translate(text);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AIController();
