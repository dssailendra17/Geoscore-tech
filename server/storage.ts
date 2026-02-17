import {
  brands, type Brand, type InsertBrand,
  competitors, type Competitor, type InsertCompetitor,
  topics, type Topic, type InsertTopic,
  prompts, type Prompt, type InsertPrompt,
  promptResults, type PromptResult, type InsertPromptResult,
  sources, type Source, type InsertSource,
  integrations, type Integration, type InsertIntegration,
  users, type User, type InsertUser,
  planCapabilities, type PlanCapability, type InsertPlanCapability,
  promptTemplates, type PromptTemplate, type InsertPromptTemplate,
  teamMembers, type TeamMember, type InsertTeamMember,
  auditLogs, type AuditLog, type InsertAuditLog,
  jobs, type Job, type InsertJob,
  analysisSchedules, type AnalysisSchedule, type InsertAnalysisSchedule,
  axpContent, type AxpContent, type InsertAxpContent,
  // New tables
  llmAnswers, type LlmAnswer, type InsertLlmAnswer,
  promptRuns, type PromptRun, type InsertPromptRun,
  answerMentions, type AnswerMention, type InsertAnswerMention,
  answerCitations, type AnswerCitation, type InsertAnswerCitation,
  visibilityScores, type VisibilityScore, type InsertVisibilityScore,
  trendSnapshots, type TrendSnapshot, type InsertTrendSnapshot,
  jobRuns, type JobRun, type InsertJobRun,
  jobErrors, type JobError, type InsertJobError,
  axpPages, type AxpPage, type InsertAxpPage,
  axpVersions, type AxpVersion, type InsertAxpVersion,
  faqEntries, type FaqEntry, type InsertFaqEntry,
  schemaTemplates, type SchemaTemplate, type InsertSchemaTemplate,
  schemaVersions, type SchemaVersion, type InsertSchemaVersion,
  subscriptions, type Subscription, type InsertSubscription,
  invoices, type Invoice, type InsertInvoice,
  payments, type Payment, type InsertPayment,
  webhookEvents, type WebhookEvent, type InsertWebhookEvent,
  brandContext, type BrandContext, type InsertBrandContext,
  // Security tables
  loginAttempts, type LoginAttempt, type InsertLoginAttempt,
  accountLockouts, type AccountLockout, type InsertAccountLockout,
  userSessions, type UserSession, type InsertUserSession,
  securityEvents, type SecurityEvent, type InsertSecurityEvent,
  passwordHistory, type PasswordHistory, type InsertPasswordHistory,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, lt, gt, isNull, or, like, count } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User>;
  getAllUsers(limit?: number, offset?: number): Promise<User[]>;

  // Plan Capabilities
  getPlanCapability(id: string): Promise<PlanCapability | undefined>;
  getAllPlanCapabilities(): Promise<PlanCapability[]>;
  createPlanCapability(data: InsertPlanCapability): Promise<PlanCapability>;
  updatePlanCapability(id: string, data: Partial<InsertPlanCapability>): Promise<PlanCapability>;

  // Brands
  getBrand(id: string): Promise<Brand | undefined>;
  getBrandsByUserId(userId: string): Promise<Brand[]>;
  getBrandByDomain(domain: string): Promise<Brand | undefined>;
  createBrand(brand: InsertBrand): Promise<Brand>;
  updateBrand(id: string, data: Partial<InsertBrand>): Promise<Brand>;
  deleteBrand(id: string): Promise<void>;
  getAllBrands(limit?: number, offset?: number): Promise<Brand[]>;
  countBrands(): Promise<number>;

  // Team Members
  getTeamMembersByBrand(brandId: string): Promise<TeamMember[]>;
  createTeamMember(data: InsertTeamMember): Promise<TeamMember>;
  updateTeamMember(id: string, data: Partial<InsertTeamMember>): Promise<TeamMember>;
  deleteTeamMember(id: string): Promise<void>;

  // Competitors
  getCompetitorsByBrand(brandId: string): Promise<Competitor[]>;
  createCompetitor(competitor: InsertCompetitor): Promise<Competitor>;
  updateCompetitor(id: string, data: Partial<InsertCompetitor>): Promise<Competitor>;
  deleteCompetitor(id: string): Promise<void>;

  // Topics
  getTopicsByBrand(brandId: string): Promise<Topic[]>;
  createTopic(topic: InsertTopic): Promise<Topic>;
  updateTopic(id: string, data: Partial<InsertTopic>): Promise<Topic>;
  deleteTopic(id: string): Promise<void>;

  // Prompt Templates (Admin)
  getPromptTemplates(filters?: { category?: string; llmProvider?: string; isActive?: boolean }): Promise<PromptTemplate[]>;
  getPromptTemplate(id: string): Promise<PromptTemplate | undefined>;
  createPromptTemplate(data: InsertPromptTemplate): Promise<PromptTemplate>;
  updatePromptTemplate(id: string, data: Partial<InsertPromptTemplate>): Promise<PromptTemplate>;
  deletePromptTemplate(id: string): Promise<void>;

  // Prompts
  getPrompt(id: string): Promise<Prompt | undefined>;
  getPromptsByBrand(brandId: string): Promise<Prompt[]>;
  createPrompt(prompt: InsertPrompt): Promise<Prompt>;
  updatePrompt(id: string, data: Partial<InsertPrompt>): Promise<Prompt>;
  deletePrompt(id: string): Promise<void>;

  // Prompt Results
  getPromptResults(promptId: string, limit?: number): Promise<PromptResult[]>;
  createPromptResult(data: InsertPromptResult): Promise<PromptResult>;

  // Sources
  getSourcesByBrand(brandId: string): Promise<Source[]>;
  createSource(source: InsertSource): Promise<Source>;
  updateSource(id: string, data: Partial<InsertSource>): Promise<Source>;

  // Integrations
  getIntegrationsByBrand(brandId: string): Promise<Integration[]>;
  createIntegration(integration: InsertIntegration): Promise<Integration>;
  updateIntegration(id: string, data: Partial<InsertIntegration>): Promise<Integration>;

  // Jobs
  getJobsByBrand(brandId: string, limit?: number): Promise<Job[]>;
  getPendingJobs(limit?: number): Promise<Job[]>;
  createJob(data: InsertJob): Promise<Job>;
  updateJob(id: string, data: Partial<InsertJob>): Promise<Job>;

  // Analysis Schedules
  getAnalysisSchedule(brandId: string): Promise<AnalysisSchedule | undefined>;
  createAnalysisSchedule(data: InsertAnalysisSchedule): Promise<AnalysisSchedule>;
  updateAnalysisSchedule(id: string, data: Partial<InsertAnalysisSchedule>): Promise<AnalysisSchedule>;

  // Audit Logs
  getAuditLogs(filters: { brandId?: string; userId?: string; limit?: number; offset?: number }): Promise<AuditLog[]>;
  createAuditLog(data: InsertAuditLog): Promise<AuditLog>;

  // AXP Content (Legacy - keeping for backward compatibility)
  getAxpContentByBrand(brandId: string): Promise<AxpContent[]>;
  getAxpContent(id: string): Promise<AxpContent | undefined>;
  createAxpContent(data: InsertAxpContent): Promise<AxpContent>;
  updateAxpContent(id: string, data: Partial<InsertAxpContent>): Promise<AxpContent>;
  deleteAxpContent(id: string): Promise<void>;

  // ============= NEW ANALYTICS & INTELLIGENCE =============

  // LLM Answers
  getLlmAnswersByPrompt(promptId: string, limit?: number): Promise<LlmAnswer[]>;
  getLlmAnswersByBrand(brandId: string, limit?: number): Promise<LlmAnswer[]>;
  createLlmAnswer(data: InsertLlmAnswer): Promise<LlmAnswer>;

  // Prompt Runs
  getPromptRunsByPrompt(promptId: string, limit?: number): Promise<PromptRun[]>;
  getPromptRunsByBrand(brandId: string, limit?: number): Promise<PromptRun[]>;
  createPromptRun(data: InsertPromptRun): Promise<PromptRun>;
  updatePromptRun(id: string, data: Partial<InsertPromptRun>): Promise<PromptRun>;

  // Answer Mentions
  getAnswerMentionsByAnswer(llmAnswerId: string): Promise<AnswerMention[]>;
  getAnswerMentionsByBrand(brandId: string, limit?: number): Promise<AnswerMention[]>;
  createAnswerMention(data: InsertAnswerMention): Promise<AnswerMention>;

  // Answer Citations
  getAnswerCitationsByAnswer(llmAnswerId: string): Promise<AnswerCitation[]>;
  createAnswerCitation(data: InsertAnswerCitation): Promise<AnswerCitation>;

  // Visibility Scores
  getVisibilityScoresByBrand(brandId: string, period?: string, limit?: number): Promise<VisibilityScore[]>;
  getLatestVisibilityScore(brandId: string): Promise<VisibilityScore | undefined>;
  createVisibilityScore(data: InsertVisibilityScore): Promise<VisibilityScore>;

  // Trend Snapshots
  getTrendSnapshotsByBrand(brandId: string, limit?: number): Promise<TrendSnapshot[]>;
  createTrendSnapshot(data: InsertTrendSnapshot): Promise<TrendSnapshot>;

  // ============= JOB MANAGEMENT =============

  // Job Runs
  getJobRunsByJob(jobId: string, limit?: number): Promise<JobRun[]>;
  getLatestJobRun(jobId: string): Promise<JobRun | undefined>;
  createJobRun(data: InsertJobRun): Promise<JobRun>;
  updateJobRun(id: string, data: Partial<InsertJobRun>): Promise<JobRun>;

  // Job Errors
  getJobErrorsByJob(jobId: string, limit?: number): Promise<JobError[]>;
  getUnresolvedJobErrors(limit?: number): Promise<JobError[]>;
  createJobError(data: InsertJobError): Promise<JobError>;
  updateJobError(id: string, data: Partial<InsertJobError>): Promise<JobError>;

  // ============= CONTENT MANAGEMENT =============

  // AXP Pages
  getAxpPagesByBrand(brandId: string): Promise<AxpPage[]>;
  getAxpPage(id: string): Promise<AxpPage | undefined>;
  getAxpPageBySlug(brandId: string, slug: string): Promise<AxpPage | undefined>;
  createAxpPage(data: InsertAxpPage): Promise<AxpPage>;
  updateAxpPage(id: string, data: Partial<InsertAxpPage>): Promise<AxpPage>;
  deleteAxpPage(id: string): Promise<void>;

  // AXP Versions
  getAxpVersionsByPage(pageId: string): Promise<AxpVersion[]>;
  getAxpVersion(id: string): Promise<AxpVersion | undefined>;
  createAxpVersion(data: InsertAxpVersion): Promise<AxpVersion>;

  // FAQ Entries
  getFaqEntriesByBrand(brandId: string): Promise<FaqEntry[]>;
  getFaqEntriesByPage(axpPageId: string): Promise<FaqEntry[]>;
  getFaqEntry(id: string): Promise<FaqEntry | undefined>;
  createFaqEntry(data: InsertFaqEntry): Promise<FaqEntry>;
  updateFaqEntry(id: string, data: Partial<InsertFaqEntry>): Promise<FaqEntry>;
  deleteFaqEntry(id: string): Promise<void>;

  // Schema Templates
  getSchemaTemplatesByBrand(brandId: string): Promise<SchemaTemplate[]>;
  getGlobalSchemaTemplates(): Promise<SchemaTemplate[]>;
  getSchemaTemplate(id: string): Promise<SchemaTemplate | undefined>;
  createSchemaTemplate(data: InsertSchemaTemplate): Promise<SchemaTemplate>;
  updateSchemaTemplate(id: string, data: Partial<InsertSchemaTemplate>): Promise<SchemaTemplate>;
  deleteSchemaTemplate(id: string): Promise<void>;

  // Schema Versions
  getSchemaVersionsByTemplate(templateId: string): Promise<SchemaVersion[]>;
  getSchemaVersion(id: string): Promise<SchemaVersion | undefined>;
  createSchemaVersion(data: InsertSchemaVersion): Promise<SchemaVersion>;

  // ============= BILLING =============

  // Subscriptions
  getSubscriptionByBrand(brandId: string): Promise<Subscription | undefined>;
  createSubscription(data: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: string, data: Partial<InsertSubscription>): Promise<Subscription>;

  // Invoices
  getInvoicesByBrand(brandId: string, limit?: number): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  createInvoice(data: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, data: Partial<InsertInvoice>): Promise<Invoice>;

  // Payments
  getPaymentsByBrand(brandId: string, limit?: number): Promise<Payment[]>;
  getPaymentsByInvoice(invoiceId: string): Promise<Payment[]>;
  createPayment(data: InsertPayment): Promise<Payment>;
  updatePayment(id: string, data: Partial<InsertPayment>): Promise<Payment>;

  // Webhook Events
  getWebhookEvents(filters: { source?: string; processed?: boolean; limit?: number }): Promise<WebhookEvent[]>;
  createWebhookEvent(data: InsertWebhookEvent): Promise<WebhookEvent>;
  updateWebhookEvent(id: string, data: Partial<InsertWebhookEvent>): Promise<WebhookEvent>;

  // ============= BRAND CONTEXT =============

  // Brand Context (Comprehensive Intelligence)
  getBrandContext(brandId: string): Promise<BrandContext | undefined>;
  createBrandContext(data: InsertBrandContext): Promise<BrandContext>;
  updateBrandContext(id: string, data: Partial<InsertBrandContext>): Promise<BrandContext>;
  deleteBrandContext(id: string): Promise<void>;

  // ============= SECURITY & SESSION MANAGEMENT =============

  // Login Attempts
  createLoginAttempt(data: InsertLoginAttempt): Promise<LoginAttempt>;
  getRecentLoginAttempts(email: string, minutes: number): Promise<LoginAttempt[]>;

  // Account Lockouts
  createAccountLockout(data: InsertAccountLockout): Promise<AccountLockout>;
  getActiveLockout(userId: string): Promise<AccountLockout | undefined>;
  clearAccountLockout(userId: string): Promise<void>;

  // User Sessions
  createSession(data: InsertUserSession): Promise<UserSession>;
  getSession(sessionToken: string): Promise<UserSession | undefined>;
  updateSessionActivity(sessionToken: string): Promise<void>;
  revokeSession(sessionToken: string, reason: string): Promise<void>;
  getUserSessions(userId: string): Promise<UserSession[]>;
  revokeAllUserSessions(userId: string, reason: string): Promise<void>;

  // Security Events
  createSecurityEvent(data: InsertSecurityEvent): Promise<SecurityEvent>;
  getSecurityEvents(filters: { userId?: string; eventType?: string; severity?: string; limit?: number }): Promise<SecurityEvent[]>;

  // Password History
  addPasswordToHistory(userId: string, passwordHash: string): Promise<PasswordHistory>;
  checkPasswordHistory(userId: string, passwordHash: string, limit: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // ============= USERS =============
  
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async getAllUsers(limit = 100, offset = 0): Promise<User[]> {
    return await db.select().from(users).limit(limit).offset(offset).orderBy(desc(users.createdAt));
  }

  // ============= PLAN CAPABILITIES =============

  async getPlanCapability(id: string): Promise<PlanCapability | undefined> {
    const [plan] = await db.select().from(planCapabilities).where(eq(planCapabilities.id, id));
    return plan;
  }

  async getAllPlanCapabilities(): Promise<PlanCapability[]> {
    return await db.select().from(planCapabilities).orderBy(planCapabilities.monthlyPrice);
  }

  async createPlanCapability(data: InsertPlanCapability): Promise<PlanCapability> {
    const [plan] = await db.insert(planCapabilities).values(data).returning();
    return plan;
  }

  async updatePlanCapability(id: string, data: Partial<InsertPlanCapability>): Promise<PlanCapability> {
    const [updated] = await db
      .update(planCapabilities)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(planCapabilities.id, id))
      .returning();
    return updated;
  }

  // ============= BRANDS =============
  
  async getBrand(id: string): Promise<Brand | undefined> {
    const [brand] = await db.select().from(brands).where(eq(brands.id, id));
    return brand;
  }

  async getBrandsByUserId(userId: string): Promise<Brand[]> {
    return await db.select().from(brands).where(eq(brands.userId, userId));
  }

  async getBrandByDomain(domain: string): Promise<Brand | undefined> {
    const [brand] = await db.select().from(brands).where(eq(brands.domain, domain));
    return brand;
  }

  async createBrand(brandData: InsertBrand): Promise<Brand> {
    const [brand] = await db.insert(brands).values(brandData).returning();
    return brand;
  }

  async updateBrand(id: string, data: Partial<InsertBrand>): Promise<Brand> {
    const [updated] = await db
      .update(brands)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(brands.id, id))
      .returning();
    return updated;
  }

  async deleteBrand(id: string): Promise<void> {
    await db.delete(brands).where(eq(brands.id, id));
  }

  async getAllBrands(limit = 100, offset = 0): Promise<Brand[]> {
    return await db.select().from(brands).limit(limit).offset(offset).orderBy(desc(brands.createdAt));
  }

  async countBrands(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(brands);
    return result?.count || 0;
  }

  // ============= TEAM MEMBERS =============

  async getTeamMembersByBrand(brandId: string): Promise<TeamMember[]> {
    return await db.select().from(teamMembers).where(eq(teamMembers.brandId, brandId));
  }

  async createTeamMember(data: InsertTeamMember): Promise<TeamMember> {
    const [member] = await db.insert(teamMembers).values(data).returning();
    return member;
  }

  async updateTeamMember(id: string, data: Partial<InsertTeamMember>): Promise<TeamMember> {
    const [updated] = await db
      .update(teamMembers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(teamMembers.id, id))
      .returning();
    return updated;
  }

  async deleteTeamMember(id: string): Promise<void> {
    await db.delete(teamMembers).where(eq(teamMembers.id, id));
  }

  // ============= COMPETITORS =============
  
  async getCompetitorsByBrand(brandId: string): Promise<Competitor[]> {
    return await db.select().from(competitors).where(eq(competitors.brandId, brandId));
  }

  async createCompetitor(competitorData: InsertCompetitor): Promise<Competitor> {
    const [competitor] = await db.insert(competitors).values(competitorData).returning();
    return competitor;
  }

  async updateCompetitor(id: string, data: Partial<InsertCompetitor>): Promise<Competitor> {
    const [updated] = await db
      .update(competitors)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(competitors.id, id))
      .returning();
    return updated;
  }

  async deleteCompetitor(id: string): Promise<void> {
    await db.delete(competitors).where(eq(competitors.id, id));
  }

  // ============= TOPICS =============
  
  async getTopicsByBrand(brandId: string): Promise<Topic[]> {
    return await db.select().from(topics).where(eq(topics.brandId, brandId));
  }

  async createTopic(topicData: InsertTopic): Promise<Topic> {
    const [topic] = await db.insert(topics).values(topicData).returning();
    return topic;
  }

  async updateTopic(id: string, data: Partial<InsertTopic>): Promise<Topic> {
    const [updated] = await db
      .update(topics)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(topics.id, id))
      .returning();
    return updated;
  }

  async deleteTopic(id: string): Promise<void> {
    await db.delete(topics).where(eq(topics.id, id));
  }

  // ============= PROMPT TEMPLATES =============

  async getPromptTemplates(filters?: { category?: string; llmProvider?: string; isActive?: boolean }): Promise<PromptTemplate[]> {
    let query = db.select().from(promptTemplates);
    
    const conditions = [];
    if (filters?.category) conditions.push(eq(promptTemplates.category, filters.category));
    if (filters?.llmProvider) conditions.push(eq(promptTemplates.llmProvider, filters.llmProvider));
    if (filters?.isActive !== undefined) conditions.push(eq(promptTemplates.isActive, filters.isActive));
    
    if (conditions.length > 0) {
      return await db.select().from(promptTemplates).where(and(...conditions)).orderBy(desc(promptTemplates.createdAt));
    }
    return await db.select().from(promptTemplates).orderBy(desc(promptTemplates.createdAt));
  }

  async getPromptTemplate(id: string): Promise<PromptTemplate | undefined> {
    const [template] = await db.select().from(promptTemplates).where(eq(promptTemplates.id, id));
    return template;
  }

  async createPromptTemplate(data: InsertPromptTemplate): Promise<PromptTemplate> {
    const [template] = await db.insert(promptTemplates).values(data).returning();
    return template;
  }

  async updatePromptTemplate(id: string, data: Partial<InsertPromptTemplate>): Promise<PromptTemplate> {
    const [updated] = await db
      .update(promptTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(promptTemplates.id, id))
      .returning();
    return updated;
  }

  async deletePromptTemplate(id: string): Promise<void> {
    await db.delete(promptTemplates).where(eq(promptTemplates.id, id));
  }

  // ============= PROMPTS =============

  async getPrompt(id: string): Promise<Prompt | undefined> {
    const [prompt] = await db.select().from(prompts).where(eq(prompts.id, id));
    return prompt;
  }

  async getPromptsByBrand(brandId: string): Promise<Prompt[]> {
    return await db.select().from(prompts).where(eq(prompts.brandId, brandId));
  }

  async createPrompt(promptData: InsertPrompt): Promise<Prompt> {
    const [prompt] = await db.insert(prompts).values(promptData).returning();
    return prompt;
  }

  async updatePrompt(id: string, data: Partial<InsertPrompt>): Promise<Prompt> {
    const [updated] = await db
      .update(prompts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(prompts.id, id))
      .returning();
    return updated;
  }

  async deletePrompt(id: string): Promise<void> {
    await db.delete(prompts).where(eq(prompts.id, id));
  }

  // ============= PROMPT RESULTS =============

  async getPromptResults(promptId: string, limit = 10): Promise<PromptResult[]> {
    return await db.select().from(promptResults)
      .where(eq(promptResults.promptId, promptId))
      .orderBy(desc(promptResults.createdAt))
      .limit(limit);
  }

  async createPromptResult(data: InsertPromptResult): Promise<PromptResult> {
    const [result] = await db.insert(promptResults).values(data).returning();
    return result;
  }

  // ============= SOURCES =============
  
  async getSourcesByBrand(brandId: string): Promise<Source[]> {
    return await db.select().from(sources).where(eq(sources.brandId, brandId));
  }

  async createSource(sourceData: InsertSource): Promise<Source> {
    const [source] = await db.insert(sources).values(sourceData).returning();
    return source;
  }

  async updateSource(id: string, data: Partial<InsertSource>): Promise<Source> {
    const [updated] = await db
      .update(sources)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sources.id, id))
      .returning();
    return updated;
  }

  // ============= INTEGRATIONS =============
  
  async getIntegrationsByBrand(brandId: string): Promise<Integration[]> {
    return await db.select().from(integrations).where(eq(integrations.brandId, brandId));
  }

  async createIntegration(integrationData: InsertIntegration): Promise<Integration> {
    const [integration] = await db.insert(integrations).values(integrationData).returning();
    return integration;
  }

  async updateIntegration(id: string, data: Partial<InsertIntegration>): Promise<Integration> {
    const [updated] = await db
      .update(integrations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(integrations.id, id))
      .returning();
    return updated;
  }

  // ============= JOBS =============

  async getJobsByBrand(brandId: string, limit = 50): Promise<Job[]> {
    return await db.select().from(jobs)
      .where(eq(jobs.brandId, brandId))
      .orderBy(desc(jobs.createdAt))
      .limit(limit);
  }

  async getPendingJobs(limit = 100): Promise<Job[]> {
    return await db.select().from(jobs)
      .where(eq(jobs.status, "pending"))
      .orderBy(desc(jobs.priority), jobs.createdAt)
      .limit(limit);
  }

  async createJob(data: InsertJob): Promise<Job> {
    const [job] = await db.insert(jobs).values(data).returning();
    return job;
  }

  async updateJob(id: string, data: Partial<InsertJob>): Promise<Job> {
    const [updated] = await db
      .update(jobs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();
    return updated;
  }

  // ============= ANALYSIS SCHEDULES =============

  async getAnalysisSchedule(brandId: string): Promise<AnalysisSchedule | undefined> {
    const [schedule] = await db.select().from(analysisSchedules)
      .where(eq(analysisSchedules.brandId, brandId));
    return schedule;
  }

  async createAnalysisSchedule(data: InsertAnalysisSchedule): Promise<AnalysisSchedule> {
    const [schedule] = await db.insert(analysisSchedules).values(data).returning();
    return schedule;
  }

  async updateAnalysisSchedule(id: string, data: Partial<InsertAnalysisSchedule>): Promise<AnalysisSchedule> {
    const [updated] = await db
      .update(analysisSchedules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(analysisSchedules.id, id))
      .returning();
    return updated;
  }

  // ============= AUDIT LOGS =============

  async getAuditLogs(filters: { brandId?: string; userId?: string; limit?: number; offset?: number }): Promise<AuditLog[]> {
    const conditions = [];
    if (filters.brandId) conditions.push(eq(auditLogs.brandId, filters.brandId));
    if (filters.userId) conditions.push(eq(auditLogs.userId, filters.userId));

    let query = db.select().from(auditLogs);
    
    if (conditions.length > 0) {
      return await db.select().from(auditLogs)
        .where(and(...conditions))
        .orderBy(desc(auditLogs.createdAt))
        .limit(filters.limit || 100)
        .offset(filters.offset || 0);
    }
    
    return await db.select().from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(filters.limit || 100)
      .offset(filters.offset || 0);
  }

  async createAuditLog(data: InsertAuditLog): Promise<AuditLog> {
    const [log] = await db.insert(auditLogs).values(data).returning();
    return log;
  }

  // ============= AXP CONTENT =============

  async getAxpContentByBrand(brandId: string): Promise<AxpContent[]> {
    return await db.select().from(axpContent)
      .where(eq(axpContent.brandId, brandId))
      .orderBy(desc(axpContent.createdAt));
  }

  async getAxpContent(id: string): Promise<AxpContent | undefined> {
    const [content] = await db.select().from(axpContent).where(eq(axpContent.id, id));
    return content;
  }

  async createAxpContent(data: InsertAxpContent): Promise<AxpContent> {
    const [content] = await db.insert(axpContent).values(data).returning();
    return content;
  }

  async updateAxpContent(id: string, data: Partial<InsertAxpContent>): Promise<AxpContent> {
    const [updated] = await db
      .update(axpContent)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(axpContent.id, id))
      .returning();
    return updated;
  }

  async deleteAxpContent(id: string): Promise<void> {
    await db.delete(axpContent).where(eq(axpContent.id, id));
  }

  // ============= LLM ANSWERS =============

  async getLlmAnswersByPrompt(promptId: string, limit = 50): Promise<LlmAnswer[]> {
    return await db.select().from(llmAnswers)
      .where(eq(llmAnswers.promptId, promptId))
      .orderBy(desc(llmAnswers.createdAt))
      .limit(limit);
  }

  async getLlmAnswersByBrand(brandId: string, limit = 100): Promise<LlmAnswer[]> {
    return await db.select().from(llmAnswers)
      .where(eq(llmAnswers.brandId, brandId))
      .orderBy(desc(llmAnswers.createdAt))
      .limit(limit);
  }

  async createLlmAnswer(data: InsertLlmAnswer): Promise<LlmAnswer> {
    const [answer] = await db.insert(llmAnswers).values(data).returning();
    return answer;
  }

  // ============= PROMPT RUNS =============

  async getPromptRunsByPrompt(promptId: string, limit = 50): Promise<PromptRun[]> {
    return await db.select().from(promptRuns)
      .where(eq(promptRuns.promptId, promptId))
      .orderBy(desc(promptRuns.createdAt))
      .limit(limit);
  }

  async getPromptRunsByBrand(brandId: string, limit = 100): Promise<PromptRun[]> {
    return await db.select().from(promptRuns)
      .where(eq(promptRuns.brandId, brandId))
      .orderBy(desc(promptRuns.createdAt))
      .limit(limit);
  }

  async createPromptRun(data: InsertPromptRun): Promise<PromptRun> {
    const [run] = await db.insert(promptRuns).values(data).returning();
    return run;
  }

  async updatePromptRun(id: string, data: Partial<InsertPromptRun>): Promise<PromptRun> {
    const [updated] = await db
      .update(promptRuns)
      .set(data)
      .where(eq(promptRuns.id, id))
      .returning();
    return updated;
  }

  // ============= ANSWER MENTIONS =============

  async getAnswerMentionsByAnswer(llmAnswerId: string): Promise<AnswerMention[]> {
    return await db.select().from(answerMentions)
      .where(eq(answerMentions.llmAnswerId, llmAnswerId))
      .orderBy(answerMentions.position);
  }

  async getAnswerMentionsByBrand(brandId: string, limit = 100): Promise<AnswerMention[]> {
    return await db.select().from(answerMentions)
      .where(eq(answerMentions.brandId, brandId))
      .orderBy(desc(answerMentions.createdAt))
      .limit(limit);
  }

  async createAnswerMention(data: InsertAnswerMention): Promise<AnswerMention> {
    const [mention] = await db.insert(answerMentions).values(data).returning();
    return mention;
  }

  // ============= ANSWER CITATIONS =============

  async getAnswerCitationsByAnswer(llmAnswerId: string): Promise<AnswerCitation[]> {
    return await db.select().from(answerCitations)
      .where(eq(answerCitations.llmAnswerId, llmAnswerId))
      .orderBy(answerCitations.position);
  }

  async createAnswerCitation(data: InsertAnswerCitation): Promise<AnswerCitation> {
    const [citation] = await db.insert(answerCitations).values(data).returning();
    return citation;
  }

  // ============= VISIBILITY SCORES =============

  async getVisibilityScoresByBrand(brandId: string, period?: string, limit = 30): Promise<VisibilityScore[]> {
    const conditions = [eq(visibilityScores.brandId, brandId)];
    if (period) conditions.push(eq(visibilityScores.period, period));

    return await db.select().from(visibilityScores)
      .where(and(...conditions))
      .orderBy(desc(visibilityScores.periodStart))
      .limit(limit);
  }

  async getLatestVisibilityScore(brandId: string): Promise<VisibilityScore | undefined> {
    const [score] = await db.select().from(visibilityScores)
      .where(eq(visibilityScores.brandId, brandId))
      .orderBy(desc(visibilityScores.periodStart))
      .limit(1);
    return score;
  }

  async createVisibilityScore(data: InsertVisibilityScore): Promise<VisibilityScore> {
    const [score] = await db.insert(visibilityScores).values(data).returning();
    return score;
  }

  // ============= TREND SNAPSHOTS =============

  async getTrendSnapshotsByBrand(brandId: string, limit = 90): Promise<TrendSnapshot[]> {
    return await db.select().from(trendSnapshots)
      .where(eq(trendSnapshots.brandId, brandId))
      .orderBy(desc(trendSnapshots.snapshotDate))
      .limit(limit);
  }

  async createTrendSnapshot(data: InsertTrendSnapshot): Promise<TrendSnapshot> {
    const [snapshot] = await db.insert(trendSnapshots).values(data).returning();
    return snapshot;
  }

  // ============= JOB RUNS =============

  async getJobRunsByJob(jobId: string, limit = 50): Promise<JobRun[]> {
    return await db.select().from(jobRuns)
      .where(eq(jobRuns.jobId, jobId))
      .orderBy(desc(jobRuns.createdAt))
      .limit(limit);
  }

  async getLatestJobRun(jobId: string): Promise<JobRun | undefined> {
    const [run] = await db.select().from(jobRuns)
      .where(eq(jobRuns.jobId, jobId))
      .orderBy(desc(jobRuns.createdAt))
      .limit(1);
    return run;
  }

  async createJobRun(data: InsertJobRun): Promise<JobRun> {
    const [run] = await db.insert(jobRuns).values(data).returning();
    return run;
  }

  async updateJobRun(id: string, data: Partial<InsertJobRun>): Promise<JobRun> {
    const [updated] = await db
      .update(jobRuns)
      .set(data)
      .where(eq(jobRuns.id, id))
      .returning();
    return updated;
  }

  // ============= JOB ERRORS =============

  async getJobErrorsByJob(jobId: string, limit = 50): Promise<JobError[]> {
    return await db.select().from(jobErrors)
      .where(eq(jobErrors.jobId, jobId))
      .orderBy(desc(jobErrors.createdAt))
      .limit(limit);
  }

  async getUnresolvedJobErrors(limit = 100): Promise<JobError[]> {
    return await db.select().from(jobErrors)
      .where(eq(jobErrors.isResolved, false))
      .orderBy(desc(jobErrors.createdAt))
      .limit(limit);
  }

  async createJobError(data: InsertJobError): Promise<JobError> {
    const [error] = await db.insert(jobErrors).values(data).returning();
    return error;
  }

  async updateJobError(id: string, data: Partial<InsertJobError>): Promise<JobError> {
    const [updated] = await db
      .update(jobErrors)
      .set(data)
      .where(eq(jobErrors.id, id))
      .returning();
    return updated;
  }

  // ============= AXP PAGES =============

  async getAxpPagesByBrand(brandId: string): Promise<AxpPage[]> {
    return await db.select().from(axpPages)
      .where(eq(axpPages.brandId, brandId))
      .orderBy(desc(axpPages.createdAt));
  }

  async getAxpPage(id: string): Promise<AxpPage | undefined> {
    const [page] = await db.select().from(axpPages).where(eq(axpPages.id, id));
    return page;
  }

  async getAxpPageBySlug(brandId: string, slug: string): Promise<AxpPage | undefined> {
    const [page] = await db.select().from(axpPages)
      .where(and(eq(axpPages.brandId, brandId), eq(axpPages.slug, slug)));
    return page;
  }

  async createAxpPage(data: InsertAxpPage): Promise<AxpPage> {
    const [page] = await db.insert(axpPages).values(data).returning();
    return page;
  }

  async updateAxpPage(id: string, data: Partial<InsertAxpPage>): Promise<AxpPage> {
    const [updated] = await db
      .update(axpPages)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(axpPages.id, id))
      .returning();
    return updated;
  }

  async deleteAxpPage(id: string): Promise<void> {
    await db.delete(axpPages).where(eq(axpPages.id, id));
  }

  // ============= AXP VERSIONS =============

  async getAxpVersionsByPage(pageId: string): Promise<AxpVersion[]> {
    return await db.select().from(axpVersions)
      .where(eq(axpVersions.pageId, pageId))
      .orderBy(desc(axpVersions.versionNumber));
  }

  async getAxpVersion(id: string): Promise<AxpVersion | undefined> {
    const [version] = await db.select().from(axpVersions).where(eq(axpVersions.id, id));
    return version;
  }

  async createAxpVersion(data: InsertAxpVersion): Promise<AxpVersion> {
    const [version] = await db.insert(axpVersions).values(data).returning();
    return version;
  }

  // ============= FAQ ENTRIES =============

  async getFaqEntriesByBrand(brandId: string): Promise<FaqEntry[]> {
    return await db.select().from(faqEntries)
      .where(eq(faqEntries.brandId, brandId))
      .orderBy(faqEntries.displayOrder, desc(faqEntries.createdAt));
  }

  async getFaqEntriesByPage(axpPageId: string): Promise<FaqEntry[]> {
    return await db.select().from(faqEntries)
      .where(eq(faqEntries.axpPageId, axpPageId))
      .orderBy(faqEntries.displayOrder);
  }

  async getFaqEntry(id: string): Promise<FaqEntry | undefined> {
    const [entry] = await db.select().from(faqEntries).where(eq(faqEntries.id, id));
    return entry;
  }

  async createFaqEntry(data: InsertFaqEntry): Promise<FaqEntry> {
    const [entry] = await db.insert(faqEntries).values(data).returning();
    return entry;
  }

  async updateFaqEntry(id: string, data: Partial<InsertFaqEntry>): Promise<FaqEntry> {
    const [updated] = await db
      .update(faqEntries)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(faqEntries.id, id))
      .returning();
    return updated;
  }

  async deleteFaqEntry(id: string): Promise<void> {
    await db.delete(faqEntries).where(eq(faqEntries.id, id));
  }

  // ============= SCHEMA TEMPLATES =============

  async getSchemaTemplatesByBrand(brandId: string): Promise<SchemaTemplate[]> {
    return await db.select().from(schemaTemplates)
      .where(eq(schemaTemplates.brandId, brandId))
      .orderBy(desc(schemaTemplates.createdAt));
  }

  async getGlobalSchemaTemplates(): Promise<SchemaTemplate[]> {
    return await db.select().from(schemaTemplates)
      .where(eq(schemaTemplates.isGlobal, true))
      .orderBy(schemaTemplates.schemaType);
  }

  async getSchemaTemplate(id: string): Promise<SchemaTemplate | undefined> {
    const [template] = await db.select().from(schemaTemplates).where(eq(schemaTemplates.id, id));
    return template;
  }

  async createSchemaTemplate(data: InsertSchemaTemplate): Promise<SchemaTemplate> {
    const [template] = await db.insert(schemaTemplates).values(data).returning();
    return template;
  }

  async updateSchemaTemplate(id: string, data: Partial<InsertSchemaTemplate>): Promise<SchemaTemplate> {
    const [updated] = await db
      .update(schemaTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schemaTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteSchemaTemplate(id: string): Promise<void> {
    await db.delete(schemaTemplates).where(eq(schemaTemplates.id, id));
  }

  // ============= SCHEMA VERSIONS =============

  async getSchemaVersionsByTemplate(templateId: string): Promise<SchemaVersion[]> {
    return await db.select().from(schemaVersions)
      .where(eq(schemaVersions.templateId, templateId))
      .orderBy(desc(schemaVersions.versionNumber));
  }

  async getSchemaVersion(id: string): Promise<SchemaVersion | undefined> {
    const [version] = await db.select().from(schemaVersions).where(eq(schemaVersions.id, id));
    return version;
  }

  async createSchemaVersion(data: InsertSchemaVersion): Promise<SchemaVersion> {
    const [version] = await db.insert(schemaVersions).values(data).returning();
    return version;
  }

  // ============= SUBSCRIPTIONS =============

  async getSubscriptionByBrand(brandId: string): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions)
      .where(eq(subscriptions.brandId, brandId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    return subscription;
  }

  async createSubscription(data: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db.insert(subscriptions).values(data).returning();
    return subscription;
  }

  async updateSubscription(id: string, data: Partial<InsertSubscription>): Promise<Subscription> {
    const [updated] = await db
      .update(subscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return updated;
  }

  // ============= INVOICES =============

  async getInvoicesByBrand(brandId: string, limit = 50): Promise<Invoice[]> {
    return await db.select().from(invoices)
      .where(eq(invoices.brandId, brandId))
      .orderBy(desc(invoices.createdAt))
      .limit(limit);
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }

  async createInvoice(data: InsertInvoice): Promise<Invoice> {
    const [invoice] = await db.insert(invoices).values(data).returning();
    return invoice;
  }

  async updateInvoice(id: string, data: Partial<InsertInvoice>): Promise<Invoice> {
    const [updated] = await db
      .update(invoices)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return updated;
  }

  // ============= PAYMENTS =============

  async getPaymentsByBrand(brandId: string, limit = 50): Promise<Payment[]> {
    return await db.select().from(payments)
      .where(eq(payments.brandId, brandId))
      .orderBy(desc(payments.createdAt))
      .limit(limit);
  }

  async getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
    return await db.select().from(payments)
      .where(eq(payments.invoiceId, invoiceId))
      .orderBy(desc(payments.createdAt));
  }

  async createPayment(data: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values(data).returning();
    return payment;
  }

  async updatePayment(id: string, data: Partial<InsertPayment>): Promise<Payment> {
    const [updated] = await db
      .update(payments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return updated;
  }

  // ============= WEBHOOK EVENTS =============

  async getWebhookEvents(filters: { source?: string; processed?: boolean; limit?: number }): Promise<WebhookEvent[]> {
    const conditions = [];
    if (filters.source) conditions.push(eq(webhookEvents.source, filters.source));
    if (filters.processed !== undefined) conditions.push(eq(webhookEvents.processed, filters.processed));

    if (conditions.length > 0) {
      return await db.select().from(webhookEvents)
        .where(and(...conditions))
        .orderBy(desc(webhookEvents.createdAt))
        .limit(filters.limit || 100);
    }

    return await db.select().from(webhookEvents)
      .orderBy(desc(webhookEvents.createdAt))
      .limit(filters.limit || 100);
  }

  async createWebhookEvent(data: InsertWebhookEvent): Promise<WebhookEvent> {
    const [event] = await db.insert(webhookEvents).values(data).returning();
    return event;
  }

  async updateWebhookEvent(id: string, data: Partial<InsertWebhookEvent>): Promise<WebhookEvent> {
    const [updated] = await db
      .update(webhookEvents)
      .set(data)
      .where(eq(webhookEvents.id, id))
      .returning();
    return updated;
  }

  // ============= BRAND CONTEXT =============

  async getBrandContext(brandId: string): Promise<BrandContext | undefined> {
    const [context] = await db.select().from(brandContext)
      .where(eq(brandContext.brandId, brandId));
    return context;
  }

  async createBrandContext(data: InsertBrandContext): Promise<BrandContext> {
    const [context] = await db.insert(brandContext).values(data).returning();
    return context;
  }

  async updateBrandContext(id: string, data: Partial<InsertBrandContext>): Promise<BrandContext> {
    const [updated] = await db
      .update(brandContext)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(brandContext.id, id))
      .returning();
    return updated;
  }

  async deleteBrandContext(id: string): Promise<void> {
    await db.delete(brandContext).where(eq(brandContext.id, id));
  }

  // ============= DOMAIN REGISTRY =============

  async getDomainRegistryEntry(domain: string): Promise<DomainRegistry | undefined> {
    const [entry] = await db.select().from(domainRegistry)
      .where(eq(domainRegistry.domain, domain));
    return entry;
  }

  async getAllDomainRegistryEntries(): Promise<DomainRegistry[]> {
    return await db.select().from(domainRegistry);
  }

  async upsertDomainRegistry(data: InsertDomainRegistry): Promise<DomainRegistry> {
    const existing = await this.getDomainRegistryEntry(data.domain);
    
    if (existing) {
      const [updated] = await db
        .update(domainRegistry)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(domainRegistry.domain, data.domain))
        .returning();
      return updated;
    }

    const [entry] = await db.insert(domainRegistry).values(data).returning();
    return entry;
  }

  // ============= TTL CONFIG =============

  async getTTLConfig(dataType: string): Promise<DataTtlConfig | undefined> {
    const [config] = await db.select().from(dataTtlConfig)
      .where(eq(dataTtlConfig.dataType, dataType));
    return config;
  }

  async getAllTTLConfigs(): Promise<DataTtlConfig[]> {
    return await db.select().from(dataTtlConfig);
  }

  async upsertTTLConfig(data: InsertDataTtlConfig): Promise<DataTtlConfig> {
    const existing = await this.getTTLConfig(data.dataType);
    
    if (existing) {
      const [updated] = await db
        .update(dataTtlConfig)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(dataTtlConfig.dataType, data.dataType))
        .returning();
      return updated;
    }

    const [config] = await db.insert(dataTtlConfig).values(data).returning();
    return config;
  }

  // ============= ADDITIONAL HELPERS =============

  async getSubscription(id: string): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions)
      .where(eq(subscriptions.id, id));
    return subscription;
  }

  async getSubscriptionByBrandId(brandId: string): Promise<Subscription | undefined> {
    return this.getSubscriptionByBrand(brandId);
  }

  async getInvoiceByRazorpayId(razorpayInvoiceId: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices)
      .where(eq(invoices.razorpayInvoiceId, razorpayInvoiceId));
    return invoice;
  }

  async getGapAnalysisByBrand(brandId: string, limit = 50): Promise<GapAnalysis[]> {
    return await db.select().from(gapAnalysis)
      .where(eq(gapAnalysis.brandId, brandId))
      .orderBy(desc(gapAnalysis.createdAt))
      .limit(limit);
  }

  async createGapAnalysis(data: InsertGapAnalysis): Promise<GapAnalysis> {
    const [analysis] = await db.insert(gapAnalysis).values(data).returning();
    return analysis;
  }

  async getRecommendationsByBrand(brandId: string, limit = 50): Promise<Recommendation[]> {
    return await db.select().from(recommendations)
      .where(eq(recommendations.brandId, brandId))
      .orderBy(desc(recommendations.createdAt))
      .limit(limit);
  }

  async createRecommendation(data: InsertRecommendation): Promise<Recommendation> {
    const [recommendation] = await db.insert(recommendations).values(data).returning();
    return recommendation;
  }

  // ============= SECURITY & SESSION MANAGEMENT =============

  async createLoginAttempt(data: InsertLoginAttempt): Promise<LoginAttempt> {
    const [attempt] = await db.insert(loginAttempts).values(data).returning();
    return attempt;
  }

  async getRecentLoginAttempts(email: string, minutes: number): Promise<LoginAttempt[]> {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
    return await db.select().from(loginAttempts)
      .where(
        and(
          eq(loginAttempts.email, email),
          gt(loginAttempts.attemptedAt, cutoffTime)
        )
      )
      .orderBy(desc(loginAttempts.attemptedAt));
  }

  async createAccountLockout(data: InsertAccountLockout): Promise<AccountLockout> {
    const [lockout] = await db.insert(accountLockouts).values(data).returning();
    return lockout;
  }

  async getActiveLockout(userId: string): Promise<AccountLockout | undefined> {
    const [lockout] = await db.select().from(accountLockouts)
      .where(
        and(
          eq(accountLockouts.userId, userId),
          gt(accountLockouts.lockedUntil, new Date())
        )
      )
      .orderBy(desc(accountLockouts.lockedAt))
      .limit(1);
    return lockout;
  }

  async clearAccountLockout(userId: string): Promise<void> {
    await db.update(accountLockouts)
      .set({ lockedUntil: new Date() })
      .where(eq(accountLockouts.userId, userId));
  }

  async createSession(data: InsertUserSession): Promise<UserSession> {
    const [session] = await db.insert(userSessions).values(data).returning();
    return session;
  }

  async getSession(sessionToken: string): Promise<UserSession | undefined> {
    const [session] = await db.select().from(userSessions)
      .where(
        and(
          eq(userSessions.sessionToken, sessionToken),
          eq(userSessions.isActive, true),
          gt(userSessions.expiresAt, new Date())
        )
      )
      .limit(1);
    return session;
  }

  async updateSessionActivity(sessionToken: string): Promise<void> {
    await db.update(userSessions)
      .set({ lastActivity: new Date() })
      .where(eq(userSessions.sessionToken, sessionToken));
  }

  async revokeSession(sessionToken: string, reason: string): Promise<void> {
    await db.update(userSessions)
      .set({
        isActive: false,
        revokedAt: new Date(),
        revokeReason: reason,
      })
      .where(eq(userSessions.sessionToken, sessionToken));
  }

  async getUserSessions(userId: string): Promise<UserSession[]> {
    return await db.select().from(userSessions)
      .where(
        and(
          eq(userSessions.userId, userId),
          eq(userSessions.isActive, true),
          gt(userSessions.expiresAt, new Date())
        )
      )
      .orderBy(desc(userSessions.lastActivity));
  }

  async revokeAllUserSessions(userId: string, reason: string): Promise<void> {
    await db.update(userSessions)
      .set({
        isActive: false,
        revokedAt: new Date(),
        revokeReason: reason,
      })
      .where(
        and(
          eq(userSessions.userId, userId),
          eq(userSessions.isActive, true)
        )
      );
  }

  async createSecurityEvent(data: InsertSecurityEvent): Promise<SecurityEvent> {
    const [event] = await db.insert(securityEvents).values(data).returning();
    return event;
  }

  async getSecurityEvents(filters: { userId?: string; eventType?: string; severity?: string; limit?: number }): Promise<SecurityEvent[]> {
    const conditions = [];
    if (filters.userId) conditions.push(eq(securityEvents.userId, filters.userId));
    if (filters.eventType) conditions.push(eq(securityEvents.eventType, filters.eventType));
    if (filters.severity) conditions.push(eq(securityEvents.severity, filters.severity));

    return await db.select().from(securityEvents)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(securityEvents.createdAt))
      .limit(filters.limit || 100);
  }

  async addPasswordToHistory(userId: string, passwordHash: string): Promise<PasswordHistory> {
    const [history] = await db.insert(passwordHistory).values({ userId, passwordHash }).returning();
    return history;
  }

  async checkPasswordHistory(userId: string, passwordHash: string, limit: number): Promise<boolean> {
    const bcrypt = await import('bcryptjs');
    const recentPasswords = await db.select().from(passwordHistory)
      .where(eq(passwordHistory.userId, userId))
      .orderBy(desc(passwordHistory.createdAt))
      .limit(limit);

    for (const record of recentPasswords) {
      const matches = await bcrypt.compare(passwordHash, record.passwordHash);
      if (matches) return true;
    }
    return false;
  }
}

export const storage = new DatabaseStorage();
