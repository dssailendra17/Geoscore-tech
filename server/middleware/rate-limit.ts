import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import { logger } from '../lib/logger';

// Rate limit configuration based on plan tiers
export const RATE_LIMITS = {
  free: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100, // 100 requests per hour
  },
  starter: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 500, // 500 requests per hour
  },
  growth: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 2000, // 2000 requests per hour
  },
  enterprise: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10000, // 10000 requests per hour
  },
};

// General API rate limiter (applies to all API routes)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 'Check the Retry-After header for when you can retry.',
  },
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
  handler: (req: Request, res: Response) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      path: req.path,
    });
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Please wait before trying again.',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

// Webhook rate limiter (more lenient for webhooks)
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    error: 'Webhook rate limit exceeded',
  },
  handler: (req: Request, res: Response) => {
    logger.warn('Webhook rate limit exceeded', {
      ip: req.ip,
      path: req.path,
    });
    res.status(429).json({
      error: 'Too many webhook requests',
    });
  },
});

// Admin endpoints rate limiter
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Higher limit for admin operations
  message: {
    error: 'Admin rate limit exceeded',
  },
  handler: (req: Request, res: Response) => {
    logger.warn('Admin rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userId: (req as any).userId,
    });
    res.status(429).json({
      error: 'Too many admin requests',
      message: 'Please slow down your requests.',
    });
  },
});

// Job trigger rate limiter (prevent job spam)
export const jobLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 job triggers per minute
  message: {
    error: 'Job trigger rate limit exceeded',
  },
  handler: (req: Request, res: Response) => {
    logger.warn('Job trigger rate limit exceeded', {
      ip: req.ip,
      userId: (req as any).userId,
      brandId: req.params.brandId,
    });
    res.status(429).json({
      error: 'Too many job triggers',
      message: 'Please wait before triggering more jobs.',
    });
  },
});

// Export rate limiter (prevent data export abuse)
export const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 exports per hour
  message: {
    error: 'Export rate limit exceeded',
  },
  handler: (req: Request, res: Response) => {
    logger.warn('Export rate limit exceeded', {
      ip: req.ip,
      userId: (req as any).userId,
    });
    res.status(429).json({
      error: 'Too many export requests',
      message: 'You can only export 10 times per hour.',
    });
  },
});

