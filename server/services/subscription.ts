/**
 * Subscription Management Service
 * 
 * Handles subscription lifecycle including:
 * - Creating subscriptions (both Razorpay and internal)
 * - Upgrading/downgrading plans
 * - Cancellations and pauses
 * - Prorated billing calculations
 * - Trial period management
 */

import Razorpay from 'razorpay';
import { storage } from '../storage';
import type { Subscription, Brand } from '@shared/schema';

// Initialize Razorpay client
let razorpayClient: Razorpay | null = null;

export function initializeRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.warn('[Razorpay] API keys not configured, subscription features will be disabled');
    return;
  }

  razorpayClient = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  console.log('[Razorpay] Client initialized successfully');
}

export function getRazorpayClient(): Razorpay {
  if (!razorpayClient) {
    throw new Error('Razorpay client not initialized');
  }
  return razorpayClient;
}

// Plan pricing in INR (paise)
const PLAN_PRICING = {
  free: 0,
  starter: 3000, // ₹30
  growth: 10000, // ₹100
  enterprise: 100000, // ₹1000
};

// Plan intervals
const PLAN_INTERVALS = {
  free: 'monthly',
  starter: 'monthly',
  growth: 'monthly',
  enterprise: 'monthly',
};

/**
 * Create a Razorpay subscription plan if it doesn't exist
 */
async function ensureRazorpayPlan(planId: string): Promise<string> {
  const client = getRazorpayClient();
  
  // Check if plan already exists (you should cache this)
  const planName = `geoscore_${planId}`;
  const amount = PLAN_PRICING[planId as keyof typeof PLAN_PRICING];
  const interval = PLAN_INTERVALS[planId as keyof typeof PLAN_INTERVALS];

  try {
    // Create plan in Razorpay
    const plan = await client.plans.create({
      period: interval,
      interval: 1,
      item: {
        name: `GeoScore ${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
        amount: amount,
        currency: 'INR',
        description: `GeoScore ${planId} subscription`,
      },
      notes: {
        plan_id: planId,
      },
    });

    console.log(`[Razorpay] Created plan: ${plan.id}`);
    return plan.id;
  } catch (error: any) {
    // Plan might already exist, return a cached ID or handle error
    console.error('[Razorpay] Error creating plan:', error.message);
    throw error;
  }
}

/**
 * Create a new subscription (dual-layer: Razorpay + internal)
 */
export async function createSubscription(params: {
  brandId: string;
  planId: string;
  userId: string;
  customerEmail: string;
  customerPhone: string;
  startTrial?: boolean;
}): Promise<{ subscriptionId: string; razorpaySubscriptionId: string }> {
  const { brandId, planId, userId, customerEmail, customerPhone, startTrial } = params;

  // Free plan doesn't need Razorpay subscription
  if (planId === 'free') {
    const subscription = await storage.createSubscription({
      brandId,
      planId,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      cancelAtPeriodEnd: false,
    });

    await storage.updateBrand(brandId, {
      tier: 'free',
      status: 'active',
    });

    return {
      subscriptionId: subscription.id,
      razorpaySubscriptionId: 'free_plan',
    };
  }

  const client = getRazorpayClient();

  // Ensure Razorpay plan exists
  const razorpayPlanId = await ensureRazorpayPlan(planId);

  // Create Razorpay subscription
  const razorpaySubscription = await client.subscriptions.create({
    plan_id: razorpayPlanId,
    customer_notify: 1,
    quantity: 1,
    total_count: 12, // 12 months
    start_at: startTrial 
      ? Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // Start after 7 days trial
      : Math.floor(Date.now() / 1000),
    notes: {
      brand_id: brandId,
      user_id: userId,
      plan_id: planId,
    },
    notify_info: {
      notify_email: customerEmail,
      notify_phone: customerPhone,
    },
  });

  // Create internal subscription record
  const subscription = await storage.createSubscription({
    brandId,
    planId,
    status: startTrial ? 'trialing' : 'active',
    razorpaySubscriptionId: razorpaySubscription.id,
    currentPeriodStart: new Date(razorpaySubscription.start_at * 1000),
    currentPeriodEnd: new Date(razorpaySubscription.end_at * 1000),
    trialEnd: startTrial ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined,
    cancelAtPeriodEnd: false,
  });

  // Update brand tier
  await storage.updateBrand(brandId, {
    tier: planId as any,
    status: 'active',
  });

  console.log(`[Subscription] Created for brand ${brandId}: ${subscription.id}`);

  return {
    subscriptionId: subscription.id,
    razorpaySubscriptionId: razorpaySubscription.id,
  };
}

/**
 * Calculate prorated amount for plan changes
 */
function calculateProratedAmount(
  currentPlan: string,
  newPlan: string,
  daysRemaining: number,
  totalDays: number
): number {
  const currentAmount = PLAN_PRICING[currentPlan as keyof typeof PLAN_PRICING];
  const newAmount = PLAN_PRICING[newPlan as keyof typeof PLAN_PRICING];

  // Calculate unused amount from current plan
  const unusedAmount = (currentAmount * daysRemaining) / totalDays;

  // Calculate prorated amount for new plan
  const proratedNewAmount = (newAmount * daysRemaining) / totalDays;

  // Return the difference (can be negative for downgrades)
  return proratedNewAmount - unusedAmount;
}

/**
 * Upgrade or downgrade a subscription
 */
export async function changeSubscriptionPlan(params: {
  brandId: string;
  newPlanId: string;
  immediate?: boolean;
}): Promise<{ subscription: Subscription; proratedAmount?: number }> {
  const { brandId, newPlanId, immediate = true } = params;

  // Get current subscription
  const currentSubscription = await storage.getSubscriptionByBrandId(brandId);
  if (!currentSubscription) {
    throw new Error('No active subscription found');
  }

  const currentPlanId = currentSubscription.planId;

  // If downgrading to free, cancel Razorpay subscription
  if (newPlanId === 'free') {
    if (currentSubscription.razorpaySubscriptionId && currentSubscription.razorpaySubscriptionId !== 'free_plan') {
      const client = getRazorpayClient();
      await client.subscriptions.cancel(currentSubscription.razorpaySubscriptionId, {
        cancel_at_cycle_end: !immediate ? 1 : 0,
      });
    }

    await storage.updateSubscription(currentSubscription.id, {
      planId: 'free',
      status: immediate ? 'cancelled' : 'active',
      cancelAtPeriodEnd: !immediate,
      cancelledAt: immediate ? new Date() : undefined,
    });

    if (immediate) {
      await storage.updateBrand(brandId, {
        tier: 'free',
      });
    }

    return { subscription: currentSubscription };
  }

  // Calculate prorated amount
  const now = new Date();
  const periodEnd = currentSubscription.currentPeriodEnd;
  const periodStart = currentSubscription.currentPeriodStart;
  const daysRemaining = Math.ceil((periodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  const totalDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (24 * 60 * 60 * 1000));

  const proratedAmount = calculateProratedAmount(currentPlanId, newPlanId, daysRemaining, totalDays);

  if (immediate) {
    // Cancel old Razorpay subscription
    if (currentSubscription.razorpaySubscriptionId && currentSubscription.razorpaySubscriptionId !== 'free_plan') {
      const client = getRazorpayClient();
      await client.subscriptions.cancel(currentSubscription.razorpaySubscriptionId, {
        cancel_at_cycle_end: 0,
      });
    }

    // Create new subscription
    const brand = await storage.getBrand(brandId);
    if (!brand) throw new Error('Brand not found');

    const { subscriptionId, razorpaySubscriptionId } = await createSubscription({
      brandId,
      planId: newPlanId,
      userId: brand.userId,
      customerEmail: brand.domain, // You should have actual email
      customerPhone: '+919999999999', // You should have actual phone
    });

    const newSubscription = await storage.getSubscription(subscriptionId);
    if (!newSubscription) throw new Error('Failed to create subscription');

    return {
      subscription: newSubscription,
      proratedAmount: proratedAmount / 100, // Convert paise to rupees
    };
  } else {
    // Schedule change at period end
    await storage.updateSubscription(currentSubscription.id, {
      cancelAtPeriodEnd: true,
    });

    return { subscription: currentSubscription };
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(params: {
  brandId: string;
  immediate?: boolean;
  reason?: string;
}): Promise<Subscription> {
  const { brandId, immediate = false, reason } = params;

  const subscription = await storage.getSubscriptionByBrandId(brandId);
  if (!subscription) {
    throw new Error('No active subscription found');
  }

  // Cancel in Razorpay
  if (subscription.razorpaySubscriptionId && subscription.razorpaySubscriptionId !== 'free_plan') {
    const client = getRazorpayClient();
    await client.subscriptions.cancel(subscription.razorpaySubscriptionId, {
      cancel_at_cycle_end: immediate ? 0 : 1,
    });
  }

  // Update internal subscription
  await storage.updateSubscription(subscription.id, {
    status: immediate ? 'cancelled' : 'active',
    cancelAtPeriodEnd: !immediate,
    cancelledAt: immediate ? new Date() : undefined,
  });

  // If immediate, downgrade to free
  if (immediate) {
    await storage.updateBrand(brandId, {
      tier: 'free',
    });
  }

  // Log cancellation reason
  await storage.createUsageLog({
    brandId,
    type: 'subscription_cancelled',
    amount: 0,
    metadata: {
      reason,
      immediate,
    },
    timestamp: new Date(),
  });

  console.log(`[Subscription] Cancelled for brand ${brandId}`);

  return subscription;
}

/**
 * Pause a subscription
 */
export async function pauseSubscription(brandId: string): Promise<Subscription> {
  const subscription = await storage.getSubscriptionByBrandId(brandId);
  if (!subscription) {
    throw new Error('No active subscription found');
  }

  if (subscription.razorpaySubscriptionId && subscription.razorpaySubscriptionId !== 'free_plan') {
    const client = getRazorpayClient();
    await client.subscriptions.pause(subscription.razorpaySubscriptionId, {
      pause_at: 'now',
    });
  }

  await storage.updateSubscription(subscription.id, {
    status: 'paused',
  });

  return subscription;
}

/**
 * Resume a paused subscription
 */
export async function resumeSubscription(brandId: string): Promise<Subscription> {
  const subscription = await storage.getSubscriptionByBrandId(brandId);
  if (!subscription) {
    throw new Error('No active subscription found');
  }

  if (subscription.razorpaySubscriptionId && subscription.razorpaySubscriptionId !== 'free_plan') {
    const client = getRazorpayClient();
    await client.subscriptions.resume(subscription.razorpaySubscriptionId, {
      resume_at: 'now',
    });
  }

  await storage.updateSubscription(subscription.id, {
    status: 'active',
  });

  return subscription;
}

/**
 * Get subscription details with Razorpay sync
 */
export async function getSubscriptionDetails(brandId: string): Promise<{
  internal: Subscription | null;
  razorpay: any | null;
  inSync: boolean;
}> {
  const internal = await storage.getSubscriptionByBrandId(brandId);
  
  if (!internal || !internal.razorpaySubscriptionId || internal.razorpaySubscriptionId === 'free_plan') {
    return {
      internal,
      razorpay: null,
      inSync: true,
    };
  }

  try {
    const client = getRazorpayClient();
    const razorpay = await client.subscriptions.fetch(internal.razorpaySubscriptionId);

    // Check if in sync
    const inSync = internal.status === razorpay.status;

    return {
      internal,
      razorpay,
      inSync,
    };
  } catch (error) {
    console.error('[Subscription] Error fetching Razorpay subscription:', error);
    return {
      internal,
      razorpay: null,
      inSync: false,
    };
  }
}

/**
 * Sync subscription status from Razorpay
 */
export async function syncSubscriptionStatus(brandId: string): Promise<void> {
  const { internal, razorpay, inSync } = await getSubscriptionDetails(brandId);

  if (!internal || !razorpay || inSync) {
    return;
  }

  // Update internal subscription to match Razorpay
  await storage.updateSubscription(internal.id, {
    status: razorpay.status,
    currentPeriodStart: new Date(razorpay.current_start * 1000),
    currentPeriodEnd: new Date(razorpay.current_end * 1000),
  });

  console.log(`[Subscription] Synced status for brand ${brandId}: ${razorpay.status}`);
}
