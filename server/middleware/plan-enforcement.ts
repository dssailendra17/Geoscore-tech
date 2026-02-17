/**
 * Plan Enforcement Middleware
 * 
 * Enforces plan limits and feature access based on subscription tier
 * Checks usage against plan limits before allowing operations
 */

import type { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import type { Brand } from '@shared/schema';

// Plan limits configuration
export const PLAN_LIMITS = {
  free: {
    competitors: 3,
    queriesPerDay: 15,
    promptsPerMonth: 50,
    teamMembers: 1,
    dataRetentionDays: 30,
    features: {
      gscIntegration: false,
      dataExport: false,
      customReports: false,
      apiAccess: false,
      prioritySupport: false,
      whiteLabel: false,
      sso: false,
    },
  },
  starter: {
    competitors: 5,
    queriesPerDay: 50,
    promptsPerMonth: 200,
    teamMembers: 3,
    dataRetentionDays: 90,
    features: {
      gscIntegration: true,
      dataExport: false,
      customReports: false,
      apiAccess: false,
      prioritySupport: true,
      whiteLabel: false,
      sso: false,
    },
  },
  growth: {
    competitors: 15,
    queriesPerDay: 200,
    promptsPerMonth: 1000,
    teamMembers: 10,
    dataRetentionDays: 365,
    features: {
      gscIntegration: true,
      dataExport: true,
      customReports: true,
      apiAccess: false,
      prioritySupport: true,
      whiteLabel: false,
      sso: false,
    },
  },
  enterprise: {
    competitors: -1, // Unlimited
    queriesPerDay: -1, // Unlimited
    promptsPerMonth: -1, // Unlimited
    teamMembers: -1, // Unlimited
    dataRetentionDays: -1, // Unlimited
    features: {
      gscIntegration: true,
      dataExport: true,
      customReports: true,
      apiAccess: true,
      prioritySupport: true,
      whiteLabel: true,
      sso: true,
    },
  },
};

/**
 * Get plan limits for a brand
 */
export function getPlanLimits(tier: string) {
  return PLAN_LIMITS[tier as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
}

/**
 * Check if a feature is available for a plan
 */
export function isFeatureAvailable(tier: string, feature: string): boolean {
  const limits = getPlanLimits(tier);
  return limits.features[feature as keyof typeof limits.features] || false;
}

/**
 * Get current usage for a brand
 */
async function getCurrentUsage(brandId: string) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get prompt runs for today and this month
  const promptRuns = await storage.getPromptRunsByBrand(brandId, 1000);

  const queriesToday = promptRuns.filter(
    run => run.createdAt && new Date(run.createdAt) >= todayStart
  ).length;

  const promptsThisMonth = promptRuns.filter(
    run => run.createdAt && new Date(run.createdAt) >= monthStart
  ).length;

  // Get competitor count
  const competitors = await storage.getCompetitorsByBrand(brandId);

  // Get team member count
  const teamMembers = await storage.getTeamMembersByBrand(brandId);

  return {
    competitors: competitors.length,
    queriesToday,
    promptsThisMonth,
    teamMembers: teamMembers.length || 1, // At least 1 (the owner)
  };
}

/**
 * Check if operation is within plan limits
 */
export async function checkPlanLimit(
  brandId: string,
  limitType: 'competitors' | 'queriesPerDay' | 'promptsPerMonth' | 'teamMembers'
): Promise<{ allowed: boolean; current: number; limit: number; message?: string }> {
  const brand = await storage.getBrand(brandId);
  if (!brand) {
    return {
      allowed: false,
      current: 0,
      limit: 0,
      message: 'Brand not found',
    };
  }

  const limits = getPlanLimits(brand.tier);
  const limit = limits[limitType];

  // Unlimited (-1) always allowed
  if (limit === -1) {
    return {
      allowed: true,
      current: 0,
      limit: -1,
    };
  }

  const usage = await getCurrentUsage(brandId);

  // Map limitType to usage property
  const usageMap: Record<string, number> = {
    'competitors': usage.competitors,
    'queriesPerDay': usage.queriesToday,
    'promptsPerMonth': usage.promptsThisMonth,
    'teamMembers': usage.teamMembers,
  };

  const current = usageMap[limitType] || 0;
  const allowed = current < limit;

  return {
    allowed,
    current,
    limit,
    message: allowed ? undefined : `Plan limit reached. Current: ${current}, Limit: ${limit}`,
  };
}

/**
 * Middleware to enforce plan limits
 */
export function enforcePlanLimit(
  limitType: 'competitors' | 'queriesPerDay' | 'promptsPerMonth' | 'teamMembers'
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const brandId = req.params.brandId || (req as any).user?.brandId;

      if (!brandId) {
        return res.status(400).json({ error: 'Brand ID required' });
      }

      const check = await checkPlanLimit(brandId, limitType);

      if (!check.allowed) {
        return res.status(403).json({
          error: 'Plan limit exceeded',
          message: check.message,
          current: check.current,
          limit: check.limit,
          upgradeRequired: true,
        });
      }

      next();
    } catch (error) {
      console.error('[Plan Enforcement] Error:', error);
      res.status(500).json({ error: 'Failed to check plan limits' });
    }
  };
}

/**
 * Middleware to enforce feature access
 */
export function enforceFeatureAccess(feature: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const brandId = req.params.brandId || (req as any).user?.brandId;

      if (!brandId) {
        return res.status(400).json({ error: 'Brand ID required' });
      }

      const brand = await storage.getBrand(brandId);
      if (!brand) {
        return res.status(404).json({ error: 'Brand not found' });
      }

      const hasAccess = isFeatureAvailable(brand.tier, feature);

      if (!hasAccess) {
        return res.status(403).json({
          error: 'Feature not available',
          message: `This feature is not available on your current plan (${brand.tier})`,
          feature,
          upgradeRequired: true,
        });
      }

      next();
    } catch (error) {
      console.error('[Feature Enforcement] Error:', error);
      res.status(500).json({ error: 'Failed to check feature access' });
    }
  };
}

/**
 * Middleware to check subscription status
 */
export async function enforceActiveSubscription(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const brandId = req.params.brandId || (req as any).user?.brandId;

    if (!brandId) {
      return res.status(400).json({ error: 'Brand ID required' });
    }

    const brand = await storage.getBrand(brandId);
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    // Free tier is always active
    if (brand.tier === 'free') {
      return next();
    }

    const subscription = await storage.getSubscriptionByBrandId(brandId);

    if (!subscription) {
      return res.status(403).json({
        error: 'No active subscription',
        message: 'Please subscribe to a plan to access this feature',
        upgradeRequired: true,
      });
    }

    // Check if subscription is active
    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      return res.status(403).json({
        error: 'Subscription not active',
        message: `Your subscription is ${subscription.status}. Please update your payment method.`,
        status: subscription.status,
      });
    }

    // Check if subscription has expired
    if (subscription.currentPeriodEnd < new Date()) {
      return res.status(403).json({
        error: 'Subscription expired',
        message: 'Your subscription has expired. Please renew to continue.',
        expiredAt: subscription.currentPeriodEnd,
      });
    }

    next();
  } catch (error) {
    console.error('[Subscription Enforcement] Error:', error);
    res.status(500).json({ error: 'Failed to check subscription status' });
  }
}

/**
 * Log usage for billing purposes
 * Note: Usage is tracked via promptRuns table, no separate logging needed
 */
export async function logUsage(
  brandId: string,
  type: string,
  amount: number = 1,
  metadata?: any
) {
  // Usage is automatically tracked via promptRuns table
  // No additional logging needed
}

/**
 * Middleware to log API usage
 * Note: Usage is tracked via promptRuns table, no separate logging needed
 */
export function logApiUsage(type: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Usage is automatically tracked via promptRuns table
    // No additional logging needed
    next();
  };
}
