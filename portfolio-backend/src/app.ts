import express, { type Express } from 'express';
import helmet from 'helmet';
import cors, { type CorsOptions } from 'cors';
import { env } from './config/env.js';
import contactRouter from './routes/contact.route.js';
import healthRouter from './routes/health.route.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp(): Express {
  const app = express();

  // Trust reverse proxy (e.g. Render, Cloudflare) for accurate client IPs and rate limiting
  app.set('trust proxy', 1);

  // Security headers with Helmet
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    })
  );

  // CORS configuration
  const allowedOrigins = env.FRONTEND_ORIGINS;

  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      // Allow non-browser requests (e.g. curl, uptime probes, internal services)
      if (!origin) {
        return callback(null, true);
      }

      const cleanOrigin = origin.trim().replace(/\/+$/, '').toLowerCase();
      const isAllowed = allowedOrigins.some((allowed) => {
        const cleanAllowed = allowed.trim().replace(/\/+$/, '').toLowerCase();
        if (cleanAllowed === cleanOrigin) return true;
        // Also support Vercel preview/branch domains if frontend origins include vercel.app
        if (cleanAllowed.endsWith('.vercel.app') && cleanOrigin.endsWith('.vercel.app')) {
          return true;
        }
        return false;
      });

      if (isAllowed) {
        return callback(null, true);
      }

      // Origin not in whitelist
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
    credentials: true,
    maxAge: 86400
  };

  app.use(cors(corsOptions));

  // Request body parsing with strict size limits to prevent DoS
  app.use(express.json({ limit: '32kb' }));
  app.use(express.urlencoded({ extended: true, limit: '32kb' }));

  // Routes
  app.use('/', healthRouter); // GET /health
  app.use('/api', healthRouter); // GET /api/health
  app.use('/api', contactRouter); // POST /api/contact

  // 404 Handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Cannot ${req.method} ${req.originalUrl}`
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
