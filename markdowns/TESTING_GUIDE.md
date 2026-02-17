# GeoScore - QA Testing Guide

**Application:** GeoScore - AI Brand Intelligence Platform
**Version:** 1.0
**Date:** February 11, 2026
**Environment:** Production (deployed on Replit)

---

## Table of Contents

1. [Prerequisites & Environment Setup](#1-prerequisites--environment-setup)
2. [Test Data & Conventions](#2-test-data--conventions)
3. [Module 1: Landing Page](#3-module-1-landing-page)
4. [Module 2: Sign Up Flow](#4-module-2-sign-up-flow)
5. [Module 3: Email Verification (OTP)](#5-module-3-email-verification-otp)
6. [Module 4: Sign In Flow](#6-module-4-sign-in-flow)
7. [Module 5: Forgot Password Flow](#7-module-5-forgot-password-flow)
8. [Module 6: Session & Authentication Persistence](#8-module-6-session--authentication-persistence)
9. [Module 7: Route Protection & Authorization](#9-module-7-route-protection--authorization)
10. [Module 8: Onboarding](#10-module-8-onboarding)
11. [Module 9: Dashboard & App Navigation](#11-module-9-dashboard--app-navigation)
12. [Module 10: Admin Panel](#12-module-10-admin-panel)
13. [Module 11: API Endpoint Testing](#13-module-11-api-endpoint-testing)
14. [Module 12: Security Testing](#14-module-12-security-testing)
15. [Module 13: Cross-Browser & Responsive Testing](#15-module-13-cross-browser--responsive-testing)
16. [Element Locators (data-testid Reference)](#16-element-locators)

---

## 1. Prerequisites & Environment Setup

### Required Environment Variables (Production)
| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | JWT signing secret (must be set in production) |
| `SMTP_HOST` | SMTP server for sending OTP emails |
| `SMTP_PORT` | SMTP port (default: 587) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_FROM` | Sender email address (default: noreply@geoscore.in) |

### Development Mode Notes
- If SMTP is not configured, OTP codes are logged to the server console instead of being emailed. Check the server logs for lines like:
  ```
  ========================================
    EMAIL TO: user@example.com
    SUBJECT: Verify your GeoScore account
    Your verification code is: 123456 ...
  ========================================
  ```

### Access URLs
| Page | URL |
|---|---|
| Landing Page | `/` |
| Sign In | `/auth/sign-in` |
| Sign Up | `/auth/sign-up` |
| Email Verification | `/auth/verify-email?email=...` |
| Forgot Password | `/auth/forgot-password` |
| Onboarding | `/onboarding` |
| Dashboard | `/app/dashboard` |
| Admin Panel | `/admin` |

---

## 2. Test Data & Conventions

### Test User Template
| Field | Value |
|---|---|
| First Name | QATest |
| Last Name | User |
| Email | Use a unique email per test run (e.g., qatest+001@yourdomain.com) |
| Password | TestPass123! (min 8 characters) |

### OTP Code
- 6-digit numeric code
- Expires after 10 minutes
- In dev mode, check server console for the code

---

## 3. Module 1: Landing Page

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| LP-01 | Landing page loads | Navigate to `/` | Page loads with branding, hero section, and navigation |
| LP-02 | Navigate to Sign In | Click "Sign In" link on landing page | Redirects to `/auth/sign-in` |
| LP-03 | Navigate to Sign Up | Click "Sign Up" / "Get Started" link | Redirects to `/auth/sign-up` |

---

## 4. Module 2: Sign Up Flow

### Happy Path

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| SU-01 | Successful sign up | 1. Navigate to `/auth/sign-up`<br>2. Fill First Name, Last Name, Email, Password<br>3. Click "Sign Up" | Loading spinner appears, then redirects to `/auth/verify-email?email=...` |
| SU-02 | Form elements present | Navigate to `/auth/sign-up` | All fields visible: First Name (`input-first-name`), Last Name (`input-last-name`), Email (`input-email`), Password (`input-password`), Sign Up button (`button-signup`) |

### Validation & Error Cases

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| SU-03 | Empty first name | Submit form with empty first name | Browser validation prevents submission (field is required) |
| SU-04 | Empty last name | Submit form with empty last name | Browser validation prevents submission (field is required) |
| SU-05 | Empty email | Submit form with empty email | Browser validation prevents submission (field is required) |
| SU-06 | Invalid email format | Enter "notanemail" in email field and submit | Browser validation shows email format error |
| SU-07 | Empty password | Submit form with empty password | Browser validation prevents submission (field is required) |
| SU-08 | Password too short | Enter password with less than 8 characters | Browser validation shows minimum length error |
| SU-09 | Duplicate email (verified) | Sign up with an email that already has a verified account | Error message displayed: "An account with this email already exists" (`text-signup-error`) |
| SU-10 | Duplicate email (unverified) | Sign up with an email that exists but is unverified | New OTP sent, redirects to verify email page |

### Navigation

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| SU-11 | Navigate to Sign In | Click "Already have an account? Sign in" (`link-signin`) | Navigates to `/auth/sign-in` |

---

## 5. Module 3: Email Verification (OTP)

### Happy Path

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| VE-01 | Successful verification | 1. After sign up, arrive at `/auth/verify-email?email=...`<br>2. Retrieve 6-digit OTP from email (or server console in dev)<br>3. Enter OTP digits in the 6 input boxes<br>4. Click "Verify Email" | User is verified, JWT cookie set, redirects to `/onboarding` |
| VE-02 | OTP input auto-focus | Arrive at verify page | First OTP input field is automatically focused |
| VE-03 | OTP auto-advance | Type a digit in any OTP field | Cursor auto-advances to the next field |
| VE-04 | OTP paste | Copy a 6-digit number and paste into any OTP field | All 6 fields are filled automatically |
| VE-05 | Resend OTP | Click "Resend Code" (`button-resend-otp`) | Success message displayed: "A new code has been sent to your email" (`text-resend-success`) |

### Error Cases

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| VE-06 | Incomplete OTP | Enter fewer than 6 digits and click "Verify Email" | Error: "Please enter the complete 6-digit code" (`text-verify-error`) |
| VE-07 | Wrong OTP | Enter an incorrect 6-digit code | Error: "Invalid verification code" (`text-verify-error`) |
| VE-08 | Expired OTP | Wait 10+ minutes after receiving OTP, then enter it | Error: "Verification code has expired. Please request a new one." (`text-verify-error`) |
| VE-09 | Already verified email | Attempt to verify an already-verified email | Error: "Email already verified" |
| VE-10 | Non-numeric input | Attempt to type letters in OTP fields | Input is rejected (only digits accepted) |
| VE-11 | Backspace navigation | Press Backspace on an empty OTP field | Cursor moves to previous field |

---

## 6. Module 4: Sign In Flow

### Happy Path

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| SI-01 | Successful login (new user) | 1. Navigate to `/auth/sign-in`<br>2. Enter verified email and correct password<br>3. Click "Sign In" | Redirects to `/onboarding` (if onboarding not completed) |
| SI-02 | Successful login (existing user) | Login with a user who completed onboarding | Redirects to `/app/dashboard` |
| SI-03 | Form elements present | Navigate to `/auth/sign-in` | Email (`input-email`), Password (`input-password`), Sign In button (`button-signin`), Forgot password link (`link-forgot-password`), Sign Up link (`link-signup`) all visible |

### Error Cases

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| SI-04 | Wrong password | Enter correct email but wrong password | Error: "Invalid email or password" (`text-signin-error`) |
| SI-05 | Non-existent email | Enter an email that has never signed up | Error: "Invalid email or password" (`text-signin-error`) |
| SI-06 | Unverified account | Login with an email that has not been verified | Redirects to `/auth/verify-email?email=...` (a new OTP is sent automatically) |
| SI-07 | Empty email | Submit with empty email | Browser validation prevents submission |
| SI-08 | Empty password | Submit with empty password | Browser validation prevents submission |

### Navigation

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| SI-09 | Navigate to Forgot Password | Click "Forgot password?" (`link-forgot-password`) | Navigates to `/auth/forgot-password` |
| SI-10 | Navigate to Sign Up | Click "Don't have an account? Sign up" (`link-signup`) | Navigates to `/auth/sign-up` |

---

## 7. Module 5: Forgot Password Flow

### Step 1: Request Reset Code

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| FP-01 | Request reset code | 1. Navigate to `/auth/forgot-password`<br>2. Enter registered email<br>3. Click "Send Reset Code" (`button-send-reset`) | Advances to "Verify & Reset" step. An OTP is sent to the email. |
| FP-02 | Non-existent email | Enter an email not in the system | Same success-like message shown (no information leakage): "If an account exists with this email, a reset code has been sent." |
| FP-03 | Back to Sign In | Click "Back to Sign In" (`link-back-signin`) | Navigates to `/auth/sign-in` |

### Step 2: Verify OTP & Set New Password

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| FP-04 | Successful password reset | 1. After receiving reset OTP<br>2. Enter the 6-digit code<br>3. Enter new password (min 8 chars)<br>4. Confirm new password<br>5. Click "Reset Password" (`button-reset-password`) | Advances to success step |
| FP-05 | Incomplete OTP | Submit with fewer than 6 digits entered | Error: "Please enter the complete 6-digit code" (`text-reset-error`) |
| FP-06 | Wrong OTP | Enter incorrect 6-digit code | Error: "Invalid reset code" (`text-reset-error`) |
| FP-07 | Expired OTP | Use a reset code after 10+ minutes | Error: "Reset code has expired. Please request a new one." (`text-reset-error`) |
| FP-08 | Password too short | Enter new password with < 8 characters | Error: "Password must be at least 8 characters" (`text-reset-error`) |
| FP-09 | Passwords don't match | Enter different values in New Password and Confirm Password | Error: "Passwords do not match" (`text-reset-error`) |
| FP-10 | Try different email | Click "Try a different email" (`link-back-email`) | Returns to the email entry step |

### Step 3: Success

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| FP-11 | Navigate to Sign In after reset | Click "Go to Sign In" (`button-goto-signin`) | Navigates to `/auth/sign-in` |
| FP-12 | Login with new password | After successful reset, sign in with the new password | Login succeeds, redirects to dashboard/onboarding |
| FP-13 | Old password no longer works | After reset, try signing in with the old password | Error: "Invalid email or password" |

---

## 8. Module 6: Session & Authentication Persistence

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| SS-01 | Session persists on page refresh | 1. Log in successfully<br>2. Refresh the page (F5) | User remains logged in, stays on the same page |
| SS-02 | Session persists across tabs | 1. Log in successfully<br>2. Open a new tab and navigate to `/app/dashboard` | User is authenticated in the new tab |
| SS-03 | JWT cookie set correctly | After login, inspect browser cookies | `auth_token` cookie exists, is httpOnly, has 7-day expiry |
| SS-04 | Logout clears session | 1. Log in<br>2. Trigger logout | `auth_token` cookie is cleared, user is redirected to sign-in |
| SS-05 | Expired JWT | Wait for JWT to expire (7 days) or manually clear cookie | User is treated as unauthenticated, redirected to sign-in |

---

## 9. Module 7: Route Protection & Authorization

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| RP-01 | Unauthenticated access to dashboard | Navigate to `/app/dashboard` without logging in | Redirected to `/auth/sign-in` |
| RP-02 | Unauthenticated access to onboarding | Navigate to `/onboarding` without logging in | Redirected to `/auth/sign-in` |
| RP-03 | Unauthenticated access to settings | Navigate to `/app/settings` without logging in | Redirected to `/auth/sign-in` |
| RP-04 | Non-admin access to admin panel | Log in as a regular user, navigate to `/admin` | Redirected to `/app/dashboard` |
| RP-05 | Admin access to admin panel | Log in as an admin user, navigate to `/admin` | Admin panel loads successfully |
| RP-06 | Auth pages when logged in | Log in, then navigate to `/auth/sign-in` | Page loads (no forced redirect away from auth pages) |
| RP-07 | Non-existent route | Navigate to `/app/nonexistent` | Shows 404 Not Found page |

### Protected App Routes to Verify
All of these should redirect to `/auth/sign-in` when not authenticated:

| Route | Page |
|---|---|
| `/app/dashboard` | Dashboard |
| `/app/prompts` | Prompts |
| `/app/competitors` | Competitors |
| `/app/sources` | Sources |
| `/app/integrations` | Integrations |
| `/app/search-console` | Search Console |
| `/app/gap-analysis` | Gap Analysis |
| `/app/brand-profile` | Brand Profile |
| `/app/ai-visibility` | AI Visibility |
| `/app/social` | Social & Community |
| `/app/content-axp` | Content AXP |
| `/app/action-plan` | Action Plan |
| `/app/settings` | Settings |
| `/app/profile` | Profile |

### Admin Routes to Verify
All should redirect non-admin users to `/app/dashboard`:

| Route | Page |
|---|---|
| `/admin` | Admin Login |
| `/admin/brands` | Admin Brands Manager |
| `/admin/plans` | Admin Plans |
| `/admin/prompt-templates` | Admin Prompt Templates |
| `/admin/audit-logs` | Admin Audit Logs |
| `/admin/settings` | Admin Settings |

---

## 10. Module 8: Onboarding

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| OB-01 | Onboarding loads after first login | Sign up, verify email, user is redirected | `/onboarding` page loads |
| OB-02 | Complete onboarding | Fill out all onboarding steps and submit | User's `onboardingCompleted` flag is set to true, redirected to `/app/dashboard` |
| OB-03 | Skip onboarding redirect after completion | Log out and log back in after completing onboarding | Redirected directly to `/app/dashboard` (not `/onboarding`) |

---

## 11. Module 9: Dashboard & App Navigation

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| DN-01 | Dashboard loads | Log in and navigate to `/app/dashboard` | Dashboard page renders with sidebar navigation |
| DN-02 | Sidebar navigation | Click each item in the sidebar | Navigates to the corresponding page |
| DN-03 | All app pages load | Visit each route listed in the Protected App Routes table | Each page loads without errors |

---

## 12. Module 10: Admin Panel

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| AD-01 | Admin panel access | Log in as admin, navigate to `/admin` | Admin panel loads |
| AD-02 | Brands Manager | Navigate to `/admin/brands` | Lists all brands in the system |
| AD-03 | Plans management | Navigate to `/admin/plans` | Displays subscription plans |
| AD-04 | Prompt Templates | Navigate to `/admin/prompt-templates` | Displays prompt template management |
| AD-05 | Audit Logs | Navigate to `/admin/audit-logs` | Displays recent audit log entries |
| AD-06 | Admin Settings | Navigate to `/admin/settings` | Displays admin settings |

---

## 13. Module 11: API Endpoint Testing

Use tools like Postman, curl, or similar HTTP clients for these tests.

### Auth Endpoints

| # | Method | Endpoint | Body | Expected Status | Expected Response |
|---|---|---|---|---|---|
| API-01 | POST | `/api/auth/signup` | `{ firstName, lastName, email, password }` | 200 | `{ message, email }` |
| API-02 | POST | `/api/auth/signup` | Duplicate verified email | 409 | `{ error: "An account with this email already exists" }` |
| API-03 | POST | `/api/auth/verify-email` | `{ email, code }` | 200 | `{ message, user }` + Set-Cookie header |
| API-04 | POST | `/api/auth/verify-email` | Wrong code | 400 | `{ error: "Invalid verification code" }` |
| API-05 | POST | `/api/auth/resend-otp` | `{ email }` | 200 | `{ message }` |
| API-06 | POST | `/api/auth/login` | `{ email, password }` | 200 | `{ user }` + Set-Cookie header |
| API-07 | POST | `/api/auth/login` | Wrong password | 401 | `{ error: "Invalid email or password" }` |
| API-08 | POST | `/api/auth/login` | Unverified email | 403 | `{ error, needsVerification, email }` |
| API-09 | POST | `/api/auth/forgot-password` | `{ email }` | 200 | `{ message }` (always same message regardless of email existence) |
| API-10 | POST | `/api/auth/reset-password` | `{ email, code, newPassword }` | 200 | `{ message }` |
| API-11 | POST | `/api/auth/reset-password` | Wrong code | 400 | `{ error: "Invalid reset code" }` |
| API-12 | GET | `/api/auth/me` | (with auth cookie) | 200 | `{ user }` |
| API-13 | GET | `/api/auth/me` | (without auth cookie) | 401 | `{ error }` |
| API-14 | POST | `/api/auth/logout` | (any) | 200 | `{ message }` + clears auth_token cookie |

### Protected Endpoints (require auth cookie)

| # | Method | Endpoint | Expected (No Auth) | Expected (With Auth) |
|---|---|---|---|---|
| API-15 | GET | `/api/brands` | 401 | 200 with user's brands |
| API-16 | GET | `/api/users/me` | 401 | 200 with user data |
| API-17 | GET | `/api/plans` | 200 (public) | 200 with plans list |

---

## 14. Module 12: Security Testing

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| SC-01 | Rate limiting (auth) | Make 6+ requests to any auth endpoint within 15 minutes | 429 Too Many Requests after 5th request |
| SC-02 | Rate limiting (API) | Make 101+ requests to a general API endpoint within 15 minutes | 429 after 100th request |
| SC-03 | SQL injection in email | Enter `' OR 1=1 --` in email field on sign-in | Error message, no unauthorized access |
| SC-04 | XSS in name fields | Enter `<script>alert('xss')</script>` in first name during sign up | Script is not executed, text is escaped in the UI |
| SC-05 | Invalid JWT | Manually set `auth_token` cookie to a tampered value | User treated as unauthenticated, 401 on API calls |
| SC-06 | Expired JWT | Set cookie to a valid but expired JWT | 401 response, user redirected to sign-in |
| SC-07 | httpOnly cookie | Inspect cookies in browser DevTools | `auth_token` is marked httpOnly (not accessible via JavaScript) |
| SC-08 | Secure cookie in production | Check cookie attributes in production environment | `Secure` flag is set on the cookie |
| SC-09 | Password not exposed | Check all API responses | Password hash is never included in any API response |
| SC-10 | OTP brute force protection | Attempt multiple wrong OTPs in quick succession | Rate limited after 5 attempts per 15 minutes |
| SC-11 | Forgot password info leakage | Request password reset for non-existent email | Same generic message as for existing email (no leakage) |

---

## 15. Module 13: Cross-Browser & Responsive Testing

### Browsers to Test

| Browser | Version | Platform |
|---|---|---|
| Google Chrome | Latest | Windows, Mac |
| Firefox | Latest | Windows, Mac |
| Safari | Latest | Mac, iOS |
| Edge | Latest | Windows |
| Chrome Mobile | Latest | Android |
| Safari Mobile | Latest | iOS |

### Responsive Breakpoints

| # | Test Case | Viewport | Pages to Check |
|---|---|---|---|
| RB-01 | Mobile | 375 x 667 | Sign In, Sign Up, Verify Email, Forgot Password, Landing |
| RB-02 | Tablet | 768 x 1024 | All auth pages, Dashboard, Admin |
| RB-03 | Desktop | 1440 x 900 | All pages |
| RB-04 | Large Desktop | 1920 x 1080 | All pages |

### Key Items to Verify at Each Breakpoint
- Auth forms are centered and fully visible
- OTP input fields fit on screen without horizontal scroll
- Buttons are full-width and tappable on mobile
- Text is readable without zooming
- Sidebar collapses or adapts on smaller screens
- No horizontal overflow on any page

---

## 16. Element Locators

All interactive and important display elements have `data-testid` attributes for automated testing.

### Sign Up Page (`/auth/sign-up`)
| Element | data-testid |
|---|---|
| First Name input | `input-first-name` |
| Last Name input | `input-last-name` |
| Email input | `input-email` |
| Password input | `input-password` |
| Sign Up button | `button-signup` |
| Sign In link | `link-signin` |
| Error message | `text-signup-error` |

### Verify Email Page (`/auth/verify-email`)
| Element | data-testid |
|---|---|
| OTP digit inputs (0-5) | `input-otp-0` through `input-otp-5` |
| Verify Email button | `button-verify` |
| Resend Code button | `button-resend-otp` |
| Error message | `text-verify-error` |
| Resend success message | `text-resend-success` |

### Sign In Page (`/auth/sign-in`)
| Element | data-testid |
|---|---|
| Email input | `input-email` |
| Password input | `input-password` |
| Sign In button | `button-signin` |
| Forgot Password link | `link-forgot-password` |
| Sign Up link | `link-signup` |
| Error message | `text-signin-error` |

### Forgot Password Page (`/auth/forgot-password`)
| Element | data-testid |
|---|---|
| Email input (step 1) | `input-forgot-email` |
| Send Reset Code button | `button-send-reset` |
| Back to Sign In link | `link-back-signin` |
| Error message (step 1) | `text-forgot-error` |
| OTP digit inputs (0-5) | `input-reset-otp-0` through `input-reset-otp-5` |
| New Password input | `input-new-password` |
| Confirm Password input | `input-confirm-password` |
| Reset Password button | `button-reset-password` |
| Try different email link | `link-back-email` |
| Error message (step 2) | `text-reset-error` |
| Go to Sign In button (success) | `button-goto-signin` |

---

## Notes for the Testing Team

1. **OTP Retrieval in Dev/Staging:** If SMTP is not configured, OTP codes appear in the server console logs. Coordinate with the dev team to access these.
2. **Rate Limiting:** Auth endpoints are limited to 5 requests per 15 minutes per IP. If you get blocked during testing, wait 15 minutes or ask the dev team to temporarily increase the limit.
3. **Test Isolation:** Use unique email addresses for each test run to avoid conflicts. A pattern like `qatest+YYYYMMDD_NNN@domain.com` works well.
4. **Cookie Inspection:** Use browser DevTools (Application > Cookies) to inspect the `auth_token` cookie for session tests.
5. **Admin Testing:** An admin user must be manually flagged in the database (`isAdmin = true`). Ask the dev team to set this up for your test account.
