import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { config } from './config/env.js';
import { connectDB, isUsingFallbackStore } from './db/connection.js';
import { apiRouter } from './routes/index.js';
import { geminiService } from './services/geminiService.js';

const app = express();

// Parse allowed origins from environment variable (supports comma-separated list or wildcard)
const allowedOriginsList = (process.env.CORS_ORIGIN || config.corsOrigin || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// Security and utility middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: (origin, callback) => {
      // 1. Allow mobile apps, curl, server-to-server, or same-origin requests
      if (!origin) {
        return callback(null, true);
      }

      // 2. Allow local development on any port
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }

      // 3. Automatically allow all Vercel production & preview deployments
      if (origin.endsWith('.vercel.app') || origin.includes('vercel.app')) {
        return callback(null, true);
      }

      // 4. Allow explicit origins configured in CORS_ORIGIN or wildcard
      if (
        allowedOriginsList.length > 0 &&
        (allowedOriginsList.includes(origin) || allowedOriginsList.includes('*'))
      ) {
        return callback(null, true);
      }

      // 5. In development mode or if no specific origins are locked, allow
      if (process.env.NODE_ENV !== 'production' || allowedOriginsList.length === 0) {
        return callback(null, true);
      }

      callback(new Error(`Origin [${origin}] is not authorized by STRATIQ CORS policy`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-admin-key',
      'x-user-id',
      'x-user-email',
      'x-user-name'
    ]
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Service root landing endpoint (friendly verification for Render health inspection)
app.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    service: 'STRATIQ Enterprise AI Advisory Backend API',
    environment: config.nodeEnv,
    database: isUsingFallbackStore() ? 'in-memory-fallback' : 'mongodb-atlas',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      businesses: '/api/businesses',
      admin: '/api/admin'
    },
    message: 'Backend server is running live.'
  });
});

// Health check endpoint (exempt from rate limit)
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    store: isUsingFallbackStore() ? 'in-memory-fallback' : 'mongodb',
    geminiConfigured: geminiService.isConfigured(),
    geminiModel: geminiService.getModel(),
    firebaseConfigured: !!config.firebaseProjectId
  });
});

// Rate limiting for AI and API calls (relaxed for local development)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 500 : 10000,
  skip: (req) => process.env.NODE_ENV !== 'production' && (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1'),
  message: { success: false, error: 'Too many requests from this IP, please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', generalLimiter);

// Primary API Router
app.use('/api', apiRouter);

// Isolated Standalone Admin Portal (served directly from the admin folder)
let adminStaticPath = path.resolve(process.cwd(), '../admin');
if (!fs.existsSync(adminStaticPath)) {
  adminStaticPath = path.resolve(process.cwd(), 'admin');
}
app.use('/admin', express.static(adminStaticPath));
app.use('/admin-portal', express.static(adminStaticPath));

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    error: config.nodeEnv === 'production' ? 'An unexpected internal error occurred.' : err.message
  });
});

// Start Server
async function startServer() {
  await connectDB();
  function listenOnPort(port: number, attempt = 1) {
    const srv = app.listen(port, '0.0.0.0', () => {
      console.log(`
========================================================================
🚀 AI Business Intelligence & Strategy Advisor Server
📡 Listening on: http://0.0.0.0:${port} (Port: ${port})
🌐 CORS Allowed Origin: ${config.corsOrigin}
🧠 Gemini Engine: ${config.geminiApiKey ? 'Configured (' + config.geminiModel + ')' : 'Heuristic Synthesizer Active'}
🔐 Authentication: AES-256-GCM Encrypted Passwords & Session Engine
========================================================================
`);
    });

    srv.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        if (attempt < 5) {
          const nextPort = port + 1;
          console.warn(`⚠️ Port ${port} is in use. Attempting fallback port ${nextPort}...`);
          listenOnPort(nextPort, attempt + 1);
        } else {
          console.error(`❌ Could not bind to ports ${port - attempt + 1} through ${port}. Please free the ports.`);
        }
      } else {
        console.error('Server error:', err);
      }
    });

    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully.');
      srv.close(() => process.exit(0));
    });
  }

  listenOnPort(config.port);
}

startServer();
