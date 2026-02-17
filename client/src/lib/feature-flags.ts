/**
 * Feature Flags and Plan Limits
 * 
 * Client-side feature flag system that checks plan limits
 * and controls feature access based on subscription tier.
 */

export type PlanTier = 'free' | 'starter' | 'growth' | 'enterprise';

export type FeatureKey = 
  | 'gscIntegration'
  | 'dataExport'
  | 'customReports'
  | 'apiAccess'
  | 'prioritySupport'
  | 'whiteLabel'
  | 'sso';

export type LimitKey = 
  | 'competitors'
  | 'queriesPerDay'
  | 'promptsPerMonth'
  | 'teamMembers'
  | 'dataRetentionDays';

interface PlanFeatures {
  gscIntegration: boolean;
  dataExport: boolean;
  customReports: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  whiteLabel: boolean;
  sso: boolean;
}

interface PlanLimitConfig {
  competitors: number;
  queriesPerDay: number;
  promptsPerMonth: number;
  teamMembers: number;
  dataRetentionDays: number;
  features: PlanFeatures;
}

// Client-side plan limits (matching server)
export const PLAN_LIMITS: Record<PlanTier, PlanLimitConfig> = {
  free: {
    competitors: 3,
    queriesPerDay: 15,
    promptsPerMonth: 50,
    teamMembers: 1,
    dataRetentionDays: 7,
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
    dataRetentionDays: 30,
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
    dataRetentionDays: 90,
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
    queriesPerDay: -1,
    promptsPerMonth: -1,
    teamMembers: -1,
    dataRetentionDays: 365,
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
 * Check if a feature is available for a plan tier
 */
export function isFeatureAvailable(tier: PlanTier, feature: FeatureKey): boolean {
  const limits = PLAN_LIMITS[tier];
  if (!limits) return false;
  
  return limits.features[feature] || false;
}

/**
 * Get plan limits for a tier
 */
export function getPlanLimits(tier: PlanTier) {
  return PLAN_LIMITS[tier] || PLAN_LIMITS.free;
}

/**
 * Get specific limit value
 */
export function getLimit(tier: PlanTier, limitKey: LimitKey): number {
  const limits = getPlanLimits(tier);
  return limits[limitKey];
}

/**
 * Check if limit is unlimited (-1)
 */
export function isUnlimited(tier: PlanTier, limitKey: LimitKey): boolean {
  return getLimit(tier, limitKey) === -1;
}

/**
 * Check if usage is within limit
 */
export function isWithinLimit(tier: PlanTier, limitKey: LimitKey, current: number): boolean {
  const limit = getLimit(tier, limitKey);
  if (limit === -1) return true; // Unlimited
  return current < limit;
}

/**
 * Get usage percentage
 */
export function getUsagePercentage(tier: PlanTier, limitKey: LimitKey, current: number): number {
  const limit = getLimit(tier, limitKey);
  if (limit === -1) return 0; // Unlimited
  return Math.min(100, Math.round((current / limit) * 100));
}

/**
 * Get remaining count
 */
export function getRemaining(tier: PlanTier, limitKey: LimitKey, current: number): number {
  const limit = getLimit(tier, limitKey);
  if (limit === -1) return Infinity; // Unlimited
  return Math.max(0, limit - current);
}

/**
 * Get upgrade message for locked feature
 */
export function getUpgradeMessage(feature: FeatureKey): string {
  const messages: Record<FeatureKey, string> = {
    gscIntegration: 'Upgrade to Starter or higher to connect Google Search Console',
    dataExport: 'Upgrade to Growth or higher to export your data',
    customReports: 'Upgrade to Growth or higher to create custom reports',
    apiAccess: 'Upgrade to Enterprise for API access',
    prioritySupport: 'Upgrade to Starter or higher for priority support',
    whiteLabel: 'Upgrade to Enterprise for white-label branding',
    sso: 'Upgrade to Enterprise for SSO/SAML authentication',
  };
  
  return messages[feature] || 'Upgrade your plan to access this feature';
}

/**
 * Get limit reached message
 */
export function getLimitReachedMessage(limitKey: LimitKey, tier: PlanTier): string {
  const limit = getLimit(tier, limitKey);
  
  const messages: Record<LimitKey, string> = {
    competitors: `You've reached your limit of ${limit} competitors. Upgrade to track more.`,
    queriesPerDay: `You've reached your daily limit of ${limit} queries. Upgrade for more.`,
    promptsPerMonth: `You've reached your monthly limit of ${limit} prompts. Upgrade for more.`,
    teamMembers: `You've reached your limit of ${limit} team members. Upgrade to add more.`,
    dataRetentionDays: `Your data retention is limited to ${limit} days. Upgrade for longer retention.`,
  };
  
  return messages[limitKey] || `You've reached your plan limit. Upgrade for more.`;
}

/**
 * Get recommended plan for feature
 */
export function getRecommendedPlan(feature: FeatureKey): PlanTier {
  // Check which is the lowest tier that has this feature
  const tiers: PlanTier[] = ['starter', 'growth', 'enterprise'];
  
  for (const tier of tiers) {
    if (isFeatureAvailable(tier, feature)) {
      return tier;
    }
  }
  
  return 'enterprise';
}

/**
 * Get all available features for a tier
 */
export function getAvailableFeatures(tier: PlanTier): FeatureKey[] {
  const limits = getPlanLimits(tier);
  const features: FeatureKey[] = [];
  
  for (const [key, value] of Object.entries(limits.features)) {
    if (value) {
      features.push(key as FeatureKey);
    }
  }
  
  return features;
}

/**
 * Get all locked features for a tier
 */
export function getLockedFeatures(tier: PlanTier): FeatureKey[] {
  const allFeatures: FeatureKey[] = [
    'gscIntegration',
    'dataExport',
    'customReports',
    'apiAccess',
    'prioritySupport',
    'whiteLabel',
    'sso',
  ];
  
  return allFeatures.filter(feature => !isFeatureAvailable(tier, feature));
}

/**
 * Format limit display
 */
export function formatLimit(tier: PlanTier, limitKey: LimitKey): string {
  const limit = getLimit(tier, limitKey);
  
  if (limit === -1) {
    return 'Unlimited';
  }
  
  if (limitKey === 'dataRetentionDays') {
    return `${limit} days`;
  }
  
  return limit.toString();
}

/**
 * Get plan comparison data
 */
export function getPlanComparison() {
  const tiers: PlanTier[] = ['free', 'starter', 'growth', 'enterprise'];
  
  return tiers.map(tier => ({
    tier,
    limits: getPlanLimits(tier),
    features: getAvailableFeatures(tier),
    lockedFeatures: getLockedFeatures(tier),
  }));
}
