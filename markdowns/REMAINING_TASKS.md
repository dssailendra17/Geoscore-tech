# REMAINING TASKS - Quick Reference

**Last Updated:** January 17, 2026 - 23:45  
**Current Progress:** 92% Complete  
**Estimated Time to 100%:** 4-6 hours

---

## 🎯 HIGH PRIORITY TASKS (4-6 hours)

### 1. Gap Analysis Page Integration (1 hour)
**File:** `client/src/pages/GapAnalysis.tsx`

**What to do:**
- [ ] Import `useBrandContext` hook
- [ ] Fetch brand context with gap analysis data
- [ ] Replace mock gap data with real API data
- [ ] Add loading and error states
- [ ] Display real competitor gaps
- [ ] Show real opportunity scores

**API Endpoints:**
- `GET /api/brands/:brandId/context` - Returns brand context with gap analysis

---

### 2. Content & AXP Page Integration (1 hour)
**File:** `client/src/pages/ContentAXP.tsx`

**What to do:**
- [ ] Import AXP hooks from `use-content.ts`
- [ ] Fetch AXP pages for brand
- [ ] Replace mock AXP data with real API data
- [ ] Wire up create/edit/delete operations
- [ ] Add loading and error states
- [ ] Implement version history viewer

**API Endpoints:**
- `GET /api/brands/:brandId/axp-pages`
- `POST /api/brands/:brandId/axp-pages`
- `PATCH /api/axp-pages/:pageId`
- `DELETE /api/axp-pages/:pageId`

---

### 3. Onboarding Flow - Job Status Integration (1 hour)
**File:** `client/src/pages/Onboarding.tsx`

**What to do:**
- [ ] Import `JobProgressIndicator` component
- [ ] Add job status to Step 2 (brand enrichment)
- [ ] Show progress during enrichment
- [ ] Auto-advance to next step on completion
- [ ] Handle errors gracefully

**Example:**
```tsx
import { JobProgressIndicator } from "@/components/ui/job-status";

// In Step 2
{enrichmentJobId && (
  <JobProgressIndicator 
    jobId={enrichmentJobId}
    onComplete={() => goToStep(3)}
  />
)}
```

---

### 4. Admin Views - Job History Integration (1 hour)
**File:** `client/src/pages/admin/BrandDetails.tsx` (or similar)

**What to do:**
- [ ] Import `BrandJobsList` component
- [ ] Add "Job History" section to brand details
- [ ] Show recent jobs for the brand
- [ ] Add manual job trigger buttons
- [ ] Display job statistics

**Example:**
```tsx
import { BrandJobsList } from "@/components/ui/job-status";

<Card>
  <CardHeader>
    <CardTitle>Job History</CardTitle>
  </CardHeader>
  <CardContent>
    <BrandJobsList brandId={brandId} limit={10} />
  </CardContent>
</Card>
```

---

### 5. Admin Controls for AXP/FAQ/Schema (2 hours)
**Files:** 
- `client/src/pages/admin/ContentManagement.tsx` (or create new)
- `client/src/pages/Settings.tsx`

**What to do:**
- [ ] Create admin UI for managing AXP templates
- [ ] Create admin UI for managing FAQ templates
- [ ] Create admin UI for managing Schema templates
- [ ] Wire up CRUD operations to API
- [ ] Add version control UI
- [ ] Add publish/rollback functionality

**API Endpoints:**
- AXP: `/api/brands/:brandId/axp-pages`
- FAQ: `/api/brands/:brandId/faqs`
- Schema: `/api/brands/:brandId/schema-templates`

---

## 📊 MEDIUM PRIORITY TASKS (Optional)

### 6. Settings Page - Analysis Schedule (1 hour)
**File:** `client/src/pages/Settings.tsx`

**What to do:**
- [ ] Add "Last Analysis Run" section
- [ ] Show most recent job status
- [ ] Add manual trigger button
- [ ] Display next scheduled run time

---

### 7. Plan-Based Feature Limits (1 hour)
**Files:** Various components

**What to do:**
- [ ] Check user's plan tier from API
- [ ] Disable features based on plan limits
- [ ] Show upgrade prompts for locked features
- [ ] Add tooltips explaining limitations

---

## 🔧 LOW PRIORITY TASKS (Optional)

### 8. Additional Job Workers
- [ ] Competitor enrichment worker
- [ ] Topic generation worker
- [ ] Query generation worker
- [ ] SERP sampling worker
- [ ] Citation extraction enhancement

### 9. External Integrations
- [ ] Google Search Console
- [ ] Google Ads
- [ ] Social media APIs (Reddit, YouTube, X, LinkedIn)

### 10. Billing Integration
- [ ] Razorpay webhook handlers
- [ ] Subscription management UI
- [ ] Invoice PDF generation
- [ ] Usage tracking dashboard

---

## 📝 IMPLEMENTATION CHECKLIST

For each page integration, follow this checklist:

### ✅ Standard Integration Steps

1. **Import Hooks**
   ```tsx
   import { useHookName } from "@/hooks/use-analytics";
   ```

2. **Fetch Data**
   ```tsx
   const { data, isLoading, error } = useHookName(brandId);
   ```

3. **Add Loading State**
   ```tsx
   if (isLoading) {
     return <LoadingSpinner />;
   }
   ```

4. **Add Error State**
   ```tsx
   if (error) {
     return <ErrorMessage />;
   }
   ```

5. **Transform Data**
   ```tsx
   const transformedData = useMemo(() => {
     return data?.map(item => ({...}));
   }, [data]);
   ```

6. **Update Component**
   ```tsx
   return <Component data={transformedData} />;
   ```

7. **Test**
   - [ ] Loading state displays correctly
   - [ ] Error state displays correctly
   - [ ] Data displays correctly
   - [ ] No console errors
   - [ ] TypeScript compiles without errors

---

## 🚀 QUICK START GUIDE

### To Complete Gap Analysis Page:

1. Open `client/src/pages/GapAnalysis.tsx`
2. Add imports:
   ```tsx
   import { useBrandContext } from "@/hooks/use-brand-context";
   import { Loader2, AlertCircle } from "lucide-react";
   ```
3. Add data fetching:
   ```tsx
   const { data: context, isLoading, error } = useBrandContext(brandId);
   const gapData = context?.gapAnalysis || [];
   ```
4. Add loading/error states (copy from Dashboard.tsx)
5. Replace mock data with `gapData`
6. Test!

### To Complete Content & AXP Page:

1. Open `client/src/pages/ContentAXP.tsx`
2. Check `client/src/hooks/use-content.ts` for available hooks
3. Import and use hooks:
   ```tsx
   import { useAxpPages, useCreateAxpPage } from "@/hooks/use-content";
   ```
4. Follow standard integration steps above
5. Test CRUD operations

---

## 📚 REFERENCE FILES

- **API Client:** `client/src/lib/api.ts`
- **Hooks:** `client/src/hooks/`
  - `use-analytics.ts` - Analytics data
  - `use-brand-context.ts` - Brand context & enrichment
  - `use-content.ts` - AXP, FAQ, Schema
  - `use-jobs.ts` - Job status & monitoring
- **Job Components:** `client/src/components/ui/job-status.tsx`
- **Examples:** See `Dashboard.tsx`, `Prompts.tsx`, `AIVisibility.tsx`

---

## 🎯 SUCCESS CRITERIA

### For Each Task:
- ✅ No TypeScript errors
- ✅ No console errors
- ✅ Loading state works
- ✅ Error state works
- ✅ Real data displays correctly
- ✅ User can interact with features
- ✅ Code is clean and maintainable

### For Overall Completion:
- ✅ All high-priority pages integrated
- ✅ Job status UI integrated in key flows
- ✅ Admin controls functional
- ✅ No mock data in production code
- ✅ All features respect plan limits
- ✅ Documentation updated

---

## 💡 TIPS

1. **Copy-Paste Pattern:** Use Dashboard.tsx as a template for other pages
2. **Test Incrementally:** Test after each change, don't wait until the end
3. **Use TypeScript:** Let TypeScript guide you to correct API usage
4. **Check Network Tab:** Verify API calls are working in browser DevTools
5. **Read the Hooks:** Hook files have JSDoc comments explaining usage
6. **Fallback Data:** Always provide fallback/default values for missing data

---

## 📞 NEED HELP?

- **API Documentation:** See `IMPLEMENTATION_GUIDE.md`
- **Hook Usage:** See hook files in `client/src/hooks/`
- **Job Components:** See `JOB_STATUS_COMPONENTS_GUIDE.md`
- **Examples:** Check completed pages (Dashboard, Prompts, AIVisibility)

---

**Next Session Goal:** Complete at least 2-3 high-priority tasks to reach 95%+ completion!
