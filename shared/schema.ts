import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, real, index, serial } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============= PLAN CAPABILITIES (Admin-configurable) =============

export const planCapabilities = pgTable("plan_capabilities", {
  id: varchar("id").primaryKey(), // free, starter, growth, enterprise
  name: text("name").notNull(),
  displayName: text("display_name").notNull(),
  monthlyPrice: integer("monthly_price").notNull().default(0),
  maxCompetitors: integer("max_competitors").notNull().default(3),
  maxTopics: integer("max_topics").notNull().default(3),
  maxPrompts: integer("max_prompts").notNull().default(15),
  maxTeamMembers: integer("max_team_members").notNull().default(1),
  allowedLlmProviders: text("allowed_llm_providers").array(), // ["chatgpt", "claude", "gemini", "perplexity"]
  allowedIntegrations: text("allowed_integrations").array(), // ["gsc", "twitter", "linkedin", "reddit"]
  refreshFrequency: text("refresh_frequency").notNull().default("weekly"), // hourly, daily, weekly
  exportEnabled: boolean("export_enabled").notNull().default(false),
  apiAccessEnabled: boolean("api_access_enabled").notNull().default(false),
  whitelabelEnabled: boolean("whitelabel_enabled").notNull().default(false),
  prioritySupport: boolean("priority_support").notNull().default(false),
  customBranding: boolean("custom_branding").notNull().default(false),
  ssoEnabled: boolean("sso_enabled").notNull().default(false),
  auditLogsEnabled: boolean("audit_logs_enabled").notNull().default(false),
  dailyQueryLimit: integer("daily_query_limit").default(100),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPlanCapabilitySchema = createInsertSchema(planCapabilities).omit({ createdAt: true, updatedAt: true });
export type InsertPlanCapability = z.infer<typeof insertPlanCapabilitySchema>;
export type PlanCapability = typeof planCapabilities.$inferSelect;

// ============= USERS =============

export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  email: varchar("email").unique().notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  phone: varchar("phone"),
  passwordHash: varchar("password_hash"),
  emailVerified: boolean("email_verified").default(false),
  verificationCode: varchar("verification_code"),
  verificationExpiry: timestamp("verification_expiry"),
  resetCode: varchar("reset_code"),
  resetExpiry: timestamp("reset_expiry"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").default(false),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  onboardingStep: integer("onboarding_step").default(1),
  // OAuth fields
  googleId: varchar("google_id").unique(),
  authProvider: varchar("auth_provider").default("email"), // 'email', 'google'
  profilePicture: varchar("profile_picture"),
  termsAccepted: boolean("terms_accepted").default(false),
  termsAcceptedAt: timestamp("terms_accepted_at"),
  // Security fields
  accountLocked: boolean("account_locked").default(false),
  lockedUntil: timestamp("locked_until"),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  lastFailedLogin: timestamp("last_failed_login"),
  lastLoginAt: timestamp("last_login_at"),
  lastLoginIp: varchar("last_login_ip"),
  passwordChangedAt: timestamp("password_changed_at"),
  requirePasswordChange: boolean("require_password_change").default(false),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  twoFactorSecret: varchar("two_factor_secret"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  verificationCode: true,
  verificationExpiry: true,
  resetCode: true,
  resetExpiry: true,
  emailVerified: true,
  isAdmin: true,
  onboardingCompleted: true,
  profileImageUrl: true,
});

export const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is required").regex(/^\+\d{1,4}\d{6,14}$/, "Phone must include country code (e.g., +1234567890)"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, "OTP must be 6 digits"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, "OTP must be 6 digits"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============= LOGIN ATTEMPTS =============

export const loginAttempts = pgTable("login_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  ipAddress: varchar("ip_address").notNull(),
  userAgent: text("user_agent"),
  success: boolean("success").notNull().default(false),
  failureReason: varchar("failure_reason"), // 'invalid_password', 'account_locked', 'invalid_email', etc.
  attemptedAt: timestamp("attempted_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLoginAttemptSchema = createInsertSchema(loginAttempts).omit({ id: true, createdAt: true });
export type InsertLoginAttempt = z.infer<typeof insertLoginAttemptSchema>;
export type LoginAttempt = typeof loginAttempts.$inferSelect;

// ============= ACCOUNT LOCKOUTS =============

export const accountLockouts = pgTable("account_lockouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  email: varchar("email").notNull(),
  lockedAt: timestamp("locked_at").notNull().defaultNow(),
  lockedUntil: timestamp("locked_until").notNull(),
  reason: varchar("reason").notNull().default("too_many_failed_attempts"),
  lockCount: integer("lock_count").notNull().default(1),
  ipAddress: varchar("ip_address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAccountLockoutSchema = createInsertSchema(accountLockouts).omit({ id: true, createdAt: true });
export type InsertAccountLockout = z.infer<typeof insertAccountLockoutSchema>;
export type AccountLockout = typeof accountLockouts.$inferSelect;

// ============= USER SESSIONS =============

export const userSessions = pgTable("user_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionToken: varchar("session_token").notNull().unique(),
  ipAddress: varchar("ip_address").notNull(),
  userAgent: text("user_agent"),
  deviceInfo: jsonb("device_info"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastActivity: timestamp("last_activity").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  revokedAt: timestamp("revoked_at"),
  revokeReason: varchar("revoke_reason"), // 'logout', 'password_change', 'admin_revoke', 'suspicious_activity'
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({ id: true, createdAt: true });
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type UserSession = typeof userSessions.$inferSelect;

// ============= SECURITY EVENTS =============

export const securityEvents = pgTable("security_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'set null' }),
  eventType: varchar("event_type").notNull(), // 'login_success', 'failed_login', 'account_locked', 'password_change', 'session_expired', etc.
  severity: varchar("severity").notNull().default("info"), // 'info', 'warning', 'critical'
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata"), // Additional context
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSecurityEventSchema = createInsertSchema(securityEvents).omit({ id: true, createdAt: true });
export type InsertSecurityEvent = z.infer<typeof insertSecurityEventSchema>;
export type SecurityEvent = typeof securityEvents.$inferSelect;

// ============= PASSWORD HISTORY =============

export const passwordHistory = pgTable("password_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  passwordHash: varchar("password_hash").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPasswordHistorySchema = createInsertSchema(passwordHistory).omit({ id: true, createdAt: true });
export type InsertPasswordHistory = z.infer<typeof insertPasswordHistorySchema>;
export type PasswordHistory = typeof passwordHistory.$inferSelect;

// ============= TEAM MEMBERS (Enterprise) =============

export const teamMembers = pgTable("team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").notNull().references(() => brands.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'set null' }),
  email: varchar("email").notNull(),
  role: text("role").notNull().default("viewer"), // owner, admin, editor, viewer
  status: text("status").notNull().default("pending"), // pending, active, suspended
  invitedBy: varchar("invited_by").references(() => users.id),
  invitedAt: timestamp("invited_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  permissions: jsonb("permissions"), // granular permissions object
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;

// ============= BRANDS =============

export const brands = pgTable("brands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  domain: text("domain").notNull().unique(),
  logo: text("logo"),
  industry: text("industry"),
  subindustry: text("subindustry"),
  description: text("description"),
  slogan: text("slogan"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  linkedinUrl: text("linkedin_url"),
  brandDevData: jsonb("brand_dev_data"), // Full Brand.dev API response
  tier: text("tier").notNull().default("free"), // free, starter, growth, enterprise
  entityType: text("entity_type"), // Platform, SaaS, etc
  coreTopics: text("core_topics").array(),
  brandVariations: text("brand_variations").array(), // Alternative names for detection
  targetMarket: text("target_market"),
  primaryLanguage: text("primary_language").default("en"),
  visibilityScore: real("visibility_score").default(0),
  aiTrafficEstimate: integer("ai_traffic_estimate").default(0),
  lastAnalysis: timestamp("last_analysis"),
  nextScheduledAnalysis: timestamp("next_scheduled_analysis"),
  analysisEnabled: boolean("analysis_enabled").default(true),
  status: text("status").notNull().default("active"), // active, suspended, trial
  trialEndsAt: timestamp("trial_ends_at"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBrandSchema = createInsertSchema(brands).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBrand = z.infer<typeof insertBrandSchema>;
export type Brand = typeof brands.$inferSelect;

// ============= COMPETITORS =============

export const competitors = pgTable("competitors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").notNull().references(() => brands.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  domain: text("domain").notNull(),
  logo: text("logo"),
  description: text("description"),
  industry: text("industry"),
  subindustry: text("subindustry"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  linkedinUrl: text("linkedin_url"),
  brandDevData: jsonb("brand_dev_data"), // Full Brand.dev API response
  isTracked: boolean("is_tracked").notNull().default(true),
  visibilityScore: real("visibility_score").default(0),
  trend7d: real("trend_7d").default(0),
  avgRank: real("avg_rank").default(0),
  mentions: integer("mentions").default(0),
  trafficEst: integer("traffic_est").default(0),
  threatScore: real("threat_score").default(0),
  promptOverlapPct: real("prompt_overlap_pct").default(0),
  topDominatedDomains: text("top_dominated_domains").array(),
  riskLevel: text("risk_level"), // High, Medium, Low
  riskReason: text("risk_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCompetitorSchema = createInsertSchema(competitors).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCompetitor = z.infer<typeof insertCompetitorSchema>;
export type Competitor = typeof competitors.$inferSelect;

// ============= TOPICS =============

export const topics = pgTable("topics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").notNull().references(() => brands.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  category: text("category"),
  importance: text("importance"), // High, Medium, Low
  promptCount: integer("prompt_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTopicSchema = createInsertSchema(topics).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTopic = z.infer<typeof insertTopicSchema>;
export type Topic = typeof topics.$inferSelect;

// ============= PROMPT TEMPLATES (Admin) =============

export const promptTemplates = pgTable("prompt_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // visibility, citation, summarization, competitive
  llmProvider: text("llm_provider").notNull(), // chatgpt, claude, gemini, perplexity, all
  template: text("template").notNull(), // Template with {{variables}}
  variables: text("variables").array(), // ["brand_name", "industry", "topic"]
  version: integer("version").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false),
  abTestGroup: text("ab_test_group"), // A, B, or null
  abTestWeight: integer("ab_test_weight").default(50), // Weight percentage
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPromptTemplateSchema = createInsertSchema(promptTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPromptTemplate = z.infer<typeof insertPromptTemplateSchema>;
export type PromptTemplate = typeof promptTemplates.$inferSelect;

// ============= PROMPTS (Brand-specific) =============

export const prompts = pgTable("prompts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").notNull().references(() => brands.id, { onDelete: 'cascade' }),
  text: text("text").notNull(),
  category: text("category"),
  topicId: varchar("topic_id").references(() => topics.id, { onDelete: 'set null' }),
  templateId: varchar("template_id").references(() => promptTemplates.id, { onDelete: 'set null' }),
  modelsCovered: text("models_covered").array(),
  avgRank: real("avg_rank").default(0),
  visibilityPct: real("visibility_pct").default(0),
  topCompetitorId: varchar("top_competitor_id").references(() => competitors.id, { onDelete: 'set null' }),
  isBrandPresent: boolean("is_brand_present").default(false),
  priorityScore: integer("priority_score").default(0),
  sentiment: text("sentiment"), // positive, neutral, negative
  runCount: integer("run_count").default(0),
  lastChecked: timestamp("last_checked"),
  status: text("status").default("active"), // active, paused, archived
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("prompts_brand_id_idx").on(table.brandId),
]);

export const insertPromptSchema = createInsertSchema(prompts).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPrompt = z.infer<typeof insertPromptSchema>;
export type Prompt = typeof prompts.$inferSelect;

// ============= PROMPT RESULTS (LLM Responses) =============

export const promptResults = pgTable("prompt_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  promptId: varchar("prompt_id").notNull().references(() => prompts.id, { onDelete: 'cascade' }),
  brandId: varchar("brand_id").notNull().references(() => brands.id, { onDelete: 'cascade' }),
  llmProvider: text("llm_provider").notNull(), // chatgpt, claude, gemini, perplexity
  llmModel: text("llm_model"), // gpt-4, claude-3, etc
  response: text("response"),
  brandMentioned: boolean("brand_mentioned").default(false),
  brandPosition: integer("brand_position"), // Position in list (1-10)
  competitorsMentioned: text("competitors_mentioned").array(),
  citationUrls: text("citation_urls").array(),
  sentiment: text("sentiment"),
  confidence: real("confidence"),
  tokensUsed: integer("tokens_used"),
  latencyMs: integer("latency_ms"),
  cost: real("cost"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("prompt_results_prompt_id_idx").on(table.promptId),
  index("prompt_results_brand_id_idx").on(table.brandId),
]);

export const insertPromptResultSchema = createInsertSchema(promptResults).omit({ id: true, createdAt: true });
export type InsertPromptResult = z.infer<typeof insertPromptResultSchema>;
export type PromptResult = typeof promptResults.$inferSelect;

// ============= SOURCES/CITATIONS =============

export const sources = pgTable("sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").notNull().references(() => brands.id, { onDelete: 'cascade' }),
  domain: text("domain").notNull(),
  url: text("url"),
  title: text("title"),
  mentions: integer("mentions").default(0),
  domainAuthority: integer("domain_authority").default(0),
  trafficValue: integer("traffic_value").default(0),
  modelsCited: text("models_cited").array(),
  citationType: text("citation_type"), // owned, earned, competitor
  sourceType: text("source_type"), // corporate, educational, news, wiki, review
  firstSeen: timestamp("first_seen").defaultNow(),
  lastSeen: timestamp("last_seen").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("sources_brand_id_idx").on(table.brandId),
]);

export const insertSourceSchema = createInsertSchema(sources).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSource = z.infer<typeof insertSourceSchema>;
export type Source = typeof sources.$inferSelect;

// ============= INTEGRATIONS =============

export const integrations = pgTable("integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").notNull().references(() => brands.id, { onDelete: 'cascade' }),
  platform: text("platform").notNull(),
  status: text("status").notNull().default("disconnected"),
  accountId: text("account_id"),
  accountName: text("account_name"),
  credentials: jsonb("credentials"),
  lastSync: timestamp("last_sync"),
  syncError: text("sync_error"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertIntegrationSchema = createInsertSchema(integrations).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type Integration = typeof integrations.$inferSelect;

// ============= JOBS (Background Processing) =============

export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").references(() => brands.id, { onDelete: 'cascade' }),
  type: text("type").notNull(), // brand_enrichment, competitor_analysis, prompt_execution, etc
  status: text("status").notNull().default("pending"), // pending, running, completed, failed, cancelled
  priority: integer("priority").default(0),
  payload: jsonb("payload"),
  result: jsonb("result"),
  error: text("error"),
  attempts: integer("attempts").default(0),
  maxAttempts: integer("max_attempts").default(3),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  scheduledFor: timestamp("scheduled_for"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("jobs_brand_id_idx").on(table.brandId),
  index("jobs_status_idx").on(table.status),
]);

export const insertJobSchema = createInsertSchema(jobs).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;

// ============= ANALYSIS SCHEDULES =============

export const analysisSchedules = pgTable("analysis_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").notNull().references(() => brands.id, { onDelete: 'cascade' }),
  frequency: text("frequency").notNull().default("daily"), // hourly, daily, weekly
  isEnabled: boolean("is_enabled").notNull().default(true),
  lastRun: timestamp("last_run"),
  nextRun: timestamp("next_run"),
  runCount: integer("run_count").default(0),
  failCount: integer("fail_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAnalysisScheduleSchema = createInsertSchema(analysisSchedules).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAnalysisSchedule = z.infer<typeof insertAnalysisScheduleSchema>;
export type AnalysisSchedule = typeof analysisSchedules.$inferSelect;

// ============= AUDIT LOGS (Enterprise) =============

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'set null' }),
  brandId: varchar("brand_id").references(() => brands.id, { onDelete: 'set null' }),
  action: text("action").notNull(), // create, update, delete, login, export, etc
  entityType: text("entity_type").notNull(), // brand, competitor, prompt, user, etc
  entityId: varchar("entity_id"),
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("audit_logs_user_id_idx").on(table.userId),
  index("audit_logs_brand_id_idx").on(table.brandId),
  index("audit_logs_created_at_idx").on(table.createdAt),
]);

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// ============= AXP CONTENT (AI Experience Pages) =============

export const axpContent = pgTable("axp_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").notNull().references(() => brands.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  content: text("content"),
  contentHtml: text("content_html"),
  schemaJson: jsonb("schema_json"), // JSON-LD schema
  status: text("status").notNull().default("draft"), // draft, published, archived
  version: integer("version").notNull().default(1),
  publishedAt: timestamp("published_at"),
  publishedBy: varchar("published_by").references(() => users.id),
  gapAnalysisId: varchar("gap_analysis_id"),
  targetPrompts: text("target_prompts").array(),
  performanceScore: real("performance_score"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAxpContentSchema = createInsertSchema(axpContent).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAxpContent = z.infer<typeof insertAxpContentSchema>;
export type AxpContent = typeof axpContent.$inferSelect;

// ============= RELATIONS =============

export const planCapabilitiesRelations = relations(planCapabilities, ({ many }) => ({
  brands: many(brands),
}));

export const usersRelations = relations(users, ({ many }) => ({
  brands: many(brands),
  teamMemberships: many(teamMembers),
  auditLogs: many(auditLogs),
}));

export const brandsRelations = relations(brands, ({ one, many }) => ({
  owner: one(users, {
    fields: [brands.userId],
    references: [users.id],
  }),
  competitors: many(competitors),
  prompts: many(prompts),
  topics: many(topics),
  sources: many(sources),
  integrations: many(integrations),
  teamMembers: many(teamMembers),
  jobs: many(jobs),
  axpContent: many(axpContent),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  brand: one(brands, {
    fields: [teamMembers.brandId],
    references: [brands.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}));

export const competitorsRelations = relations(competitors, ({ one }) => ({
  brand: one(brands, {
    fields: [competitors.brandId],
    references: [brands.id],
  }),
}));

export const topicsRelations = relations(topics, ({ one, many }) => ({
  brand: one(brands, {
    fields: [topics.brandId],
    references: [brands.id],
  }),
  prompts: many(prompts),
}));

export const promptsRelations = relations(prompts, ({ one, many }) => ({
  brand: one(brands, {
    fields: [prompts.brandId],
    references: [brands.id],
  }),
  topic: one(topics, {
    fields: [prompts.topicId],
    references: [topics.id],
  }),
  template: one(promptTemplates, {
    fields: [prompts.templateId],
    references: [promptTemplates.id],
  }),
  results: many(promptResults),
}));

export const promptResultsRelations = relations(promptResults, ({ one }) => ({
  prompt: one(prompts, {
    fields: [promptResults.promptId],
    references: [prompts.id],
  }),
  brand: one(brands, {
    fields: [promptResults.brandId],
    references: [brands.id],
  }),
}));

export const sourcesRelations = relations(sources, ({ one }) => ({
  brand: one(brands, {
    fields: [sources.brandId],
    references: [brands.id],
  }),
}));

export const integrationsRelations = relations(integrations, ({ one }) => ({
  brand: one(brands, {
    fields: [integrations.brandId],
    references: [brands.id],
  }),
}));

export const jobsRelations = relations(jobs, ({ one }) => ({
  brand: one(brands, {
    fields: [jobs.brandId],
    references: [brands.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
  brand: one(brands, {
    fields: [auditLogs.brandId],
    references: [brands.id],
  }),
}));

export const axpContentRelations = relations(axpContent, ({ one }) => ({
  brand: one(brands, {
    fields: [axpContent.brandId],
    references: [brands.id],
  }),
}));

// ============= DOMAIN REGISTRY (Cost-saving de-dup) =============

export const domainRegistry = pgTable("domain_registry", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  domain: text("domain").notNull().unique(),
  entityId: varchar("entity_id"), // Reference to enriched entity data
  enrichmentData: jsonb("enrichment_data"), // Cached enrichment results
  competitorSets: jsonb("competitor_sets"), // Shared competitor discovery
  embeddingsHash: text("embeddings_hash"), // Hash of claims graph embeddings
  claimsGraph: jsonb("claims_graph"), // Knowledge graph data
  brandDevData: jsonb("brand_dev_data"), // brand.dev API cache
  brandDevExpiresAt: timestamp("brand_dev_expires_at"), // 30d TTL
  kgWikidataData: jsonb("kg_wikidata_data"), // Knowledge Graph/Wikidata cache
  kgWikidataExpiresAt: timestamp("kg_wikidata_expires_at"), // 90d TTL
  serpData: jsonb("serp_data"), // SERP results cache
  serpExpiresAt: timestamp("serp_expires_at"), // 3-7d TTL by plan
  llmAnswersData: jsonb("llm_answers_data"), // LLM responses cache
  llmAnswersExpiresAt: timestamp("llm_answers_expires_at"), // 7-30d TTL by plan
  usageCount: integer("usage_count").default(1), // How many brands share this
  lastAccessed: timestamp("last_accessed").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  domainIdx: index("domain_registry_domain_idx").on(table.domain),
}));

export const insertDomainRegistrySchema = createInsertSchema(domainRegistry).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDomainRegistry = z.infer<typeof insertDomainRegistrySchema>;
export type DomainRegistry = typeof domainRegistry.$inferSelect;

// ============= DATA TTL CONFIGURATION =============

export const dataTtlConfig = pgTable("data_ttl_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  planTier: text("plan_tier").notNull(), // free, starter, growth, enterprise
  sourceType: text("source_type").notNull(), // brand_dev, kg_wikidata, llm_answers, serp
  ttlDays: integer("ttl_days").notNull(),
  refreshPriority: text("refresh_priority").default("normal"), // high, normal, low
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDataTtlConfigSchema = createInsertSchema(dataTtlConfig).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDataTtlConfig = z.infer<typeof insertDataTtlConfigSchema>;
export type DataTtlConfig = typeof dataTtlConfig.$inferSelect;

// Default TTL rules (seeded in storage):
// brand_dev: 30d (all plans)
// kg_wikidata: 90d (all plans)
// llm_answers: free=7d, starter=14d, growth=21d, enterprise=30d
// serp: free=3d, starter=5d, growth=7d, enterprise=7d

// ============= LLM ANSWERS (Analytics Intelligence) =============

export const llmAnswers = pgTable("llm_answers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  promptId: varchar("prompt_id").notNull().references(() => prompts.id, { onDelete: 'cascade' }),
  brandId: varchar("brand_id").notNull().references(() => brands.id, { onDelete: 'cascade' }),
  llmProvider: text("llm_provider").notNull(), // chatgpt, claude, gemini, perplexity
  llmModel: text("llm_model").notNull(), // gpt-4, claude-3-opus, gemini-pro, etc
  rawResponse: text("raw_response").notNull(),
  parsedResponse: jsonb("parsed_response"), // Structured extraction
  responseHash: text("response_hash"), // For drift detection
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("llm_answers_prompt_id_idx").on(table.promptId),
  index("llm_answers_brand_id_idx").on(table.brandId),
  index("llm_answers_created_at_idx").on(table.createdAt),
]);

export const insertLlmAnswerSchema = createInsertSchema(llmAnswers).omit({ id: true, createdAt: true });
export type InsertLlmAnswer = z.infer<typeof insertLlmAnswerSchema>;
export type LlmAnswer = typeof llmAnswers.$inferSelect;

// ============= PROMPT RUNS (Execution Tracking) =============

export const promptRuns = pgTable("prompt_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  promptId: varchar("prompt_id").notNull().references(() => prompts.id, { onDelete: 'cascade' }),
  brandId: varchar("brand_id").notNull().references(() => brands.id, { onDelete: 'cascade' }),
  jobId: varchar("job_id").references(() => jobs.id, { onDelete: 'set null' }),
  status: text("status").notNull().default("pending"), // pending, running, completed, failed
  llmProvider: text("llm_provider").notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  tokensUsed: integer("tokens_used").default(0),
  cost: real("cost").default(0),
  error: text("error"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("prompt_runs_prompt_id_idx").on(table.promptId),
  index("prompt_runs_brand_id_idx").on(table.brandId),
  index("prompt_runs_status_idx").on(table.status),
]);

export const insertPromptRunSchema = createInsertSchema(promptRuns).omit({ id: true, createdAt: true });
export type InsertPromptRun = z.infer<typeof insertPromptRunSchema>;
export type PromptRun = typeof promptRuns.$inferSelect;

// ============= ANSWER MENTIONS (Brand/Competitor Detection) =============

export const answerMentions = pgTable("answer_mentions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  llmAnswerId: varchar("llm_answer_id").notNull().references(() => llmAnswers.id, { onDelete: 'cascade' }),
  brandId: varchar("brand_id").references(() => brands.id, { onDelete: 'cascade' }),
  competitorId: varchar("competitor_id").references(() => competitors.id, { onDelete: 'cascade' }),
  entityName: text("entity_name").notNull(), // Actual name mentioned
  position: integer("position"), // Rank in list (1-10)
  context: text("context"), // Surrounding text
  sentiment: text("sentiment"), // positive, neutral, negative
  confidence: real("confidence").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("answer_mentions_llm_answer_id_idx").on(table.llmAnswerId),
  index("answer_mentions_brand_id_idx").on(table.brandId),
  index("answer_mentions_competitor_id_idx").on(table.competitorId),
]);

export const insertAnswerMentionSchema = createInsertSchema(answerMentions).omit({ id: true, createdAt: true });
export type InsertAnswerMention = z.infer<typeof insertAnswerMentionSchema>;
export type AnswerMention = typeof answerMentions.$inferSelect;

// ============= ANSWER CITATIONS (Source Tracking) =============

export const answerCitations = pgTable("answer_citations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  llmAnswerId: varchar("llm_answer_id").notNull().references(() => llmAnswers.id, { onDelete: 'cascade' }),
  sourceId: varchar("source_id").references(() => sources.id, { onDelete: 'set null' }),
  url: text("url").notNull(),
  domain: text("domain").notNull(),
  title: text("title"),
  position: integer("position"), // Order in citation list
  citationType: text("citation_type"), // inline, footnote, reference
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("answer_citations_llm_answer_id_idx").on(table.llmAnswerId),
  index("answer_citations_source_id_idx").on(table.sourceId),
]);

export const insertAnswerCitationSchema = createInsertSchema(answerCitations).omit({ id: true, createdAt: true });
export type InsertAnswerCitation = z.infer<typeof insertAnswerCitationSchema>;
export type AnswerCitation = typeof answerCitations.$inferSelect;

// ============= VISIBILITY SCORES (Aggregated Metrics) =============

export const visibilityScores = pgTable("visibility_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").notNull().references(() => brands.id, { onDelete: 'cascade' }),
  competitorId: varchar("competitor_id").references(() => competitors.id, { onDelete: 'cascade' }),
  period: text("period").notNull(), // daily, weekly, monthly
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  overallScore: real("overall_score").default(0),
  mentionCount: integer("mention_count").default(0),
  avgPosition: real("avg_position").default(0),
  topPosition: integer("top_position"),
  promptsCovered: integer("prompts_covered").default(0),
  totalPrompts: integer("total_prompts").default(0),
  coverageRate: real("coverage_rate").default(0),
  sentimentScore: real("sentiment_score").default(0),
  citationCount: integer("citation_count").default(0),
  modelBreakdown: jsonb("model_breakdown"), // Per-model stats
  categoryBreakdown: jsonb("category_breakdown"), // Per-category stats
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("visibility_scores_brand_id_idx").on(table.brandId),
  index("visibility_scores_period_start_idx").on(table.periodStart),
]);

export const insertVisibilityScoreSchema = createInsertSchema(visibilityScores).omit({ id: true, createdAt: true });
export type InsertVisibilityScore = z.infer<typeof insertVisibilityScoreSchema>;
export type VisibilityScore = typeof visibilityScores.$inferSelect;

// ============= TREND SNAPSHOTS (Historical Tracking) =============

export const trendSnapshots = pgTable("trend_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").notNull().references(() => brands.id, { onDelete: 'cascade' }),
  snapshotDate: timestamp("snapshot_date").notNull(),
  visibilityScore: real("visibility_score").default(0),
  mentionCount: integer("mention_count").default(0),
  avgRank: real("avg_rank").default(0),
  competitorCount: integer("competitor_count").default(0),
  topCompetitorId: varchar("top_competitor_id").references(() => competitors.id),
  marketShare: real("market_share").default(0), // % of total mentions
  trendDirection: text("trend_direction"), // up, down, stable
  changePercent: real("change_percent").default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("trend_snapshots_brand_id_idx").on(table.brandId),
  index("trend_snapshots_snapshot_date_idx").on(table.snapshotDate),
]);

export const insertTrendSnapshotSchema = createInsertSchema(trendSnapshots).omit({ id: true, createdAt: true });
export type InsertTrendSnapshot = z.infer<typeof insertTrendSnapshotSchema>;
export type TrendSnapshot = typeof trendSnapshots.$inferSelect;

// ============= JOB RUNS (Execution History) =============

export const jobRuns = pgTable("job_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  runNumber: integer("run_number").notNull(),
  status: text("status").notNull().default("running"), // running, completed, failed
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  duration: integer("duration"), // milliseconds
  result: jsonb("result"),
  error: text("error"),
  logs: text("logs"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("job_runs_job_id_idx").on(table.jobId),
  index("job_runs_status_idx").on(table.status),
]);

export const insertJobRunSchema = createInsertSchema(jobRuns).omit({ id: true, createdAt: true });
export type InsertJobRun = z.infer<typeof insertJobRunSchema>;
export type JobRun = typeof jobRuns.$inferSelect;

// ============= JOB ERRORS (Error Tracking) =============

export const jobErrors = pgTable("job_errors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  jobRunId: varchar("job_run_id").references(() => jobRuns.id, { onDelete: 'cascade' }),
  errorType: text("error_type").notNull(), // api_error, timeout, validation, etc
  errorMessage: text("error_message").notNull(),
  stackTrace: text("stack_trace"),
  context: jsonb("context"),
  isResolved: boolean("is_resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("job_errors_job_id_idx").on(table.jobId),
  index("job_errors_is_resolved_idx").on(table.isResolved),
]);

export const insertJobErrorSchema = createInsertSchema(jobErrors).omit({ id: true, createdAt: true });
export type InsertJobError = z.infer<typeof insertJobErrorSchema>;
export type JobError = typeof jobErrors.$inferSelect;

// ============= AXP PAGES (AI Experience Pages) =============

export const axpPages = pgTable("axp_pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").notNull().references(() => brands.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  canonicalUrl: text("canonical_url"),
  status: text("status").notNull().default("draft"), // draft, published, archived
  currentVersionId: varchar("current_version_id"),
  publishedVersionId: varchar("published_version_id"),
  targetPrompts: text("target_prompts").array(),
  targetKeywords: text("target_keywords").array(),
  performanceScore: real("performance_score").default(0),
  viewCount: integer("view_count").default(0),
  botViewCount: integer("bot_view_count").default(0),
  lastCrawled: timestamp("last_crawled"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("axp_pages_brand_id_idx").on(table.brandId),
  index("axp_pages_slug_idx").on(table.slug),
]);

export const insertAxpPageSchema = createInsertSchema(axpPages).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAxpPage = z.infer<typeof insertAxpPageSchema>;
export type AxpPage = typeof axpPages.$inferSelect;

// ============= AXP VERSIONS (Version Control) =============

export const axpVersions = pgTable("axp_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pageId: varchar("page_id").notNull().references(() => axpPages.id, { onDelete: 'cascade' }),
  versionNumber: integer("version_number").notNull(),
  content: text("content").notNull(),
  contentHtml: text("content_html").notNull(),
  schemaJson: jsonb("schema_json"),
  changeDescription: text("change_description"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("axp_versions_page_id_idx").on(table.pageId),
]);

export const insertAxpVersionSchema = createInsertSchema(axpVersions).omit({ id: true, createdAt: true });
export type InsertAxpVersion = z.infer<typeof insertAxpVersionSchema>;
export type AxpVersion = typeof axpVersions.$inferSelect;

// ============= FAQ ENTRIES (Frequently Asked Questions) =============

export const faqEntries = pgTable("faq_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").notNull().references(() => brands.id, { onDelete: 'cascade' }),
  axpPageId: varchar("axp_page_id").references(() => axpPages.id, { onDelete: 'set null' }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: text("category"),
  evidenceUrls: text("evidence_urls").array(),
  publishMode: text("publish_mode").notNull().default("hidden"), // hidden, axp, website, both
  displayOrder: integer("display_order").default(0),
  viewCount: integer("view_count").default(0),
  helpfulCount: integer("helpful_count").default(0),
  notHelpfulCount: integer("not_helpful_count").default(0),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("faq_entries_brand_id_idx").on(table.brandId),
  index("faq_entries_axp_page_id_idx").on(table.axpPageId),
]);

export const insertFaqEntrySchema = createInsertSchema(faqEntries).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFaqEntry = z.infer<typeof insertFaqEntrySchema>;
export type FaqEntry = typeof faqEntries.$inferSelect;

// ============= SCHEMA TEMPLATES (JSON-LD Templates) =============

export const schemaTemplates = pgTable("schema_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").references(() => brands.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  schemaType: text("schema_type").notNull(), // Organization, Product, FAQPage, Article, LocalBusiness, BreadcrumbList
  template: jsonb("template").notNull(),
  isGlobal: boolean("is_global").default(false), // Admin-created global templates
  isActive: boolean("is_active").default(true),
  currentVersionId: varchar("current_version_id"),
  usageCount: integer("usage_count").default(0),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("schema_templates_brand_id_idx").on(table.brandId),
  index("schema_templates_schema_type_idx").on(table.schemaType),
]);

export const insertSchemaTemplateSchema = createInsertSchema(schemaTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSchemaTemplate = z.infer<typeof insertSchemaTemplateSchema>;
export type SchemaTemplate = typeof schemaTemplates.$inferSelect;

// ============= SCHEMA VERSIONS (Template Version Control) =============

export const schemaVersions = pgTable("schema_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull().references(() => schemaTemplates.id, { onDelete: 'cascade' }),
  versionNumber: integer("version_number").notNull(),
  template: jsonb("template").notNull(),
  changeDescription: text("change_description"),
  validationStatus: text("validation_status").default("valid"), // valid, invalid, warning
  validationErrors: jsonb("validation_errors"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("schema_versions_template_id_idx").on(table.templateId),
]);

export const insertSchemaVersionSchema = createInsertSchema(schemaVersions).omit({ id: true, createdAt: true });
export type InsertSchemaVersion = z.infer<typeof insertSchemaVersionSchema>;
export type SchemaVersion = typeof schemaVersions.$inferSelect;

// ============= SUBSCRIPTIONS (Billing) =============

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").notNull().references(() => brands.id, { onDelete: 'cascade' }),
  planId: varchar("plan_id").notNull().references(() => planCapabilities.id),
  status: text("status").notNull().default("active"), // active, cancelled, past_due, trialing
  billingCycle: text("billing_cycle").notNull().default("monthly"), // monthly, yearly
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAt: timestamp("cancel_at"),
  canceledAt: timestamp("canceled_at"),
  trialStart: timestamp("trial_start"),
  trialEnd: timestamp("trial_end"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  razorpaySubscriptionId: varchar("razorpay_subscription_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("subscriptions_brand_id_idx").on(table.brandId),
  index("subscriptions_status_idx").on(table.status),
]);

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

// ============= INVOICES (Billing Records) =============

export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").notNull().references(() => brands.id, { onDelete: 'cascade' }),
  subscriptionId: varchar("subscription_id").references(() => subscriptions.id, { onDelete: 'set null' }),
  invoiceNumber: varchar("invoice_number").notNull().unique(),
  status: text("status").notNull().default("draft"), // draft, open, paid, void, uncollectible
  amount: integer("amount").notNull(), // in cents
  currency: varchar("currency").notNull().default("USD"),
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  stripeInvoiceId: varchar("stripe_invoice_id"),
  razorpayInvoiceId: varchar("razorpay_invoice_id"),
  pdfUrl: text("pdf_url"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("invoices_brand_id_idx").on(table.brandId),
  index("invoices_status_idx").on(table.status),
]);

export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

// ============= PAYMENTS (Payment Tracking) =============

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").notNull().references(() => brands.id, { onDelete: 'cascade' }),
  invoiceId: varchar("invoice_id").references(() => invoices.id, { onDelete: 'set null' }),
  amount: integer("amount").notNull(), // in cents
  currency: varchar("currency").notNull().default("USD"),
  status: text("status").notNull().default("pending"), // pending, succeeded, failed, refunded
  paymentMethod: text("payment_method"), // card, upi, netbanking, wallet
  stripePaymentId: varchar("stripe_payment_id"),
  razorpayPaymentId: varchar("razorpay_payment_id"),
  failureReason: text("failure_reason"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("payments_brand_id_idx").on(table.brandId),
  index("payments_invoice_id_idx").on(table.invoiceId),
  index("payments_status_idx").on(table.status),
]);

export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// ============= WEBHOOK EVENTS (External Service Events) =============

export const webhookEvents = pgTable("webhook_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  source: text("source").notNull(), // stripe, razorpay, clerk, etc
  eventType: text("event_type").notNull(),
  eventId: varchar("event_id").notNull(), // External event ID
  payload: jsonb("payload").notNull(),
  processed: boolean("processed").default(false),
  processedAt: timestamp("processed_at"),
  error: text("error"),
  retryCount: integer("retry_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("webhook_events_source_idx").on(table.source),
  index("webhook_events_processed_idx").on(table.processed),
  index("webhook_events_event_id_idx").on(table.eventId),
]);

export const insertWebhookEventSchema = createInsertSchema(webhookEvents).omit({ id: true, createdAt: true });
export type InsertWebhookEvent = z.infer<typeof insertWebhookEventSchema>;
export type WebhookEvent = typeof webhookEvents.$inferSelect;

// ============= BRAND CONTEXT (Comprehensive Brand Intelligence) =============

export const brandContext = pgTable("brand_context", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").notNull().references(() => brands.id, { onDelete: 'cascade' }).unique(),
  
  // Core Identity
  brandIdentity: jsonb("brand_identity"), // Name, variations, taglines, mission, values
  productServices: jsonb("product_services"), // Products, features, pricing, USPs
  targetAudience: jsonb("target_audience"), // Demographics, personas, pain points
  
  // Market Intelligence
  industryContext: jsonb("industry_context"), // Industry, trends, regulations
  competitiveLandscape: jsonb("competitive_landscape"), // Competitors, positioning, SWOT
  marketPosition: jsonb("market_position"), // Market share, growth, opportunities
  
  // Content & Messaging
  keyMessages: jsonb("key_messages"), // Core messages, value props, differentiators
  contentThemes: jsonb("content_themes"), // Topics, categories, content pillars
  brandVoice: jsonb("brand_voice"), // Tone, style, language guidelines
  
  // Claims & Evidence
  claimsGraph: jsonb("claims_graph"), // Structured claims with evidence
  evidenceSources: jsonb("evidence_sources"), // Source URLs, citations, credibility
  factChecking: jsonb("fact_checking"), // Verification status, confidence scores
  
  // AI Visibility Data
  llmPerformance: jsonb("llm_performance"), // Per-model visibility metrics
  promptCoverage: jsonb("prompt_coverage"), // Which prompts mention the brand
  citationAnalysis: jsonb("citation_analysis"), // Citation patterns, source authority
  sentimentAnalysis: jsonb("sentiment_analysis"), // Sentiment trends, context
  
  // Optimization Insights
  gapAnalysis: jsonb("gap_analysis"), // Visibility gaps, opportunities
  recommendedActions: jsonb("recommended_actions"), // Prioritized improvements
  contentRecommendations: jsonb("content_recommendations"), // Suggested content
  
  // Integration Data
  gscData: jsonb("gsc_data"), // Google Search Console insights
  socialData: jsonb("social_data"), // Social media metrics
  analyticsData: jsonb("analytics_data"), // Web analytics
  
  // Embeddings & Search
  embeddingsVector: text("embeddings_vector"), // Vector embeddings for semantic search
  searchKeywords: text("search_keywords").array(), // Optimized keywords
  semanticTopics: text("semantic_topics").array(), // Related topics
  
  // Metadata
  lastEnriched: timestamp("last_enriched"),
  enrichmentVersion: integer("enrichment_version").default(1),
  dataQualityScore: real("data_quality_score").default(0), // 0-100
  completenessScore: real("completeness_score").default(0), // 0-100
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("brand_context_brand_id_idx").on(table.brandId),
]);

export const insertBrandContextSchema = createInsertSchema(brandContext).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBrandContext = z.infer<typeof insertBrandContextSchema>;
export type BrandContext = typeof brandContext.$inferSelect;
