// AXP Publish Worker - Publishes Answer Experience Pages

import type { QueuedJob } from '../queue';
import { storage } from '../../storage';

export interface AxpPublishPayload {
  brandId: string;
  axpContentId: string;
  publishTo?: 'staging' | 'production';
}

export async function axpPublishWorker(job: QueuedJob): Promise<any> {
  const payload = job.payload as AxpPublishPayload;
  const { brandId, axpContentId, publishTo = 'production' } = payload;

  console.log(`[AxpPublish] Publishing AXP content ${axpContentId} to ${publishTo}`);

  // Get AXP content
  const axpContent = await storage.getAxpContent(axpContentId);
  if (!axpContent) {
    throw new Error(`AXP content ${axpContentId} not found`);
  }

  // Validate content is ready for publishing
  if (axpContent.status !== 'ready') {
    throw new Error(`AXP content ${axpContentId} is not ready for publishing (status: ${axpContent.status})`);
  }

  try {
    // Generate static HTML
    const html = generateAxpHtml(axpContent);

    // Generate metadata for logging
    const publishMetadata = {
      title: axpContent.title,
      description: axpContent.title,
      author: 'GeoScore AI',
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // In a real implementation, this would:
    // 1. Upload to CDN/hosting service
    // 2. Update DNS/routing
    // 3. Invalidate caches
    // 4. Send webhooks
    
    // For now, we'll simulate the publish
    const publishUrl = `https://axp.geoscore.ai/${brandId}/${axpContent.slug}`;

    // Update AXP content status
    await storage.updateAxpContent(axpContentId, {
      status: 'published',
      publishedAt: new Date(),
    });

    console.log(`[AxpPublish] Successfully published AXP content to ${publishUrl}`);

    return {
      brandId,
      axpContentId,
      publishUrl,
      publishTo,
      success: true,
      metadata: publishMetadata,
    };

  } catch (error: any) {
    console.error(`[AxpPublish] Error publishing AXP content:`, error.message);

    // Update status to failed
    await storage.updateAxpContent(axpContentId, {
      status: 'draft',
    });

    throw error;
  }
}

/**
 * Generate static HTML for AXP content
 */
function generateAxpHtml(axpContent: any): string {
  const { title, content, contentHtml } = axpContent;
  const summary = title; // Use title as summary fallback
  const keywords: string[] = [];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(summary)}">
  <meta name="keywords" content="${keywords.join(', ')}">
  <meta name="author" content="GeoScore AI">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(summary)}">
  <meta property="og:type" content="article">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(summary)}">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    h1 {
      font-size: 2.5em;
      margin-bottom: 0.5em;
      color: #1a1a1a;
    }
    .summary {
      font-size: 1.2em;
      color: #666;
      margin-bottom: 2em;
      padding: 1em;
      background: #f5f5f5;
      border-left: 4px solid #4a90e2;
    }
    .content {
      font-size: 1.1em;
    }
    .metadata {
      margin-top: 3em;
      padding-top: 2em;
      border-top: 1px solid #ddd;
      font-size: 0.9em;
      color: #666;
    }
  </style>
</head>
<body>
  <article>
    <h1>${escapeHtml(title)}</h1>
    <div class="content">
      ${contentHtml || content || ''}
    </div>
    <div class="metadata">
      <p>Published by GeoScore AI</p>
    </div>
  </article>
</body>
</html>`;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
