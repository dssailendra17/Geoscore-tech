import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import passport from "passport";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import helmet from "helmet";
import cors from "cors";
import { logger, logRequest, logError } from "./lib/logger";
import { validateEnvironment } from "./lib/env-validator";

// Validate environment variables before starting
validateEnvironment();

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com'])
    : ['http://localhost:5000', 'http://localhost:5173', 'http://127.0.0.1:5000'],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Trust proxy (important for rate limiting and IP detection)
app.set('trust proxy', 1);

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
    limit: '10mb', // Prevent large payload attacks
  }),
);

app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());

// Initialize Passport for OAuth
app.use(passport.initialize());

// Legacy log function for compatibility
export function log(message: string, source = "express") {
  logger.info(message, { source });
}

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    // Log API requests
    if (req.path.startsWith("/api")) {
      logRequest(req.method, req.path, res.statusCode, duration, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
    }
  });

  next();
});

// Health check endpoint (before rate limiting)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Initialize integrations and job system
const initializeBackgroundServices = async () => {
  logger.info('Initializing external integrations...');

  try {
    const { initializeIntegrations } = await import('./integrations');

    initializeIntegrations({
      llm: {
        openai: process.env.OPENAI_API_KEY ? {
          apiKey: process.env.OPENAI_API_KEY,
        } : undefined,
        anthropic: process.env.ANTHROPIC_API_KEY ? {
          apiKey: process.env.ANTHROPIC_API_KEY,
        } : undefined,
        google: process.env.GOOGLE_API_KEY ? {
          apiKey: process.env.GOOGLE_API_KEY,
        } : undefined,
        perplexity: process.env.PERPLEXITY_API_KEY ? {
          apiKey: process.env.PERPLEXITY_API_KEY,
        } : undefined,
        grok: process.env.GROK_API_KEY ? {
          apiKey: process.env.GROK_API_KEY,
        } : undefined,
        deepseek: process.env.DEEPSEEK_API_KEY ? {
          apiKey: process.env.DEEPSEEK_API_KEY,
        } : undefined,
        openrouter: process.env.OPENROUTER_API_KEY ? {
          apiKey: process.env.OPENROUTER_API_KEY,
          appName: 'GeoScore',
          appUrl: 'https://geoscore.com',
        } : undefined,
      },
      brandDev: process.env.BRAND_DEV_API_KEY ? {
        apiKey: process.env.BRAND_DEV_API_KEY,
      } : undefined,
      knowledgeGraph: process.env.GOOGLE_KG_API_KEY ? {
        apiKey: process.env.GOOGLE_KG_API_KEY,
      } : undefined,
      serpApi: process.env.SERPAPI_API_KEY ? {
        apiKey: process.env.SERPAPI_API_KEY,
      } : undefined,
    });

    logger.info('External integrations initialized successfully');
  } catch (error: any) {
    logger.warn('Could not initialize integrations', { error: error.message });
  }

  logger.info('Initializing job system...');

  try {
    const { initializeJobSystem } = await import('./jobs');
    initializeJobSystem();
    logger.info('Job system initialized successfully');
  } catch (error: any) {
    logger.warn('Could not initialize job system', { error: error.message });
  }

  logger.info('Initializing Razorpay client...');

  try {
    const { initializeRazorpay } = await import('./services/subscription');
    initializeRazorpay();
    logger.info('Razorpay client initialized successfully');
  } catch (error: any) {
    logger.warn('Could not initialize Razorpay', { error: error.message });
  }
};

async function ensureDevUser() {
  if (process.env.NODE_ENV !== 'production') {
    try {
      const { storage } = await import('./storage');
      const bcrypt = await import('bcryptjs');
      const existing = await storage.getUser('dev-user');
      if (!existing) {
        const passwordHash = await bcrypt.hash('devpassword', 12);
        await storage.createUser({
          id: 'dev-user',
          email: 'dev@geoscore.local',
          firstName: 'Demo',
          lastName: 'User',
          passwordHash,
          emailVerified: true,
        } as any);
        logger.info('Created dev-user for demo mode');
      }
    } catch (error: any) {
      logger.warn('Could not create dev user', { error: error.message });
    }
  }
}

// Initialize routes and middleware
async function initializeApp() {
  await ensureDevUser();
  await registerRoutes(httpServer, app);

  // Global error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log error with context
    logError(err, {
      path: req.path,
      method: req.method,
      ip: req.ip,
      userId: (req as any).userId,
      status,
    });

    if (res.headersSent) {
      return next(err);
    }

    // Don't leak error details in production
    const responseMessage = process.env.NODE_ENV === 'production' && status === 500
      ? 'Internal Server Error'
      : message;

    return res.status(status).json({
      error: responseMessage,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  return app;
}

// Check if running in Vercel serverless environment
const isVercel = process.env.VERCEL === '1';

if (!isVercel) {
  // Traditional server startup (for local development or VPS deployment)
  (async () => {
    try {
      // Initialize background services first
      await initializeBackgroundServices();
      
      // Initialize app
      await initializeApp();

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || "5000", 10);
    httpServer.listen(port, "localhost", () => {
      logger.info(`Server started successfully`, {
        port,
        environment: process.env.NODE_ENV,
        nodeVersion: process.version,
      });
      console.log(`\n✅ Server running on http://localhost:${port}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, starting graceful shutdown`);

      httpServer.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    } catch (error: any) {
      console.error('\n❌ Server startup failed:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  })();
}

// Export app for Vercel serverless
export { app, httpServer, initializeApp };
