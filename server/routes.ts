import type { Express, Request, Response } from "express";
import { type Server } from "http";
import { requireAuth, requireAdmin } from "./auth-middleware";
import authRoutes from "./auth-routes";
import { storage } from "./storage";
import { z } from "zod";
import {
  apiLimiter,
  authLimiter,
  webhookLimiter,
  adminLimiter,
  jobLimiter,
  exportLimiter
} from "./middleware/rate-limit";
import { enforcePlanLimit } from "./middleware/plan-enforcement";
import { logAudit } from "./lib/logger";
import { 
  insertBrandSchema, 
  insertCompetitorSchema, 
  insertTopicSchema,
  insertPromptSchema,
  insertSourceSchema,
  insertIntegrationSchema,
  insertPlanCapabilitySchema,
  insertPromptTemplateSchema,
  insertTeamMemberSchema,
  insertJobSchema,
  insertAnalysisScheduleSchema,
  insertAxpContentSchema,
} from "@shared/schema";

// Helper to create audit log
async function createAuditLog(req: Request, action: string, entityType: string, entityId: string, oldValue?: any, newValue?: any) {
  try {
    const forwardedFor = req.headers['x-forwarded-for'];
    const ipAddress = req.ip || (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor) || null;
    
    await storage.createAuditLog({
      userId: (req as any).userId,
      brandId: req.params.brandId || null,
      action,
      entityType,
      entityId,
      oldValue,
      newValue,
      ipAddress,
      userAgent: req.headers['user-agent'],
    });

    // Also log to Winston for monitoring
    logAudit(action, (req as any).userId, {
      entityType,
      entityId,
      brandId: req.params.brandId,
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  const getUserId = (req: any): string => req.userId;

  // ============= AUTH ROUTES =============
  app.use('/api/auth', authRoutes);

  // ============= USER ROUTES =============

  // Apply general API rate limiting to all /api routes
  app.use('/api', apiLimiter);

  app.post("/api/users/sync", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { firstName, lastName, profileImageUrl } = req.body;
      
      const existingUser = await storage.getUser(userId);
      
      if (existingUser) {
        const updated = await storage.updateUser(userId, {
          firstName,
          lastName,
          profileImageUrl,
        });
        return res.json(updated);
      }
      
      return res.status(404).json({ message: "User not found" });
    } catch (error: any) {
      console.error("User sync error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/users/me", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/users/me", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const updated = await storage.updateUser(userId, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ============= SESSION MANAGEMENT ROUTES =============

  app.get("/api/sessions", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const sessions = await storage.getUserSessions(userId);

      // Get current session token from cookie
      const currentSessionToken = req.cookies?.session_token;

      // Parse user agent and format sessions for frontend
      const formattedSessions = sessions.map(session => {
        const deviceInfo = session.deviceInfo as any || {};
        const userAgent = session.userAgent || '';

        // Simple user agent parsing
        let browser = 'Unknown Browser';
        let os = 'Unknown OS';
        let deviceType = 'desktop';

        if (userAgent.includes('Chrome')) browser = 'Chrome';
        else if (userAgent.includes('Safari')) browser = 'Safari';
        else if (userAgent.includes('Firefox')) browser = 'Firefox';
        else if (userAgent.includes('Edge')) browser = 'Edge';

        if (userAgent.includes('Windows')) os = 'Windows';
        else if (userAgent.includes('Mac')) os = 'macOS';
        else if (userAgent.includes('Linux')) os = 'Linux';
        else if (userAgent.includes('Android')) { os = 'Android'; deviceType = 'mobile'; }
        else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
          os = 'iOS';
          deviceType = 'mobile';
        }

        // Format last activity
        const lastActivity = session.lastActivity;
        const now = new Date();
        const diffMs = now.getTime() - lastActivity.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        let lastActiveText = 'Just now';
        if (diffMins < 5) lastActiveText = 'Just now';
        else if (diffMins < 60) lastActiveText = `${diffMins} minutes ago`;
        else if (diffHours < 24) lastActiveText = `${diffHours} hours ago`;
        else lastActiveText = `${diffDays} days ago`;

        const isCurrent = session.sessionToken === currentSessionToken;
        if (isCurrent) lastActiveText = 'Current session';

        return {
          id: session.sessionToken,
          name: `${browser} on ${os}`,
          browser,
          os,
          deviceType,
          ip: session.ipAddress || 'Unknown',
          lastActive: lastActiveText,
          lastActivityDate: lastActivity,
          current: isCurrent,
          sessionToken: session.sessionToken,
        };
      });

      // Sort: current session first, then by last activity
      formattedSessions.sort((a, b) => {
        if (a.current) return -1;
        if (b.current) return 1;
        return b.lastActivityDate.getTime() - a.lastActivityDate.getTime();
      });

      res.json(formattedSessions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/sessions/:sessionToken", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { sessionToken } = req.params;

      // Verify the session belongs to the user
      const session = await storage.getSession(sessionToken);
      if (!session || session.userId !== userId) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Don't allow revoking current session via this endpoint
      const currentSessionToken = req.cookies?.session_token;
      if (sessionToken === currentSessionToken) {
        return res.status(400).json({ message: "Cannot revoke current session. Use logout instead." });
      }

      await storage.revokeSession(sessionToken, 'User revoked from settings');
      await createAuditLog(req, 'revoke', 'session', sessionToken);

      res.json({ message: "Session revoked successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============= PLAN CAPABILITIES ROUTES =============
  
  app.get("/api/plans", async (req, res) => {
    try {
      const plans = await storage.getAllPlanCapabilities();
      res.json(plans);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/plans/:planId", async (req, res) => {
    try {
      const plan = await storage.getPlanCapability(req.params.planId);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }
      res.json(plan);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============= BRAND ROUTES =============
  
  app.get("/api/brands", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brands = await storage.getBrandsByUserId(userId);
      res.json(brands);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/brands/:brandId", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }
      
      res.json(brand);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/brands", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const data = insertBrandSchema.parse({ ...req.body, userId });
      const brand = await storage.createBrand(data);
      await createAuditLog(req, "create", "brand", brand.id, null, brand);
      res.json(brand);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/brands/:brandId", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const oldBrand = await storage.getBrand(req.params.brandId);
      
      if (!oldBrand || oldBrand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const updated = await storage.updateBrand(req.params.brandId, req.body);
      await createAuditLog(req, "update", "brand", req.params.brandId, oldBrand, updated);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ============= BRAND LOOKUP (brand.dev) =============

  app.post("/api/brand-lookup", requireAuth, async (req: any, res) => {
    try {
      const { domain } = req.body;
      if (!domain) {
        return res.status(400).json({ message: "Domain is required" });
      }

      let brandInfo: any = {
        domain,
        name: domain.replace(/\..+$/, "").charAt(0).toUpperCase() + domain.replace(/\..+$/, "").slice(1),
        brandDevData: null
      };

      if (process.env.BRAND_DEV_API_KEY) {
        try {
          const { BrandDevClient } = await import('./integrations/enrichment/brand-dev');
          const client = new BrandDevClient(process.env.BRAND_DEV_API_KEY);
          const data = await client.getBrandInfo(domain);
          if (data && data.brand) {
            // Return full Brand.dev response
            brandInfo = {
              domain: data.brand.domain || domain,
              name: data.brand.title || brandInfo.name,
              description: data.brand.description || "",
              slogan: data.brand.slogan || "",
              logo: data.brand.logos?.[0]?.url || "",
              industry: data.brand.industries?.eic?.[0]?.industry || "",
              subindustry: data.brand.industries?.eic?.[0]?.subindustry || "",
              city: data.brand.address?.city || "",
              state: data.brand.address?.state_province || "",
              country: data.brand.address?.country || "",
              linkedinUrl: data.brand.socials?.find((s: any) => s.type === 'linkedin')?.url || "",
              brandDevData: data, // Store full response
            };
          }
        } catch (err: any) {
          console.warn("brand.dev lookup failed, using fallback:", err.message);
        }
      }

      res.json(brandInfo);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============= BRAND ENRICHMENT (Background) =============

  app.post("/api/brands/:brandId/enrich", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);

      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      // Check if enrichment is needed (missing fields)
      const needsEnrichment = !brand.industry || !brand.description || !brand.logo ||
                              !brand.city || !brand.state || !brand.country;

      if (!needsEnrichment) {
        return res.json({
          message: "Brand already has complete information",
          brand
        });
      }

      // Trigger Brand.dev enrichment
      if (process.env.BRAND_DEV_API_KEY) {
        try {
          const { BrandDevClient } = await import('./integrations/enrichment/brand-dev');
          const client = new BrandDevClient(process.env.BRAND_DEV_API_KEY);
          const data = await client.getBrandInfo(brand.domain);

          if (data && data.brand) {
            // Update brand with enriched data (only fill missing fields)
            const updates: any = {};
            if (!brand.description && data.brand.description) updates.description = data.brand.description;
            if (!brand.slogan && data.brand.slogan) updates.slogan = data.brand.slogan;
            if (!brand.logo && data.brand.logos?.[0]?.url) updates.logo = data.brand.logos[0].url;
            if (!brand.industry && data.brand.industries?.eic?.[0]?.industry) updates.industry = data.brand.industries.eic[0].industry;
            if (!brand.subindustry && data.brand.industries?.eic?.[0]?.subindustry) updates.subindustry = data.brand.industries.eic[0].subindustry;
            if (!brand.city && data.brand.address?.city) updates.city = data.brand.address.city;
            if (!brand.state && data.brand.address?.state_province) updates.state = data.brand.address.state_province;
            if (!brand.country && data.brand.address?.country) updates.country = data.brand.address.country;
            if (!brand.linkedinUrl && data.brand.socials?.find((s: any) => s.type === 'linkedin')?.url) {
              updates.linkedinUrl = data.brand.socials.find((s: any) => s.type === 'linkedin').url;
            }
            if (!brand.brandDevData) updates.brandDevData = data;

            if (Object.keys(updates).length > 0) {
              const enrichedBrand = await storage.updateBrand(brand.id, updates);
              return res.json({
                message: "Brand enriched successfully",
                brand: enrichedBrand,
                fieldsUpdated: Object.keys(updates)
              });
            }
          }
        } catch (err: any) {
          console.error("Brand enrichment failed:", err.message);
          return res.status(500).json({ message: "Brand enrichment failed: " + err.message });
        }
      }

      res.json({ message: "No enrichment data available", brand });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============= AI TOPIC GENERATION (OpenRouter) =============

  app.post("/api/brands/:brandId/generate-topics", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const { competitors } = req.body;
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        return res.status(503).json({ message: "OpenRouter API key not configured" });
      }

      const competitorNames = (competitors || []).map((c: any) => c.name || c.domain).join(", ");

      const prompt = `You are an AI visibility strategist. Generate exactly 10 topic clusters for tracking brand visibility across AI search engines.

Brand: ${brand.name}
Domain: ${brand.domain}
Industry: ${brand.industry || "Technology"}
Description: ${brand.description || ""}
Competitors: ${competitorNames || "N/A"}

Generate 10 specific, actionable topic clusters that are relevant to this brand's industry and competitive landscape. Each topic should be a concise phrase (2-5 words) that represents a category of queries users might ask AI assistants about.

Return ONLY a JSON array of strings, no other text. Example: ["Enterprise AI Solutions", "Cloud Security", "API Management"]`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://geoscore.com',
          'X-Title': 'GeoScore',
        },
        body: JSON.stringify({
          model: 'openai/gpt-4.1-nano',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`OpenRouter API error: ${err.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "[]";

      let topics: string[];
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        topics = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      } catch {
        topics = content.split('\n').filter((l: string) => l.trim()).map((l: string) => l.replace(/^[\d\.\-\*]+\s*/, '').trim()).filter((l: string) => l.length > 0 && l.length < 60).slice(0, 10);
      }

      res.json({ topics: topics.slice(0, 10) });
    } catch (error: any) {
      console.error("Topic generation error:", error.message);
      res.status(500).json({ message: error.message });
    }
  });

  // ============= AI QUERY GENERATION (OpenRouter) =============

  app.post("/api/brands/:brandId/generate-queries", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const { competitors, topics } = req.body;
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        return res.status(503).json({ message: "OpenRouter API key not configured" });
      }

      const competitorNames = (competitors || []).map((c: any) => c.name || c.domain).join(", ");
      const topicList = (topics || []).join(", ");

      const prompt = `You are an AI visibility strategist. Generate exactly 15 search queries that users would type into AI assistants (ChatGPT, Claude, Gemini, Perplexity) when researching this brand's industry.

Brand: ${brand.name}
Domain: ${brand.domain}
Industry: ${brand.industry || "Technology"}
Description: ${brand.description || ""}
Competitors: ${competitorNames || "N/A"}
Selected Topics: ${topicList || "N/A"}

Generate 15 realistic, natural language queries that match how people actually ask AI assistants questions. Include a mix of:
- Comparison queries ("Best X vs Y")
- Discovery queries ("Top tools for Z")
- Evaluation queries ("Is X good for Y?")
- How-to queries ("How to choose a Z provider")

Return ONLY a JSON array of strings, no other text. Example: ["Best enterprise AI platforms 2025", "How to choose a cloud provider"]`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://geoscore.com',
          'X-Title': 'GeoScore',
        },
        body: JSON.stringify({
          model: 'openai/gpt-4.1-nano',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
          max_tokens: 800,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`OpenRouter API error: ${err.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "[]";

      let queries: string[];
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        queries = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      } catch {
        queries = content.split('\n').filter((l: string) => l.trim()).map((l: string) => l.replace(/^[\d\.\-\*]+\s*/, '').trim()).filter((l: string) => l.length > 0 && l.length < 120).slice(0, 15);
      }

      res.json({ queries: queries.slice(0, 15) });
    } catch (error: any) {
      console.error("Query generation error:", error.message);
      res.status(500).json({ message: error.message });
    }
  });

  // ============= TEAM MEMBER ROUTES =============

  app.get("/api/brands/:brandId/team", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const members = await storage.getTeamMembersByBrand(req.params.brandId);
      res.json(members);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/brands/:brandId/team", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const data = insertTeamMemberSchema.parse({ 
        ...req.body, 
        brandId: req.params.brandId,
        invitedBy: userId 
      });
      const member = await storage.createTeamMember(data);
      await createAuditLog(req, "create", "team_member", member.id, null, member);
      res.json(member);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/team/:memberId", requireAuth, async (req, res) => {
    try {
      const updated = await storage.updateTeamMember(req.params.memberId, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/team/:memberId", requireAuth, async (req, res) => {
    try {
      await storage.deleteTeamMember(req.params.memberId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ============= COMPETITOR ROUTES =============
  
  app.get("/api/brands/:brandId/competitors", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const competitors = await storage.getCompetitorsByBrand(req.params.brandId);
      res.json(competitors);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/brands/:brandId/competitors", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const data = insertCompetitorSchema.parse({ ...req.body, brandId: req.params.brandId });
      const competitor = await storage.createCompetitor(data);
      await createAuditLog(req, "create", "competitor", competitor.id, null, competitor);
      res.json(competitor);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/competitors/:competitorId", requireAuth, async (req, res) => {
    try {
      const updated = await storage.updateCompetitor(req.params.competitorId, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/brands/:brandId/competitors/:competitorId", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);

      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      await storage.deleteCompetitor(req.params.competitorId);
      await createAuditLog(req, "delete", "competitor", req.params.competitorId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Competitors Matrix
  app.get("/api/brands/:brandId/competitors/matrix", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);

      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const competitors = await storage.getCompetitorsByBrand(req.params.brandId);
      const prompts = await storage.getPromptsByBrand(req.params.brandId);
      const answers = await storage.getLlmAnswersByBrand(req.params.brandId, 1000);
      const brandMentions = await storage.getAnswerMentionsByBrand(req.params.brandId, 1000);
      const allMentions = await storage.getAnswerMentions(1000);

      // Get competitor mentions for each competitor
      const matrix = competitors.map((competitor) => {
        // Filter mentions that reference this competitor
        const competitorMentions = allMentions.filter(m =>
          m.entityName?.toLowerCase() === competitor.name.toLowerCase() ||
          m.entityName?.toLowerCase().includes(competitor.name.toLowerCase())
        );

        // Calculate head-to-head stats
        const sharedPrompts = new Set<string>();
        const brandWins = new Set<string>();
        const competitorWins = new Set<string>();

        answers.forEach(answer => {
          const brandMention = brandMentions.find(m => m.llmAnswerId === answer.id);
          const compMention = competitorMentions.find(m => m.llmAnswerId === answer.id);

          if (brandMention || compMention) {
            sharedPrompts.add(answer.promptId);

            if (brandMention && !compMention) {
              brandWins.add(answer.promptId);
            } else if (compMention && !brandMention) {
              competitorWins.add(answer.promptId);
            } else if (brandMention && compMention) {
              // Both mentioned, compare positions
              if ((brandMention.position || 999) < (compMention.position || 999)) {
                brandWins.add(answer.promptId);
              } else {
                competitorWins.add(answer.promptId);
              }
            }
          }
        });

        const headToHeadScore = sharedPrompts.size > 0
          ? (brandWins.size / sharedPrompts.size) * 100
          : 0;

        const totalMentions = brandMentions.length + competitorMentions.length;
        const marketShare = totalMentions > 0
          ? (brandMentions.length / totalMentions) * 100
          : 0;

        return {
          competitorId: competitor.id,
          competitorName: competitor.name,
          sharedPrompts: sharedPrompts.size,
          brandWins: brandWins.size,
          competitorWins: competitorWins.size,
          headToHeadScore: Math.round(headToHeadScore * 10) / 10,
          marketShare: Math.round(marketShare * 10) / 10,
          brandMentions: brandMentions.length,
          competitorMentions: competitorMentions.length,
        };
      });

      res.json(matrix);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Competitor Comparison
  app.get("/api/brands/:brandId/competitors/:competitorId/comparison", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);

      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const competitors = await storage.getCompetitorsByBrand(req.params.brandId);
      const competitor = competitors.find(c => c.id === req.params.competitorId);

      if (!competitor) {
        return res.status(404).json({ message: "Competitor not found" });
      }

      const answers = await storage.getLlmAnswersByBrand(req.params.brandId, 1000);
      const brandMentions = await storage.getAnswerMentionsByBrand(req.params.brandId, 1000);

      // For now, return basic comparison structure
      // TODO: Implement competitor mention tracking in database
      const brandScore = answers.length > 0
        ? (brandMentions.length / answers.length) * 100
        : 0;

      res.json({
        competitor: {
          id: competitor.id,
          name: competitor.name,
          domain: competitor.domain,
        },
        overall: {
          brandScore: Math.round(brandScore * 10) / 10,
          competitorScore: 0, // TODO: Track competitor mentions
          gap: 0,
        },
        perModel: [],
        brandMentions: brandMentions.length,
        competitorMentions: 0,
        note: "Competitor mention tracking will be implemented in future update",
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============= TOPIC ROUTES =============
  
  app.get("/api/brands/:brandId/topics", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const topics = await storage.getTopicsByBrand(req.params.brandId);
      res.json(topics);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/brands/:brandId/topics", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);

      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const data = insertTopicSchema.parse({ ...req.body, brandId: req.params.brandId });
      const topic = await storage.createTopic(data);
      res.json(topic);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/topics/:topicId", requireAuth, async (req, res) => {
    try {
      const updated = await storage.updateTopic(req.params.topicId, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/topics/:topicId", requireAuth, async (req, res) => {
    try {
      await storage.deleteTopic(req.params.topicId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ============= PROMPT ROUTES =============
  
  app.get("/api/brands/:brandId/prompts", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const prompts = await storage.getPromptsByBrand(req.params.brandId);
      res.json(prompts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/brands/:brandId/prompts", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const data = insertPromptSchema.parse({ ...req.body, brandId: req.params.brandId });
      const prompt = await storage.createPrompt(data);
      res.json(prompt);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/prompts/:promptId", requireAuth, async (req, res) => {
    try {
      const updated = await storage.updatePrompt(req.params.promptId, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/prompts/:promptId", requireAuth, async (req, res) => {
    try {
      await storage.deletePrompt(req.params.promptId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Prompt Results
  app.get("/api/brands/:brandId/prompts/:promptId/results", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);

      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const answers = await storage.getLlmAnswersByPrompt(req.params.promptId, 100);
      const mentions = await storage.getAnswerMentionsByBrand(req.params.brandId, 1000);

      const results = answers.map(answer => {
        const mention = mentions.find(m => m.llmAnswerId === answer.id);
        return {
          ...answer,
          mention: mention || null,
        };
      });

      res.json(results);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Run Prompt
  app.post("/api/brands/:brandId/prompts/:promptId/run", requireAuth, enforcePlanLimit('promptsPerMonth'), async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);

      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const { triggerLLMSampling } = await import('./jobs');
      const jobId = await triggerLLMSampling(req.params.promptId, req.body.providers);

      await createAuditLog(req, "run_prompt", "prompt", req.params.promptId);

      res.json({
        jobId,
        message: "Prompt execution job queued",
        status: "pending"
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Prompts Performance
  app.get("/api/brands/:brandId/prompts/performance", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);

      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const prompts = await storage.getPromptsByBrand(req.params.brandId);
      const answers = await storage.getLlmAnswersByBrand(req.params.brandId, 1000);
      const mentions = await storage.getAnswerMentionsByBrand(req.params.brandId, 1000);

      const performance = prompts.map(prompt => {
        const promptAnswers = answers.filter(a => a.promptId === prompt.id);
        const promptMentions = mentions.filter(m =>
          promptAnswers.some(a => a.id === m.llmAnswerId)
        );

        const mentionRate = promptAnswers.length > 0
          ? (promptMentions.length / promptAnswers.length) * 100
          : 0;

        const avgPosition = promptMentions.length > 0
          ? promptMentions.reduce((sum, m) => sum + (m.position || 0), 0) / promptMentions.length
          : 0;

        const sentimentScore = promptMentions.length > 0
          ? (promptMentions.filter(m => m.sentiment === 'positive').length -
             promptMentions.filter(m => m.sentiment === 'negative').length) / promptMentions.length
          : 0;

        return {
          promptId: prompt.id,
          promptText: prompt.text,
          category: prompt.category,
          totalResponses: promptAnswers.length,
          mentions: promptMentions.length,
          mentionRate: Math.round(mentionRate * 10) / 10,
          avgPosition: Math.round(avgPosition * 10) / 10,
          sentimentScore: Math.round(sentimentScore * 100) / 100,
        };
      });

      res.json(performance);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============= SOURCE ROUTES =============
  
  app.get("/api/brands/:brandId/sources", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const sources = await storage.getSourcesByBrand(req.params.brandId);
      res.json(sources);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get aggregated domain statistics
  app.get("/api/brands/:brandId/sources/domains", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const sources = await storage.getSourcesByBrand(req.params.brandId);
      
      // Aggregate sources by domain
      const domainMap = new Map<string, {
        domain: string;
        totalCitations: number;
        uniquePages: Set<string>;
        models: Set<string>;
        lastSeen: Date;
      }>();
      
      sources.forEach((source) => {
        const domain = source.domain || '';
        if (!domainMap.has(domain)) {
          domainMap.set(domain, {
            domain,
            totalCitations: 0,
            uniquePages: new Set(),
            models: new Set(),
            lastSeen: new Date(0),
          });
        }
        const entry = domainMap.get(domain)!;
        entry.totalCitations += source.citationCount || 1;
        if (source.url) entry.uniquePages.add(source.url);
        if (source.llmProvider) entry.models.add(source.llmProvider);
        if (source.lastSeenAt && new Date(source.lastSeenAt) > entry.lastSeen) {
          entry.lastSeen = new Date(source.lastSeenAt);
        }
      });
      
      const domains = Array.from(domainMap.values()).map(d => ({
        domain: d.domain,
        totalCitations: d.totalCitations,
        uniquePages: d.uniquePages.size,
        models: Array.from(d.models),
        lastSeen: d.lastSeen,
      })).sort((a, b) => b.totalCitations - a.totalCitations);
      
      res.json(domains);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get source recommendations
  app.get("/api/brands/:brandId/sources/recommendations", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const sources = await storage.getSourcesByBrand(req.params.brandId);
      const brandMentions = await storage.getAnswerMentionsByBrand(req.params.brandId, 500);
      
      // Analyze sources to generate recommendations
      const recommendations: {
        domain: string;
        actionability: string;
        reason: string;
        priority: 'high' | 'medium' | 'low';
        impactScore: number;
      }[] = [];
      
      // Group by domain and analyze
      const domainStats = new Map<string, { citations: number; hasBrandMention: boolean }>();
      
      sources.forEach((source) => {
        const domain = source.domain || '';
        if (!domainStats.has(domain)) {
          domainStats.set(domain, { citations: 0, hasBrandMention: false });
        }
        const stat = domainStats.get(domain)!;
        stat.citations += source.citationCount || 1;
      });
      
      // Check brand mentions in sources
      brandMentions.forEach((mention) => {
        const domain = mention.sourceUrl ? new URL(mention.sourceUrl).hostname : '';
        if (domainStats.has(domain)) {
          domainStats.get(domain)!.hasBrandMention = true;
        }
      });
      
      // Generate recommendations
      domainStats.forEach((stat, domain) => {
        if (stat.citations >= 5 && !stat.hasBrandMention) {
          recommendations.push({
            domain,
            actionability: 'acquire_backlink',
            reason: `High citation source (${stat.citations} citations) where your brand is not mentioned`,
            priority: stat.citations >= 20 ? 'high' : stat.citations >= 10 ? 'medium' : 'low',
            impactScore: Math.min(100, stat.citations * 5),
          });
        }
      });
      
      res.json(recommendations.sort((a, b) => b.impactScore - a.impactScore).slice(0, 20));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get source mentions for a specific source/domain
  app.get("/api/brands/:brandId/sources/:sourceId/mentions", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const mentions = await storage.getAnswerMentionsByBrand(req.params.brandId, 100);
      const filteredMentions = mentions.filter(m => 
        m.sourceUrl?.includes(req.params.sourceId)
      );
      
      res.json(filteredMentions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============= INTEGRATION ROUTES =============
  
  app.get("/api/brands/:brandId/integrations", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const integrations = await storage.getIntegrationsByBrand(req.params.brandId);
      res.json(integrations);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============= ANALYSIS SCHEDULE ROUTES =============

  app.get("/api/brands/:brandId/schedule", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const schedule = await storage.getAnalysisSchedule(req.params.brandId);
      res.json(schedule || { isEnabled: false, frequency: "daily" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/brands/:brandId/schedule", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const existing = await storage.getAnalysisSchedule(req.params.brandId);
      if (existing) {
        const updated = await storage.updateAnalysisSchedule(existing.id, req.body);
        return res.json(updated);
      }

      const data = insertAnalysisScheduleSchema.parse({ ...req.body, brandId: req.params.brandId });
      const schedule = await storage.createAnalysisSchedule(data);
      res.json(schedule);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ============= JOB ROUTES =============
  // Note: GET /api/brands/:brandId/jobs is defined later in the file (line ~2318)
  // using the job queue instead of storage for real-time job status

  app.post("/api/brands/:brandId/jobs", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const data = insertJobSchema.parse({ 
        ...req.body, 
        brandId: req.params.brandId,
        createdBy: userId 
      });
      const job = await storage.createJob(data);
      await createAuditLog(req, "create", "job", job.id, null, job);
      res.json(job);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ============= AXP CONTENT ROUTES =============

  app.get("/api/brands/:brandId/axp", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const content = await storage.getAxpContentByBrand(req.params.brandId);
      res.json(content);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/brands/:brandId/axp", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const data = insertAxpContentSchema.parse({ 
        ...req.body, 
        brandId: req.params.brandId,
        createdBy: userId 
      });
      const content = await storage.createAxpContent(data);
      res.json(content);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Render AXP page as HTML
  app.get("/api/brands/:brandId/axp/:pageId/html", async (req: any, res) => {
    try {
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const allContent = await storage.getAxpContentByBrand(req.params.brandId);
      const page = allContent.find(c => c.id === req.params.pageId);
      
      if (!page) {
        return res.status(404).json({ message: "AXP page not found" });
      }

      // Generate structured JSON-LD based on content type
      const generateJsonLd = (content: any, brandData: any) => {
        const baseSchema: any = {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": content.title,
          "url": `https://${brandData.domain}/${content.slug}`,
          "description": content.content?.substring(0, 160) || '',
          "publisher": {
            "@type": "Organization",
            "name": brandData.name,
            "url": `https://${brandData.domain}`,
          },
        };

        return JSON.stringify(baseSchema, null, 2);
      };

      const jsonLd = generateJsonLd(page, brand);

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.title || brand.name} | AXP</title>
  <link rel="canonical" href="https://${brand.domain}/${page.slug}">
  <meta name="robots" content="noindex, follow">
  <meta name="description" content="${page.content?.substring(0, 160) || ''}">
  
  <!-- Schema.org JSON-LD -->
  <script type="application/ld+json">
${jsonLd}
  </script>
  
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; }
    h1 { color: #1a1a1a; }
    .content { color: #333; }
    .meta { color: #666; font-size: 0.875rem; margin-top: 2rem; border-top: 1px solid #eee; padding-top: 1rem; }
  </style>
</head>
<body>
  <header>
    <h1>${page.title || 'Untitled'}</h1>
  </header>
  <main class="content">
    ${page.htmlContent || page.markdownContent || '<p>No content available.</p>'}
  </main>
  <footer class="meta">
    <p>Published by ${brand.name}</p>
    <p>Last updated: ${new Date(page.updatedAt || page.createdAt).toLocaleDateString()}</p>
  </footer>
</body>
</html>`;

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // =============================================
  // ADMIN ROUTES
  // =============================================

  // Apply admin rate limiting to all /api/admin routes
  app.use('/api/admin', adminLimiter);

  // ============= ADMIN: USERS =============

  app.get("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      const users = await storage.getAllUsers(limit, offset);
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============= ADMIN: PLANS =============

  app.get("/api/admin/plans", requireAuth, requireAdmin, async (req, res) => {
    try {
      const plans = await storage.getAllPlanCapabilities();
      res.json(plans);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/plans", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const data = insertPlanCapabilitySchema.parse(req.body);
      const plan = await storage.createPlanCapability(data);
      await createAuditLog(req, "create", "plan", plan.id, null, plan);
      res.json(plan);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/admin/plans/:planId", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const oldPlan = await storage.getPlanCapability(req.params.planId);
      const updated = await storage.updatePlanCapability(req.params.planId, req.body);
      await createAuditLog(req, "update", "plan", req.params.planId, oldPlan, updated);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ============= ADMIN: PROMPT TEMPLATES =============

  app.get("/api/admin/prompt-templates", requireAuth, requireAdmin, async (req, res) => {
    try {
      const templates = await storage.getPromptTemplates({
        category: req.query.category as string,
        llmProvider: req.query.llmProvider as string,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      });
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/prompt-templates/:templateId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const template = await storage.getPromptTemplate(req.params.templateId);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/prompt-templates", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const data = insertPromptTemplateSchema.parse({ 
        ...req.body, 
        createdBy: getUserId(req) 
      });
      const template = await storage.createPromptTemplate(data);
      await createAuditLog(req, "create", "prompt_template", template.id, null, template);
      res.json(template);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/admin/prompt-templates/:templateId", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const oldTemplate = await storage.getPromptTemplate(req.params.templateId);
      const updated = await storage.updatePromptTemplate(req.params.templateId, req.body);
      await createAuditLog(req, "update", "prompt_template", req.params.templateId, oldTemplate, updated);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/prompt-templates/:templateId", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const template = await storage.getPromptTemplate(req.params.templateId);
      await storage.deletePromptTemplate(req.params.templateId);
      await createAuditLog(req, "delete", "prompt_template", req.params.templateId, template, null);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ============= ADMIN: BRANDS =============

  app.get("/api/admin/brands", requireAuth, requireAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      const brands = await storage.getAllBrands(limit, offset);
      const total = await storage.countBrands();
      res.json({ brands, total });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/brands/:brandId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const brand = await storage.getBrand(req.params.brandId);
      if (!brand) {
        return res.status(404).json({ message: "Brand not found" });
      }
      
      const [competitors, prompts, topics, sources, jobs] = await Promise.all([
        storage.getCompetitorsByBrand(req.params.brandId),
        storage.getPromptsByBrand(req.params.brandId),
        storage.getTopicsByBrand(req.params.brandId),
        storage.getSourcesByBrand(req.params.brandId),
        storage.getJobsByBrand(req.params.brandId, 10),
      ]);
      
      res.json({ brand, competitors, prompts, topics, sources, jobs });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/admin/brands/:brandId", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const oldBrand = await storage.getBrand(req.params.brandId);
      const updated = await storage.updateBrand(req.params.brandId, req.body);
      await createAuditLog(req, "admin_update", "brand", req.params.brandId, oldBrand, updated);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/brands/:brandId", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const brand = await storage.getBrand(req.params.brandId);
      await storage.deleteBrand(req.params.brandId);
      await createAuditLog(req, "delete", "brand", req.params.brandId, brand, null);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Admin: Trigger job for brand
  app.post("/api/admin/brands/:brandId/run-job", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const brand = await storage.getBrand(req.params.brandId);
      if (!brand) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const job = await storage.createJob({
        brandId: req.params.brandId,
        type: req.body.type || "full_analysis",
        status: "pending",
        priority: 10,
        payload: req.body.payload,
        createdBy: getUserId(req),
      });

      await createAuditLog(req, "admin_trigger_job", "job", job.id, null, job);
      res.json(job);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ============= ADMIN: AUDIT LOGS =============

  app.get("/api/admin/audit-logs", requireAuth, requireAdmin, async (req, res) => {
    try {
      const logs = await storage.getAuditLogs({
        brandId: req.query.brandId as string,
        userId: req.query.userId as string,
        limit: parseInt(req.query.limit as string) || 100,
        offset: parseInt(req.query.offset as string) || 0,
      });
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============= ADMIN: AXP MANAGEMENT =============

  app.get("/api/admin/axp", requireAuth, requireAdmin, async (req, res) => {
    try {
      const brandId = req.query.brandId as string;
      if (brandId) {
        const content = await storage.getAxpContentByBrand(brandId);
        return res.json(content);
      }
      res.json([]);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/admin/axp/:axpId", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const oldContent = await storage.getAxpContent(req.params.axpId);
      const updated = await storage.updateAxpContent(req.params.axpId, req.body);
      await createAuditLog(req, "admin_update", "axp_content", req.params.axpId, oldContent, updated);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/admin/axp/:axpId/publish", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const oldContent = await storage.getAxpContent(req.params.axpId);
      const updated = await storage.updateAxpContent(req.params.axpId, {
        status: "published",
        publishedAt: new Date(),
        publishedBy: getUserId(req),
        version: (oldContent?.version || 0) + 1,
      });
      await createAuditLog(req, "publish", "axp_content", req.params.axpId, oldContent, updated);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/admin/axp/:axpId/rollback", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const oldContent = await storage.getAxpContent(req.params.axpId);
      const updated = await storage.updateAxpContent(req.params.axpId, {
        status: "draft",
        publishedAt: null,
      });
      await createAuditLog(req, "rollback", "axp_content", req.params.axpId, oldContent, updated);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ============= ADMIN: JOBS =============

  app.get("/api/admin/jobs", requireAuth, requireAdmin, async (req, res) => {
    try {
      const jobs = await storage.getPendingJobs(100);
      res.json(jobs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/admin/jobs/:jobId", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const updated = await storage.updateJob(req.params.jobId, req.body);
      await createAuditLog(req, "admin_update", "job", req.params.jobId, null, updated);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ============= BRAND CONTEXT ROUTES =============

  app.get("/api/brands/:brandId/context", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const context = await storage.getBrandContext(req.params.brandId);
      res.json(context || {});
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/brands/:brandId/context", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const existing = await storage.getBrandContext(req.params.brandId);
      if (existing) {
        const updated = await storage.updateBrandContext(existing.id, req.body);
        return res.json(updated);
      }

      const context = await storage.createBrandContext({
        ...req.body,
        brandId: req.params.brandId,
      });
      await createAuditLog(req, "create", "brand_context", context.id, null, context);
      res.json(context);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/brands/:brandId/context", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const context = await storage.getBrandContext(req.params.brandId);
      if (!context) {
        return res.status(404).json({ message: "Brand context not found" });
      }

      const updated = await storage.updateBrandContext(context.id, req.body);
      await createAuditLog(req, "update", "brand_context", context.id, context, updated);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ============= ANALYTICS ROUTES =============

  // LLM Answers
  app.get("/api/brands/:brandId/llm-answers", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const limit = parseInt(req.query.limit as string) || 100;
      const answers = await storage.getLlmAnswersByBrand(req.params.brandId, limit);
      res.json(answers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/prompts/:promptId/llm-answers", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const answers = await storage.getLlmAnswersByPrompt(req.params.promptId, limit);
      res.json(answers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Prompt Runs
  app.get("/api/brands/:brandId/prompt-runs", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const limit = parseInt(req.query.limit as string) || 100;
      const runs = await storage.getPromptRunsByBrand(req.params.brandId, limit);
      res.json(runs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/prompts/:promptId/runs", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const runs = await storage.getPromptRunsByPrompt(req.params.promptId, limit);
      res.json(runs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Answer Mentions
  app.get("/api/brands/:brandId/mentions", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const limit = parseInt(req.query.limit as string) || 100;
      const mentions = await storage.getAnswerMentionsByBrand(req.params.brandId, limit);
      res.json(mentions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Visibility Scores
  app.get("/api/brands/:brandId/visibility-scores", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const period = req.query.period as string;
      const limit = parseInt(req.query.limit as string) || 30;
      const scores = await storage.getVisibilityScoresByBrand(req.params.brandId, period, limit);
      res.json(scores);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/brands/:brandId/visibility-scores/latest", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const score = await storage.getLatestVisibilityScore(req.params.brandId);
      res.json(score || {});
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Trend Snapshots
  app.get("/api/brands/:brandId/trends", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);

      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const limit = parseInt(req.query.limit as string) || 90;
      const trends = await storage.getTrendSnapshotsByBrand(req.params.brandId, limit);
      res.json(trends);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Recommendations
  app.get("/api/brands/:brandId/recommendations", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);

      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const recommendations = await storage.getRecommendationsByBrand(req.params.brandId, limit);
      res.json(recommendations);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============= DASHBOARD ROUTES =============

  // Dashboard Summary
  app.get("/api/brands/:brandId/dashboard/summary", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);

      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      // Get latest visibility score
      const latestScore = await storage.getLatestVisibilityScore(req.params.brandId);

      // Get recent mentions
      const mentions = await storage.getAnswerMentionsByBrand(req.params.brandId, 100);

      // Get recent prompt runs
      const promptRuns = await storage.getPromptRunsByBrand(req.params.brandId, 50);

      // Calculate summary metrics
      const totalMentions = mentions.length;
      const positiveMentions = mentions.filter(m => m.sentiment === 'positive').length;
      const neutralMentions = mentions.filter(m => m.sentiment === 'neutral').length;
      const negativeMentions = mentions.filter(m => m.sentiment === 'negative').length;

      const avgPosition = mentions.length > 0
        ? mentions.reduce((sum, m) => sum + (m.position || 0), 0) / mentions.length
        : 0;

      res.json({
        visibilityScore: latestScore?.score || 0,
        totalMentions,
        positiveMentions,
        neutralMentions,
        negativeMentions,
        avgPosition: Math.round(avgPosition * 10) / 10,
        totalPromptRuns: promptRuns.length,
        lastUpdated: latestScore?.createdAt || new Date(),
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Dashboard Visibility Score
  app.get("/api/brands/:brandId/dashboard/visibility-score", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);

      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const score = await storage.getLatestVisibilityScore(req.params.brandId);
      res.json(score || { score: 0, breakdown: {} });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Dashboard Trends
  app.get("/api/brands/:brandId/dashboard/trends", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);

      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const period = req.query.period as string || '30d';
      const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;

      const scores = await storage.getVisibilityScoresByBrand(req.params.brandId, period, days);

      // Calculate trend
      const currentScore = scores[0]?.score || 0;
      const previousScore = scores[scores.length - 1]?.score || 0;
      const delta = currentScore - previousScore;
      const percentage = previousScore > 0 ? (delta / previousScore) * 100 : 0;

      res.json({
        current: currentScore,
        previous: previousScore,
        delta,
        percentage: Math.round(percentage * 10) / 10,
        scores,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Dashboard Model Breakdown
  app.get("/api/brands/:brandId/dashboard/model-breakdown", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);

      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const answers = await storage.getLlmAnswersByBrand(req.params.brandId, 500);
      const mentions = await storage.getAnswerMentionsByBrand(req.params.brandId, 500);

      // Group by model
      const modelStats: Record<string, any> = {};

      answers.forEach(answer => {
        if (!modelStats[answer.model]) {
          modelStats[answer.model] = {
            model: answer.model,
            totalResponses: 0,
            mentions: 0,
            avgPosition: 0,
            positions: [],
          };
        }
        modelStats[answer.model].totalResponses++;

        const mention = mentions.find(m => m.llmAnswerId === answer.id);
        if (mention) {
          modelStats[answer.model].mentions++;
          if (mention.position) {
            modelStats[answer.model].positions.push(mention.position);
          }
        }
      });

      // Calculate scores
      const breakdown = Object.values(modelStats).map((stat: any) => ({
        model: stat.model,
        score: stat.totalResponses > 0 ? (stat.mentions / stat.totalResponses) * 100 : 0,
        mentions: stat.mentions,
        totalResponses: stat.totalResponses,
        avgPosition: stat.positions.length > 0
          ? stat.positions.reduce((a: number, b: number) => a + b, 0) / stat.positions.length
          : 0,
      }));

      res.json(breakdown);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Dashboard Topic Performance
  app.get("/api/brands/:brandId/dashboard/topic-performance", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);

      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const topics = await storage.getTopicsByBrand(req.params.brandId);
      const prompts = await storage.getPromptsByBrand(req.params.brandId);
      const answers = await storage.getLlmAnswersByBrand(req.params.brandId, 1000);
      const mentions = await storage.getAnswerMentionsByBrand(req.params.brandId, 1000);

      // Group prompts by topic
      const topicPerformance = topics.map(topic => {
        const topicPrompts = prompts.filter(p => p.topicId === topic.id);
        const topicAnswers = answers.filter(a =>
          topicPrompts.some(p => p.id === a.promptId)
        );
        const topicMentions = mentions.filter(m =>
          topicAnswers.some(a => a.id === m.llmAnswerId)
        );

        const mentionRate = topicAnswers.length > 0
          ? (topicMentions.length / topicAnswers.length) * 100
          : 0;

        return {
          topic: topic.name,
          topicId: topic.id,
          prompts: topicPrompts.length,
          responses: topicAnswers.length,
          mentions: topicMentions.length,
          mentionRate: Math.round(mentionRate * 10) / 10,
        };
      });

      res.json(topicPerformance);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============= JOB MANAGEMENT ROUTES =============

  // Job Runs
  app.get("/api/jobs/:jobId/runs", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const runs = await storage.getJobRunsByJob(req.params.jobId, limit);
      res.json(runs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/jobs/:jobId/runs/latest", requireAuth, async (req, res) => {
    try {
      const run = await storage.getLatestJobRun(req.params.jobId);
      res.json(run || {});
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Job Errors
  app.get("/api/jobs/:jobId/errors", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const errors = await storage.getJobErrorsByJob(req.params.jobId, limit);
      res.json(errors);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/job-errors/unresolved", requireAuth, requireAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const errors = await storage.getUnresolvedJobErrors(limit);
      res.json(errors);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============= CONTENT MANAGEMENT ROUTES =============

  // AXP Pages
  app.get("/api/brands/:brandId/axp-pages", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const pages = await storage.getAxpPagesByBrand(req.params.brandId);
      res.json(pages);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/axp-pages/:pageId", requireAuth, async (req, res) => {
    try {
      const page = await storage.getAxpPage(req.params.pageId);
      if (!page) {
        return res.status(404).json({ message: "Page not found" });
      }
      res.json(page);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/brands/:brandId/axp-pages", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const page = await storage.createAxpPage({
        ...req.body,
        brandId: req.params.brandId,
        createdBy: userId,
      });
      await createAuditLog(req, "create", "axp_page", page.id, null, page);
      res.json(page);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/axp-pages/:pageId", requireAuth, async (req: any, res) => {
    try {
      const oldPage = await storage.getAxpPage(req.params.pageId);
      const updated = await storage.updateAxpPage(req.params.pageId, req.body);
      await createAuditLog(req, "update", "axp_page", req.params.pageId, oldPage, updated);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/axp-pages/:pageId", requireAuth, async (req: any, res) => {
    try {
      const page = await storage.getAxpPage(req.params.pageId);
      await storage.deleteAxpPage(req.params.pageId);
      await createAuditLog(req, "delete", "axp_page", req.params.pageId, page, null);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // AXP Versions
  app.get("/api/axp-pages/:pageId/versions", requireAuth, async (req, res) => {
    try {
      const versions = await storage.getAxpVersionsByPage(req.params.pageId);
      res.json(versions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // FAQ Entries
  app.get("/api/brands/:brandId/faqs", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const faqs = await storage.getFaqEntriesByBrand(req.params.brandId);
      res.json(faqs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/brands/:brandId/faqs", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const faq = await storage.createFaqEntry({
        ...req.body,
        brandId: req.params.brandId,
        createdBy: userId,
      });
      await createAuditLog(req, "create", "faq_entry", faq.id, null, faq);
      res.json(faq);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/faqs/:faqId", requireAuth, async (req: any, res) => {
    try {
      const oldFaq = await storage.getFaqEntry(req.params.faqId);
      const updated = await storage.updateFaqEntry(req.params.faqId, req.body);
      await createAuditLog(req, "update", "faq_entry", req.params.faqId, oldFaq, updated);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/faqs/:faqId", requireAuth, async (req: any, res) => {
    try {
      const faq = await storage.getFaqEntry(req.params.faqId);
      await storage.deleteFaqEntry(req.params.faqId);
      await createAuditLog(req, "delete", "faq_entry", req.params.faqId, faq, null);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Schema Templates
  app.get("/api/brands/:brandId/schema-templates", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const templates = await storage.getSchemaTemplatesByBrand(req.params.brandId);
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/schema-templates/global", async (req, res) => {
    try {
      const templates = await storage.getGlobalSchemaTemplates();
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/brands/:brandId/schema-templates", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const template = await storage.createSchemaTemplate({
        ...req.body,
        brandId: req.params.brandId,
        createdBy: userId,
      });
      await createAuditLog(req, "create", "schema_template", template.id, null, template);
      res.json(template);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/schema-templates/:templateId", requireAuth, async (req: any, res) => {
    try {
      const oldTemplate = await storage.getSchemaTemplate(req.params.templateId);
      const updated = await storage.updateSchemaTemplate(req.params.templateId, req.body);
      await createAuditLog(req, "update", "schema_template", req.params.templateId, oldTemplate, updated);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/schema-templates/:templateId", requireAuth, async (req: any, res) => {
    try {
      const template = await storage.getSchemaTemplate(req.params.templateId);
      await storage.deleteSchemaTemplate(req.params.templateId);
      await createAuditLog(req, "delete", "schema_template", req.params.templateId, template, null);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Schema Versions
  app.get("/api/schema-templates/:templateId/versions", requireAuth, async (req, res) => {
    try {
      const versions = await storage.getSchemaVersionsByTemplate(req.params.templateId);
      res.json(versions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============= BILLING ROUTES =============

  // Subscriptions
  app.get("/api/brands/:brandId/subscription", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const subscription = await storage.getSubscriptionByBrand(req.params.brandId);
      res.json(subscription || {});
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Invoices
  app.get("/api/brands/:brandId/invoices", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const invoices = await storage.getInvoicesByBrand(req.params.brandId, limit);
      res.json(invoices);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Payments
  app.get("/api/brands/:brandId/payments", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const payments = await storage.getPaymentsByBrand(req.params.brandId, limit);
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Webhook Events (Admin only)
  app.get("/api/admin/webhooks", requireAuth, requireAdmin, async (req, res) => {
    try {
      const webhooks = await storage.getWebhookEvents({
        source: req.query.source as string,
        processed: req.query.processed === 'true' ? true : req.query.processed === 'false' ? false : undefined,
        limit: parseInt(req.query.limit as string) || 100,
      });
      res.json(webhooks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============= JOB TRIGGER ROUTES =============

  app.post("/api/brands/:brandId/enrich", requireAuth, jobLimiter, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const { triggerBrandEnrichment } = await import('./jobs');
      const jobId = await triggerBrandEnrichment(req.params.brandId, 8);
      
      await createAuditLog(req, "trigger_enrichment", "brand", req.params.brandId);
      
      res.json({ 
        jobId, 
        message: "Brand enrichment job queued",
        status: "pending"
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/prompts/:promptId/sample", requireAuth, async (req: any, res) => {
    try {
      const prompt = await storage.getPrompt(req.params.promptId);
      if (!prompt) {
        return res.status(404).json({ message: "Prompt not found" });
      }

      // Check plan limit manually since we need to get brandId from prompt first
      const { checkPlanLimit } = await import('./middleware/plan-enforcement');
      const limitCheck = await checkPlanLimit(prompt.brandId, 'promptsPerMonth');

      if (!limitCheck.allowed) {
        return res.status(403).json({
          error: 'Plan limit exceeded',
          message: limitCheck.message,
          current: limitCheck.current,
          limit: limitCheck.limit,
          upgradeRequired: true,
        });
      }

      const { triggerLLMSampling } = await import('./jobs');
      const jobId = await triggerLLMSampling(
        prompt.brandId,
        req.params.promptId,
        req.body.providers,
        8
      );

      await createAuditLog(req, "trigger_sampling", "prompt", req.params.promptId);

      res.json({
        jobId,
        message: "LLM sampling job queued",
        status: "pending",
        providers: req.body.providers || ['openai', 'anthropic', 'google']
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/jobs/:jobId/status", requireAuth, async (req, res) => {
    try {
      const { getJobQueue } = await import('./jobs');
      const queue = getJobQueue();
      const job = await queue.getJob(req.params.jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      res.json({
        id: job.id,
        type: job.type,
        status: job.status,
        progress: job.status === 'completed' ? 100 : job.status === 'running' ? 50 : 0,
        attempts: job.attempts,
        maxAttempts: job.maxAttempts,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        error: job.error,
        result: job.result,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/jobs/stats", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { getJobQueue } = await import('./jobs');
      const queue = getJobQueue();
      const stats = queue.getStats();
      
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/brands/:brandId/jobs", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const { getJobQueue } = await import('./jobs');
      const queue = getJobQueue();
      const jobs = await queue.getJobsByBrand(req.params.brandId);
      
      res.json(jobs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Gap Analysis Opportunities
  app.get("/api/brands/:brandId/gap-analysis/opportunities", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);

      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const answers = await storage.getLlmAnswersByBrand(req.params.brandId, 1000);
      const mentions = await storage.getAnswerMentionsByBrand(req.params.brandId, 1000);
      const prompts = await storage.getPromptsByBrand(req.params.brandId);

      // Find prompts without mentions (missing opportunities)
      const promptsWithMentions = new Set(
        mentions.map(m => {
          const answer = answers.find(a => a.id === m.llmAnswerId);
          return answer?.promptId;
        }).filter(Boolean)
      );

      const missedOpportunities = prompts
        .filter(p => !promptsWithMentions.has(p.id))
        .map(p => ({
          promptId: p.id,
          promptText: p.text,
          category: p.category,
          impactScore: 7, // Default high impact
          effortScore: 3, // Default low effort
          type: 'quick_win',
        }));

      // Find low rankings (mentioned but in poor position)
      const lowRankings = mentions
        .filter(m => (m.position || 0) > 3)
        .map(m => {
          const answer = answers.find(a => a.id === m.llmAnswerId);
          const prompt = prompts.find(p => p.id === answer?.promptId);
          return {
            promptId: prompt?.id,
            promptText: prompt?.text,
            position: m.position,
            model: answer?.llmModel,
            impactScore: 6,
            effortScore: 5,
            type: 'improvement',
          };
        });

      res.json({
        missedOpportunities: missedOpportunities.slice(0, 20),
        lowRankings: lowRankings.slice(0, 20),
        summary: {
          totalOpportunities: missedOpportunities.length + lowRankings.length,
          quickWins: missedOpportunities.filter(o => o.impactScore > 6 && o.effortScore < 4).length,
          improvements: lowRankings.length,
        },
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Gap Analysis Roadmap
  app.get("/api/brands/:brandId/gap-analysis/roadmap", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);

      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      // Get opportunities
      const opportunitiesResponse = await fetch(`http://localhost:5000/api/brands/${req.params.brandId}/gap-analysis/opportunities`, {
        headers: { 'Authorization': req.headers.authorization || '' }
      });
      const opportunities = await opportunitiesResponse.json();

      // Categorize into quadrants
      const roadmap = {
        quickWins: opportunities.missedOpportunities.filter((o: any) => o.impactScore > 6 && o.effortScore < 4),
        bigBets: opportunities.missedOpportunities.filter((o: any) => o.impactScore > 6 && o.effortScore >= 6),
        fillIns: opportunities.lowRankings.filter((o: any) => o.impactScore < 4 && o.effortScore < 4),
        longTerm: opportunities.lowRankings.filter((o: any) => o.impactScore < 4 && o.effortScore >= 6),
      };

      res.json(roadmap);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Trigger Gap Analysis
  app.post("/api/brands/:brandId/analyze/gaps", requireAuth, jobLimiter, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);

      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const { triggerGapAnalysis } = await import('./jobs');
      const jobId = await triggerGapAnalysis(req.params.brandId, req.body.period, 8);

      await createAuditLog(req, "trigger_gap_analysis", "brand", req.params.brandId);

      res.json({
        jobId,
        message: "Gap analysis job queued",
        status: "pending"
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/brands/:brandId/analyze/visibility", requireAuth, jobLimiter, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const { triggerVisibilityScoring } = await import('./jobs');
      const jobId = await triggerVisibilityScoring(
        req.params.brandId,
        req.body.period || 'week',
        8
      );
      
      await createAuditLog(req, "trigger_visibility_scoring", "brand", req.params.brandId);
      
      res.json({ 
        jobId, 
        message: "Visibility scoring job queued",
        status: "pending",
        period: req.body.period || 'week'
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/brands/:brandId/analyze/recommendations", requireAuth, jobLimiter, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const { triggerRecommendations } = await import('./jobs');
      const jobId = await triggerRecommendations(req.params.brandId, 8);
      
      await createAuditLog(req, "trigger_recommendations", "brand", req.params.brandId);
      
      res.json({ 
        jobId, 
        message: "Recommendation generation job queued",
        status: "pending"
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/brands/:brandId/analyze/full", requireAuth, jobLimiter, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const { triggerFullAnalysis } = await import('./jobs');
      const result = await triggerFullAnalysis(req.params.brandId, 8);
      
      await createAuditLog(req, "trigger_full_analysis", "brand", req.params.brandId);
      
      res.json({ 
        ...result,
        message: "Full analysis pipeline queued",
        status: "pending",
        jobCount: result.jobIds.length
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============= BILLING & SUBSCRIPTION ROUTES =============

  // Razorpay Webhook Handler
  app.post("/api/webhooks/razorpay", webhookLimiter, async (req, res) => {
    try {
      const { handleRazorpayWebhook } = await import('./webhooks/razorpay');
      await handleRazorpayWebhook(req, res);
    } catch (error: any) {
      console.error('[Razorpay Webhook] Error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Get subscription details
  app.get("/api/brands/:brandId/subscription", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const { getSubscriptionDetails } = await import('./services/subscription');
      const details = await getSubscriptionDetails(req.params.brandId);
      
      res.json(details);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create subscription
  app.post("/api/brands/:brandId/subscription", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const { createSubscription } = await import('./services/subscription');
      const result = await createSubscription({
        brandId: req.params.brandId,
        planId: req.body.planId,
        userId,
        customerEmail: req.body.email,
        customerPhone: req.body.phone,
        startTrial: req.body.startTrial,
      });

      await createAuditLog(req, "create_subscription", "subscription", result.subscriptionId);
      
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Change subscription plan (upgrade/downgrade)
  app.post("/api/brands/:brandId/subscription/change-plan", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const { changeSubscriptionPlan } = await import('./services/subscription');
      const result = await changeSubscriptionPlan({
        brandId: req.params.brandId,
        newPlanId: req.body.newPlanId,
        immediate: req.body.immediate !== false,
      });

      await createAuditLog(req, "change_plan", "subscription", result.subscription.id, 
        { oldPlan: result.subscription.planId }, 
        { newPlan: req.body.newPlanId }
      );
      
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Cancel subscription
  app.post("/api/brands/:brandId/subscription/cancel", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const { cancelSubscription } = await import('./services/subscription');
      const subscription = await cancelSubscription({
        brandId: req.params.brandId,
        immediate: req.body.immediate,
        reason: req.body.reason,
      });

      await createAuditLog(req, "cancel_subscription", "subscription", subscription.id);
      
      res.json(subscription);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Pause subscription
  app.post("/api/brands/:brandId/subscription/pause", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const { pauseSubscription } = await import('./services/subscription');
      const subscription = await pauseSubscription(req.params.brandId);

      await createAuditLog(req, "pause_subscription", "subscription", subscription.id);
      
      res.json(subscription);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Resume subscription
  app.post("/api/brands/:brandId/subscription/resume", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const { resumeSubscription } = await import('./services/subscription');
      const subscription = await resumeSubscription(req.params.brandId);

      await createAuditLog(req, "resume_subscription", "subscription", subscription.id);
      
      res.json(subscription);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Sync subscription status from Razorpay
  app.post("/api/brands/:brandId/subscription/sync", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const { syncSubscriptionStatus } = await import('./services/subscription');
      await syncSubscriptionStatus(req.params.brandId);
      
      res.json({ success: true, message: "Subscription synced" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get invoices
  app.get("/api/brands/:brandId/invoices", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const invoices = await storage.getInvoicesByBrand(req.params.brandId);
      res.json(invoices);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get invoice PDF
  app.get("/api/invoices/:invoiceId/pdf", requireAuth, exportLimiter, async (req: any, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      const brand = await storage.getBrand(invoice.brandId);
      if (!brand || brand.userId !== getUserId(req)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { generateInvoicePDF } = await import('./services/invoice-generator');
      const pdfBuffer = await generateInvoicePDF(req.params.invoiceId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.id}.pdf"`);
      res.send(pdfBuffer);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get plan limits for brand
  app.get("/api/brands/:brandId/limits", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const { getPlanLimits } = await import('./middleware/plan-enforcement');
      const limits = getPlanLimits(brand.tier);
      
      res.json(limits);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Check specific plan limit
  app.get("/api/brands/:brandId/limits/:limitType", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const { checkPlanLimit } = await import('./middleware/plan-enforcement');
      const result = await checkPlanLimit(req.params.brandId, req.params.limitType as any);
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get usage logs
  app.get("/api/brands/:brandId/usage", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const brand = await storage.getBrand(req.params.brandId);
      
      if (!brand || brand.userId !== userId) {
        return res.status(404).json({ message: "Brand not found" });
      }

      const logs = await storage.getUsageLogs(req.params.brandId);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
