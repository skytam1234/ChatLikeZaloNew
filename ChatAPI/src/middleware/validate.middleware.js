import { ZodError } from 'zod';

export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      let data;
      let target;

      switch (source) {
        case 'query':
          data = req.query;
          target = {};
          break;
        case 'params':
          data = req.params;
          target = {};
          break;
        case 'body':
        default:
          data = req.body;
          target = {};
      }

      const parsed = schema.parse(data);

      if (source === 'query') {
        req.query = { ...req.query, ...parsed };
      } else if (source === 'params') {
        req.params = { ...req.params, ...parsed };
      } else {
        req.body = { ...req.body, ...parsed };
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors,
          timestamp: new Date().toISOString(),
        });
      }
      next(error);
    }
  };
};
