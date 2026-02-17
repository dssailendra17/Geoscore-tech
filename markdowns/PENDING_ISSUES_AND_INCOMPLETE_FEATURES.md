# Pending Issues and Incomplete Features - GeoScore Application
**Date:** February 12, 2026  
**Status:** Comprehensive audit of all incomplete, broken, or pending features

---

## 🔴 CRITICAL ISSUES (Must Fix Immediately)

### 1. Onboarding Data Not Persisting to Database ❌
**Severity:** CRITICAL  
**Impact:** Users cannot use the application - all onboarding data is lost

**Evidence:**
- User completed full onboarding flow with Myntra brand
- Selected 3 competitors: Ajio, Flipkart Fashion, Amazon Fashion
- Selected 3 topics: Latest Myntra Collections, Myntra Fashion Deals, Comparison
- Selected 15 queries from suggested list
- Chose Free plan

**What's Broken:**
- ❌ Brand information NOT saved (Settings shows "Acme Corp" instead of "Myntra")
- ❌ Brand name: Shows "Acme Corp" instead of "Myntra"
- ❌ Website URL: Shows "https://acme.com" instead of "myntra.com"
- ❌ Product description: Shows Acme Corp description instead of Myntra
- ❌ Industry: Shows "Technology" instead of "E-commerce Fashion & Lifestyle"
- ❌ Prompts NOT saved (0 prompts instead of 15)
- ❌ Topics NOT saved (showing generic topics instead of Myntra-specific)
- ✅ Competitors WERE saved (3 competitors showing correctly)

**Files to Investigate:**
- `client/src/pages/Onboarding.tsx` - Onboarding flow logic
- `server/routes.ts` - Brand creation/update endpoints
- `server/storage.ts` - Database save operations
- `shared/schema.ts` - Brand schema validation

**Recommended Fix:**
1. Add logging to onboarding save operations
2. Check if brand creation API is being called
3. Verify database transactions are committing
4. Add error handling and user feedback for save failures

---

### 2. Logout Button Not Visible in UI ❌
**Severity:** CRITICAL  
**Impact:** Users cannot log out of the application

**Evidence:**
- User menu dropdown only shows "Profile" option
- Logout menu item defined in code but not rendering
- Screenshot: `test-09-user-menu-dropdown.png`

**Code Location:**
- `client/src/components/layout/AppShell.tsx` lines 105-108
- Logout menu item exists in code: `<DropdownMenuItem onClick={handleLogout}>`

**What's Working:**
- ✅ Logout API endpoint exists: `POST /api/auth/logout`
- ✅ Logout function exists in auth context: `signOut()`

**What's Broken:**
- ❌ Logout menu item not rendering in dropdown
- ❌ Users have no way to log out via UI

**Recommended Fix:**
1. Check conditional rendering logic in AppShell.tsx
2. Verify DropdownMenu component is rendering all children
3. Check CSS for hidden elements
4. Add console logging to debug menu item rendering

---

### 3. API Endpoint Errors (404 Not Found) ❌
**Severity:** HIGH  
**Impact:** Features not working, console errors

**Broken Endpoints:**
1. `/api/brands/b1/jobs` - 404 Not Found (multiple occurrences)
2. `/competitors/matrix` - 404 Not Found (2 errors)

**Evidence:**
- Console errors on Dashboard, Competitors, and Settings pages
- Features dependent on these endpoints not working

**Recommended Fix:**
1. Implement missing endpoints or fix routing
2. Add proper error handling for missing endpoints
3. Update frontend to handle 404 gracefully

---

## 🟠 HIGH PRIORITY ISSUES

### 4. All Metrics Showing 0 ❌
**Severity:** HIGH  
**Impact:** Dashboard appears empty, no useful data

**Affected Metrics:**
- AI Visibility Score: 0/100
- ChatGPT: 0
- Claude: 0
- Gemini: 0
- Perplexity: 0
- Total Prompts: 0
- AI Mentions: 0
- All competitor scores: 0

**Root Cause:**
- No LLM sampling jobs have been run
- No initial analysis triggered after onboarding
- Onboarding data not saved (see Issue #1)

**Recommended Fix:**
1. Fix onboarding data persistence (Issue #1)
2. Trigger initial LLM sampling job after onboarding completion
3. Implement background job to populate initial visibility scores
4. Add "Run Analysis" button for manual trigger

---

### 5. Placeholder/Demo Data Showing Instead of Real Data ⚠️
**Severity:** HIGH  
**Impact:** Confusing user experience, looks unprofessional

**Affected Pages:**
- **Dashboard:** Generic topics (Software Features, Pricing Comparison) instead of Myntra topics
- **Gap Analysis:** Generic placeholder content (Add schema markup, Update FAQ section)
- **Content & AXP:** Shows "Acme Corp" content instead of Myntra
- **Settings:** Shows "Acme Corp" brand information

**Recommended Fix:**
1. Remove all hardcoded "Acme Corp" references
2. Replace placeholder data with actual brand data from database
3. Show empty states when no data available instead of fake data
4. Add proper loading states

---

### 6. Empty Field Validation Missing Custom Error Messages ⚠️
**Severity:** MEDIUM  
**Impact:** Poor user experience

**Current Behavior:**
- Browser validation prevents form submission
- No custom error messages shown to user

**Recommended Fix:**
1. Add custom validation error messages
2. Show field-level errors
3. Improve UX with clear feedback

---

### 7. "Add Prompt" Button Not Working ❌
**Severity:** MEDIUM  
**Impact:** Users cannot add custom prompts

**Current Behavior:**
- Button shows active state when clicked
- No dialog opens
- No functionality implemented

**Recommended Fix:**
1. Implement prompt creation dialog
2. Add form for prompt input
3. Connect to API endpoint for saving prompts

---

## 🟡 MEDIUM PRIORITY ISSUES

### 8. Empty Data States Not User-Friendly ⚠️
**Affected Pages:**
- **Prompts:** "No prompts match your filters" (should say "No prompts yet. Add your first prompt!")
- **Sources:** "No sources found yet. Run prompt analyses to discover cited sources"
- **Head-to-Head Analysis:** "Run prompt analyses to see head-to-head comparisons"
- **Market Share:** "Market share data will appear after analysis"

**Recommended Fix:**
1. Add helpful empty states with call-to-action buttons
2. Guide users on what to do next
3. Add illustrations or icons for better UX

---

### 9. Missing Features/Implementations ⚠️

**Features Mentioned in Code but Not Implemented:**
1. ❌ Password visibility toggle (Sign In page)
2. ❌ Remember me functionality (Sign In page)
3. ❌ Email format validation (Sign In/Sign Up)
4. ❌ Weak password validation (Password Reset)
5. ❌ OTP resend functionality (Email Verification)
6. ❌ OTP expiry handling (Email Verification)
7. ❌ Session expiry handling
8. ❌ Concurrent session management

---

## 📋 PENDING TESTS (Not Completed)

### Module 4: Sign In Flow (6 remaining)
- "Sign up" link functionality
- Invalid email format validation
- Password visibility toggle
- Remember me functionality
- Session persistence after login

### Module 5: Forgot Password Flow (4 remaining)
- Invalid email format
- Non-existent email
- Invalid OTP
- Password mismatch validation

### Module 6: Session Persistence (4 remaining)
- Logout functionality (blocked by Issue #2)
- Session persistence after page refresh
- Accessing protected routes after logout
- Session expiry

### Module 7: Route Protection (8 tests)
- All protected routes without authentication

### Module 11: API Endpoints (50+ tests)
- All API endpoint testing

**Total Pending Tests:** 106+ tests (91.4% of planned tests)

---

## 🔧 TECHNICAL DEBT

### 1. Hardcoded Data
- "Acme Corp" references throughout codebase
- Placeholder visibility scores (72, 85, etc.)
- Fake device data (Chrome on MacBook Pro, Safari on iPhone 15)
- Generic topic names

### 2. Missing Error Handling
- No error handling for failed API calls
- No retry logic for failed requests
- No user feedback for errors

### 3. Missing Loading States
- No loading indicators for async operations
- No skeleton loaders for data fetching

### 4. Missing Validation
- Weak client-side validation
- No server-side validation for some endpoints

---

## 📊 COMPLETION STATUS

### Features Completed: ~40%
- ✅ Authentication (Sign Up, Sign In, Email Verification, Forgot Password)
- ✅ Onboarding UI (all 6 steps render correctly)
- ✅ Dashboard UI (all pages accessible)
- ✅ Competitor tracking (data saves correctly)
- ✅ Integrations page (shows connected platforms)

### Features Incomplete: ~60%
- ❌ Onboarding data persistence
- ❌ LLM sampling and analysis
- ❌ Visibility score calculation
- ❌ Prompt management
- ❌ Topic management
- ❌ Gap analysis generation
- ❌ Content & AXP generation
- ❌ Source intelligence
- ❌ Logout functionality

---

## 🎯 RECOMMENDED PRIORITY ORDER

### Phase 1: Critical Fixes (Week 1)
1. Fix onboarding data persistence
2. Fix logout button visibility
3. Fix API endpoint errors
4. Remove placeholder data

### Phase 2: Core Functionality (Week 2-3)
5. Implement LLM sampling jobs
6. Implement visibility score calculation
7. Implement prompt management
8. Implement topic management

### Phase 3: Polish & Testing (Week 4)
9. Complete all pending tests
10. Add proper error handling
11. Add loading states
12. Improve empty states

---

**Report Generated:** February 12, 2026  
**Total Issues Identified:** 19 major issues  
**Estimated Fix Time:** 4-6 weeks for complete resolution

