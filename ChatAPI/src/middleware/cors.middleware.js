import cors from 'cors';
import config from '../config/index.js';

const isWildcard = config.frontendUrl === '*';

export const corsMiddleware = cors({
  origin: isWildcard ? true : config.frontendUrl,
  credentials: !isWildcard && config.cors.credentials,
  methods: config.cors.methods,
  allowedHeaders: config.cors.allowedHeaders,
  exposedHeaders: ['Content-Range', 'X-Total-Count'],
  maxAge: 86400,
  optionsSuccessStatus: 204,
});

export default {
  corsMiddleware,
};
