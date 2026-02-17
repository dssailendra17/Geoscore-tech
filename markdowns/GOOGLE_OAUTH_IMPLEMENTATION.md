# Google OAuth Implementation Summary

## Overview
This document outlines the Google OAuth login/signup implementation for GeoScore, supporting both personal (@gmail.com) and business (Google Workspace) accounts.

## Implemented Features

### 1. Google OAuth Authentication ✅
**Requirement**: Support both personal and business Google accounts

**Implementation**:
- Passport.js with `passport-google-oauth20` strategy
- OAuth 2.0 flow with Google
- Supports both personal Gmail and Google Workspace accounts
- Automatic email verification (Google emails are pre-verified)
- Profile picture import from Google account

**Configuration**:
- Client ID and Secret configured in `.env`
- Callback URL: `http://localhost:5001/api/auth/google/callback`
- Scopes requested: `profile`, `email`

### 2. Google Login Button on Both Pages ✅
**Requirement**: Show Google login on both login and signup pages

**Implementation**:
- **Login Page** (`client/src/pages/auth/SignIn.tsx`):
  - Google button added below password field
  - "Or continue with" divider
  - Redirects to `/api/auth/google`
  
- **Signup Page** (`client/src/pages/auth/SignUp.tsx`):
  - Google button added below terms checkbox
  - "Or continue with" divider
  - Requires terms acceptance before OAuth flow
  - Redirects to `/api/auth/google`

### 3. Terms & Conditions Checkbox ✅
**Requirement**: Add "I agree to terms & conditions and privacy policy" checkbox on signup page

**Implementation**:
- Checkbox component added to signup form
- Links to `/terms` and `/privacy` pages
- **Required for both email/password AND Google signup**
- Validation:
  - Submit button disabled when unchecked
  - Toast notification if user tries to submit without accepting
  - Error message displayed if validation fails

**User Experience**:
- Email/Password signup: Button disabled until checkbox checked
- Google signup: Shows error toast if checkbox not checked
- Clear visual feedback with links to terms and privacy policy

### 4. Email Check Logic for Google Signup ✅
**Requirement**: Check if email exists when signing up with Google - sign in if exists, sign up if new

**Implementation**:
- OAuth callback checks for existing user by:
  1. Email address
  2. Google ID
- **If user exists**:
  - Signs in with Google
  - Links Google account if not already linked
  - Updates `googleId`, `authProvider`, `profilePicture`
  - Redirects to dashboard (if onboarding complete) or onboarding
- **If new user**:
  - Creates new account with Google data
  - Sets `emailVerified = true` (Google emails are verified)
  - Sets `termsAccepted = true` (assumed when using OAuth)
  - Sets `authProvider = 'google'`
  - Redirects to onboarding

### 5. Database Schema Updates ✅
**New fields added to `users` table**:
- `google_id` (VARCHAR UNIQUE) - Google account ID
- `auth_provider` (VARCHAR DEFAULT 'email') - 'email' or 'google'
- `profile_picture` (VARCHAR) - Google profile picture URL
- `terms_accepted` (BOOLEAN DEFAULT FALSE) - Terms acceptance flag
- `terms_accepted_at` (TIMESTAMP) - When terms were accepted

**Schema changes**:
- `password_hash` changed from `.notNull()` to optional (Google users don't have passwords)
- Indexes created for `google_id` and `auth_provider`
- Existing users grandfathered in with `terms_accepted = true`

## Files Modified

### Backend Files:
1. **server/auth-routes.ts**
   - Added Passport Google OAuth strategy configuration
   - Added `/api/auth/google` route (initiates OAuth flow)
   - Added `/api/auth/google/callback` route (handles OAuth callback)
   - Email check logic implemented
   - Session creation for OAuth users
   - Security event logging

2. **server/index.ts**
   - Added `passport` import
   - Added `app.use(passport.initialize())`

3. **server/storage.ts**
   - Added `getUserByGoogleId()` method to interface
   - Implemented `getUserByGoogleId()` in DatabaseStorage class

4. **shared/schema.ts**
   - Updated `users` table with OAuth fields
   - Made `passwordHash` optional

### Frontend Files:
1. **client/src/pages/auth/SignUp.tsx**
   - Added `Checkbox` component import
   - Added `useToast` hook
   - Added `termsAccepted` state
   - Added terms checkbox UI
   - Added Google signup button
   - Added `handleGoogleSignup()` function
   - Validation for terms acceptance

2. **client/src/pages/auth/SignIn.tsx**
   - Added Google login button
   - "Or continue with" divider
   - Redirects to `/api/auth/google`

### Configuration Files:
1. **.env**
   - Added `GOOGLE_CLIENT_ID` (placeholder)
   - Added `GOOGLE_CLIENT_SECRET` (placeholder)
   - Added `GOOGLE_CALLBACK_URL`

2. **.env.example**
   - Added Google OAuth configuration section
   - Instructions for obtaining credentials

### Migration Files:
1. **migrations/005_google_oauth.sql**
   - Adds OAuth fields to users table
   - Creates indexes
   - Grandfathers existing users

### Package Files:
1. **package.json**
   - Added `passport-google-oauth20`
   - Added `@types/passport-google-oauth20`

## API Routes

### GET /api/auth/google
**Purpose**: Initiates Google OAuth flow

**Behavior**:
- Checks if Google OAuth is configured
- Returns 503 if not configured
- Redirects to Google OAuth consent screen
- Requests `profile` and `email` scopes

### GET /api/auth/google/callback
**Purpose**: Handles Google OAuth callback

**Behavior**:
1. Receives OAuth code from Google
2. Exchanges code for user profile
3. Checks if user exists by email or Google ID
4. **Existing user**: Signs in, links Google account if needed
5. **New user**: Creates account with Google data
6. Creates session and JWT token
7. Sets auth and session cookies
8. Logs security event
9. Redirects to dashboard or onboarding

**Error Handling**:
- OAuth failure: Redirects to `/auth/login?error=oauth_failed`
- No email in profile: Redirects to `/auth/login?error=no_email`
- Server error: Redirects to `/auth/login?error=oauth_error`

## Security Features

### Session Management:
- Creates database-backed session on OAuth login
- 7-day session expiry
- Tracks IP address, user agent, device info
- Session validation on every request

### Security Event Logging:
- All OAuth logins logged to `security_events` table
- Metadata includes:
  - `authProvider: 'google'`
  - `newUser: true/false`
  - IP address and user agent

### Account Linking:
- Existing email accounts can be linked to Google
- Google ID stored on first Google login
- Prevents duplicate accounts with same email

## Configuration Instructions

### Step 1: Get Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen:
   - User Type: External
   - App name: Geoscore
   - Scopes: email, profile
6. Create OAuth Client ID:
   - Application type: Web application
   - Authorized redirect URIs:
     - `http://localhost:5001/api/auth/google/callback` (development)
     - `https://yourdomain.com/api/auth/google/callback` (production)
7. Copy Client ID and Client Secret

### Step 2: Update .env File
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback
```

### Step 3: Run Database Migration
```powershell
npm run db:push
```

Or manually:
```powershell
psql $DATABASE_URL -f migrations/005_google_oauth.sql
```

### Step 4: Start the Application
```powershell
npm run dev
```

## Testing Checklist

- [ ] Google OAuth credentials configured in .env
- [ ] Database migration run successfully
- [ ] Login page shows Google button
- [ ] Signup page shows Google button
- [ ] Signup page shows terms checkbox
- [ ] Terms checkbox required for email signup
- [ ] Terms checkbox required for Google signup
- [ ] Google login works for existing users
- [ ] Google signup creates new account
- [ ] Email verification skipped for Google users
- [ ] Profile picture imported from Google
- [ ] Existing email account can link to Google
- [ ] Session created on Google login
- [ ] Security events logged
- [ ] Redirects to dashboard/onboarding correctly

## User Flows

### Flow 1: New User Signs Up with Google
1. User visits `/auth/sign-up`
2. User checks "I agree to terms & conditions"
3. User clicks "Sign up with Google"
4. Redirected to Google OAuth consent screen
5. User grants permissions
6. Callback creates new account with Google data
7. User redirected to `/onboarding`

### Flow 2: Existing User Signs In with Google
1. User visits `/auth/sign-in`
2. User clicks "Continue with Google"
3. Redirected to Google OAuth consent screen
4. User grants permissions
5. Callback finds existing account by email
6. Links Google account if not already linked
7. User redirected to `/app/dashboard` or `/onboarding`

### Flow 3: User Tries Google Signup Without Terms
1. User visits `/auth/sign-up`
2. User clicks "Sign up with Google" without checking terms
3. Error toast displayed: "You must accept the terms and conditions"
4. OAuth flow not initiated
5. User must check terms checkbox to proceed

## Known Limitations

- Terms acceptance for OAuth is assumed (frontend validation only)
- No email notification sent for OAuth signups
- Profile picture not displayed in UI yet (stored in database)
- No option to unlink Google account
- No option to convert Google account to email/password account

## Future Enhancements

- [ ] Display profile picture in user profile
- [ ] Add option to unlink Google account
- [ ] Add option to set password for Google accounts
- [ ] Email notification for new OAuth signups
- [ ] Support for other OAuth providers (GitHub, Microsoft, etc.)
- [ ] Admin dashboard to view OAuth usage statistics

---

**Implementation Date**: 2026-02-15
**Version**: 1.0
**Status**: Ready for Testing (pending Google OAuth credentials)

