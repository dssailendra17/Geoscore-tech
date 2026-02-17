/**
 * Razorpay Webhook Handler
 * 
 * Handles all Razorpay webhook events including:
 * - Payment success/failure
 * - Subscription creation/activation/cancellation
 * - Invoice generation
 * - Payment refunds
 */

import crypto from 'crypto';
import type { Request, Response } from 'express';
import { storage } from '../storage';

// Razorpay webhook event types
type RazorpayEvent = 
  | 'payment.captured'
  | 'payment.failed'
  | 'subscription.activated'
  | 'subscription.charged'
  | 'subscription.cancelled'
  | 'subscription.paused'
  | 'subscription.resumed'
  | 'subscription.pending'
  | 'subscription.halted'
  | 'invoice.paid'
  | 'refund.created';

interface RazorpayWebhookPayload {
  entity: string;
  account_id: string;
  event: RazorpayEvent;
  contains: string[];
  payload: {
    payment?: {
      entity: any;
    };
    subscription?: {
      entity: any;
    };
    invoice?: {
      entity: any;
    };
    refund?: {
      entity: any;
    };
  };
  created_at: number;
}

/**
 * Verify Razorpay webhook signature
 */
export function verifyRazorpaySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Handle payment captured event
 */
async function handlePaymentCaptured(payment: any) {
  console.log('[Razorpay] Payment captured:', payment.id);
  
  // Extract metadata
  const { brand_id, user_id, subscription_id } = payment.notes || {};
  
  if (!brand_id) {
    console.error('[Razorpay] No brand_id in payment notes');
    return;
  }

  // Update subscription payment status
  if (subscription_id) {
    const subscription = await storage.getSubscription(subscription_id);
    if (subscription) {
      await storage.updateSubscription(subscription_id, {
        status: 'active',
        currentPeriodEnd: new Date(payment.created_at * 1000 + 30 * 24 * 60 * 60 * 1000), // +30 days
      });
    }
  }

  // Log usage for billing
  await storage.createUsageLog({
    brandId: brand_id,
    type: 'payment',
    amount: payment.amount / 100, // Convert paise to rupees
    metadata: {
      razorpay_payment_id: payment.id,
      razorpay_order_id: payment.order_id,
      method: payment.method,
      email: payment.email,
      contact: payment.contact,
    },
    timestamp: new Date(payment.created_at * 1000),
  });

  console.log('[Razorpay] Payment processed successfully');
}

/**
 * Handle payment failed event
 */
async function handlePaymentFailed(payment: any) {
  console.log('[Razorpay] Payment failed:', payment.id);
  
  const { brand_id, subscription_id } = payment.notes || {};
  
  if (!brand_id) {
    console.error('[Razorpay] No brand_id in payment notes');
    return;
  }

  // Update subscription status to past_due
  if (subscription_id) {
    const subscription = await storage.getSubscription(subscription_id);
    if (subscription) {
      await storage.updateSubscription(subscription_id, {
        status: 'past_due',
      });
    }
  }

  // Log failed payment
  await storage.createUsageLog({
    brandId: brand_id,
    type: 'payment_failed',
    amount: payment.amount / 100,
    metadata: {
      razorpay_payment_id: payment.id,
      error_code: payment.error_code,
      error_description: payment.error_description,
    },
    timestamp: new Date(payment.created_at * 1000),
  });

  console.log('[Razorpay] Payment failure logged');
}

/**
 * Handle subscription activated event
 */
async function handleSubscriptionActivated(subscription: any) {
  console.log('[Razorpay] Subscription activated:', subscription.id);
  
  const { brand_id, plan_id } = subscription.notes || {};
  
  if (!brand_id || !plan_id) {
    console.error('[Razorpay] Missing brand_id or plan_id in subscription notes');
    return;
  }

  // Create or update subscription in our database
  const existingSubscription = await storage.getSubscriptionByBrandId(brand_id);
  
  if (existingSubscription) {
    await storage.updateSubscription(existingSubscription.id, {
      status: 'active',
      razorpaySubscriptionId: subscription.id,
      currentPeriodStart: new Date(subscription.current_start * 1000),
      currentPeriodEnd: new Date(subscription.current_end * 1000),
      cancelAtPeriodEnd: false,
    });
  } else {
    await storage.createSubscription({
      brandId: brand_id,
      planId: plan_id,
      status: 'active',
      razorpaySubscriptionId: subscription.id,
      currentPeriodStart: new Date(subscription.current_start * 1000),
      currentPeriodEnd: new Date(subscription.current_end * 1000),
      cancelAtPeriodEnd: false,
    });
  }

  // Update brand tier
  await storage.updateBrand(brand_id, {
    tier: plan_id,
    status: 'active',
  });

  console.log('[Razorpay] Subscription activated successfully');
}

/**
 * Handle subscription charged event
 */
async function handleSubscriptionCharged(subscription: any, payment: any) {
  console.log('[Razorpay] Subscription charged:', subscription.id);
  
  const { brand_id } = subscription.notes || {};
  
  if (!brand_id) {
    console.error('[Razorpay] No brand_id in subscription notes');
    return;
  }

  // Update subscription period
  const dbSubscription = await storage.getSubscriptionByBrandId(brand_id);
  if (dbSubscription) {
    await storage.updateSubscription(dbSubscription.id, {
      status: 'active',
      currentPeriodStart: new Date(subscription.current_start * 1000),
      currentPeriodEnd: new Date(subscription.current_end * 1000),
    });
  }

  // Create invoice
  await storage.createInvoice({
    brandId: brand_id,
    subscriptionId: dbSubscription?.id || '',
    amount: payment.amount / 100,
    status: 'paid',
    razorpayInvoiceId: payment.invoice_id,
    razorpayPaymentId: payment.id,
    paidAt: new Date(payment.created_at * 1000),
  });

  console.log('[Razorpay] Subscription charge processed');
}

/**
 * Handle subscription cancelled event
 */
async function handleSubscriptionCancelled(subscription: any) {
  console.log('[Razorpay] Subscription cancelled:', subscription.id);
  
  const { brand_id } = subscription.notes || {};
  
  if (!brand_id) {
    console.error('[Razorpay] No brand_id in subscription notes');
    return;
  }

  // Update subscription status
  const dbSubscription = await storage.getSubscriptionByBrandId(brand_id);
  if (dbSubscription) {
    await storage.updateSubscription(dbSubscription.id, {
      status: 'cancelled',
      cancelledAt: new Date(subscription.ended_at * 1000),
    });
  }

  // Downgrade brand to free tier
  await storage.updateBrand(brand_id, {
    tier: 'free',
    status: 'active',
  });

  console.log('[Razorpay] Subscription cancelled successfully');
}

/**
 * Handle subscription paused event
 */
async function handleSubscriptionPaused(subscription: any) {
  console.log('[Razorpay] Subscription paused:', subscription.id);
  
  const { brand_id } = subscription.notes || {};
  
  if (!brand_id) return;

  const dbSubscription = await storage.getSubscriptionByBrandId(brand_id);
  if (dbSubscription) {
    await storage.updateSubscription(dbSubscription.id, {
      status: 'paused',
    });
  }
}

/**
 * Handle subscription resumed event
 */
async function handleSubscriptionResumed(subscription: any) {
  console.log('[Razorpay] Subscription resumed:', subscription.id);
  
  const { brand_id } = subscription.notes || {};
  
  if (!brand_id) return;

  const dbSubscription = await storage.getSubscriptionByBrandId(brand_id);
  if (dbSubscription) {
    await storage.updateSubscription(dbSubscription.id, {
      status: 'active',
    });
  }
}

/**
 * Handle invoice paid event
 */
async function handleInvoicePaid(invoice: any) {
  console.log('[Razorpay] Invoice paid:', invoice.id);
  
  const { brand_id } = invoice.notes || {};
  
  if (!brand_id) return;

  // Update invoice status in database
  const dbInvoice = await storage.getInvoiceByRazorpayId(invoice.id);
  if (dbInvoice) {
    await storage.updateInvoice(dbInvoice.id, {
      status: 'paid',
      paidAt: new Date(invoice.paid_at * 1000),
    });
  }
}

/**
 * Handle refund created event
 */
async function handleRefundCreated(refund: any) {
  console.log('[Razorpay] Refund created:', refund.id);
  
  // Log refund for accounting
  await storage.createUsageLog({
    brandId: refund.notes?.brand_id || 'unknown',
    type: 'refund',
    amount: -(refund.amount / 100),
    metadata: {
      razorpay_refund_id: refund.id,
      razorpay_payment_id: refund.payment_id,
      reason: refund.notes?.reason,
    },
    timestamp: new Date(refund.created_at * 1000),
  });
}

/**
 * Main webhook handler
 */
export async function handleRazorpayWebhook(req: Request, res: Response) {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[Razorpay] RAZORPAY_WEBHOOK_SECRET not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    // Verify signature
    const payload = JSON.stringify(req.body);
    const isValid = verifyRazorpaySignature(payload, signature, webhookSecret);

    if (!isValid) {
      console.error('[Razorpay] Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const webhookData = req.body as RazorpayWebhookPayload;
    console.log('[Razorpay] Webhook event:', webhookData.event);

    // Handle different event types
    switch (webhookData.event) {
      case 'payment.captured':
        if (webhookData.payload.payment) {
          await handlePaymentCaptured(webhookData.payload.payment.entity);
        }
        break;

      case 'payment.failed':
        if (webhookData.payload.payment) {
          await handlePaymentFailed(webhookData.payload.payment.entity);
        }
        break;

      case 'subscription.activated':
        if (webhookData.payload.subscription) {
          await handleSubscriptionActivated(webhookData.payload.subscription.entity);
        }
        break;

      case 'subscription.charged':
        if (webhookData.payload.subscription && webhookData.payload.payment) {
          await handleSubscriptionCharged(
            webhookData.payload.subscription.entity,
            webhookData.payload.payment.entity
          );
        }
        break;

      case 'subscription.cancelled':
        if (webhookData.payload.subscription) {
          await handleSubscriptionCancelled(webhookData.payload.subscription.entity);
        }
        break;

      case 'subscription.paused':
        if (webhookData.payload.subscription) {
          await handleSubscriptionPaused(webhookData.payload.subscription.entity);
        }
        break;

      case 'subscription.resumed':
        if (webhookData.payload.subscription) {
          await handleSubscriptionResumed(webhookData.payload.subscription.entity);
        }
        break;

      case 'invoice.paid':
        if (webhookData.payload.invoice) {
          await handleInvoicePaid(webhookData.payload.invoice.entity);
        }
        break;

      case 'refund.created':
        if (webhookData.payload.refund) {
          await handleRefundCreated(webhookData.payload.refund.entity);
        }
        break;

      default:
        console.log('[Razorpay] Unhandled event type:', webhookData.event);
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('[Razorpay] Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}
