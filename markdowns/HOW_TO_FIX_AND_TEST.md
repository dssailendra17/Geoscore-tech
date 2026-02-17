# How to Fix Database Connection and Run Tests

**Current Issue**: Supabase database cannot be reached  
**Impact**: Application cannot start, testing blocked  
**Solution**: Follow steps below to fix and test

---

## 🔧 Step 1: Fix Database Connection

### Option A: Fix Supabase Connection (Recommended)

1. **Log in to Supabase**
   ```
   Visit: https://supabase.com/dashboard
   ```

2. **Check Your Project**
   - Look for project ID: `qgfcgzqxkwxgbykqgged`
   - If you see it, check if it's paused (click "Resume")
   - If you don't see it, it may have been deleted

3. **Get New Connection String**
   - Click on your project
   - Go to: **Settings** → **Database**
   - Scroll to "Connection string"
   - Select **URI** format
   - Copy the connection string
   - It should look like:
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
     ```

4. **Update .env File**
   - Open `.env` in the project root
   - Replace the DATABASE_URL line with your new connection string
   - **IMPORTANT**: URL-encode special characters in password:
     - `@` becomes `%40`
     - `#` becomes `%23`
     - `$` becomes `%24`
     - `&` becomes `%26`
   
   Example:
   ```env
   # If password is: MyP@ss#123
   # Encode it as: MyP%40ss%23123
   DATABASE_URL=postgresql://postgres:MyP%40ss%23123@db.xxxxx.supabase.co:5432/postgres
   ```

### Option B: Use Local PostgreSQL

1. **Install PostgreSQL**
   - Windows: Download from https://www.postgresql.org/download/windows/
   - During installation, remember the password you set for 'postgres' user

2. **Create Database**
   - Open Command Prompt or PowerShell
   - Run:
     ```bash
     createdb -U postgres geoscore
     ```
   - Enter your postgres password when prompted

3. **Update .env File**
   ```env
   DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/geoscore
   ```

---

## 🗄️ Step 2: Run Database Migrations

Once database connection is fixed:

```bash
npm run db:push
```

**Expected Output**:
```
✓ Pulling schema from database...
✓ Pushing schema to database...
✓ Done!
```

This creates all 24+ tables needed by the application.

---

## 🚀 Step 3: Start the Application

```bash
npm run dev
```

**Expected Output**:
```
✅ Server running on http://0.0.0.0:5000
   Environment: development
```

**Verify Server is Running**:
- Open browser: http://localhost:5000
- You should see the GeoScore landing page

---

## 🧪 Step 4: Run Playwright Tests

### Manual Testing (Recommended First)

1. **Test Landing Page**
   - Open: http://localhost:5000
   - Verify page loads with branding

2. **Test Sign Up**
   - Click "Sign Up" or "Get Started"
   - Fill in:
     - First Name: Test
     - Last Name: User
     - Email: test@example.com
     - Password: TestPass123!
   - Click "Sign Up"
   - Should redirect to verify email page

3. **Test Email Verification**
   - **IMPORTANT**: Since SMTP is not configured, use default OTP: `123456`
   - Enter: `1` `2` `3` `4` `5` `6` in the 6 boxes
   - Click "Verify Email"
   - Should redirect to onboarding

4. **Test Onboarding**
   - Fill in brand details
   - Click "Complete Onboarding"
   - Should redirect to dashboard

5. **Test Dashboard**
   - Verify dashboard loads
   - Check navigation menu
   - Try clicking different menu items

### Automated Playwright Testing

Once manual testing confirms the app works:

1. **Install Playwright** (if not already installed)
   ```bash
   npm install -D @playwright/test
   npx playwright install
   ```

2. **Create Test File**
   Create `tests/auth.spec.ts`:
   ```typescript
   import { test, expect } from '@playwright/test';

   test('sign up flow', async ({ page }) => {
     await page.goto('http://localhost:5000');
     await page.click('text=Sign Up');
     
     await page.fill('[data-testid="input-first-name"]', 'Test');
     await page.fill('[data-testid="input-last-name"]', 'User');
     await page.fill('[data-testid="input-email"]', 'test@example.com');
     await page.fill('[data-testid="input-password"]', 'TestPass123!');
     
     await page.click('[data-testid="button-signup"]');
     
     await expect(page).toHaveURL(/verify-email/);
   });
   ```

3. **Run Tests**
   ```bash
   npx playwright test
   ```

---

## 📋 Step 5: Complete Testing Checklist

Use the testing.md file as your guide. Test each module:

- [ ] Module 1: Landing Page (3 tests)
- [ ] Module 2: Sign Up Flow (11 tests)
- [ ] Module 3: Email Verification (11 tests)
- [ ] Module 4: Sign In Flow (10 tests)
- [ ] Module 5: Forgot Password (11 tests)
- [ ] Module 6: Session Persistence (5 tests)
- [ ] Module 7: Route Protection (8 tests)
- [ ] Module 8: Onboarding (10 tests)
- [ ] Module 9: Dashboard (15+ tests)
- [ ] Module 10: Admin Panel (10+ tests)
- [ ] Module 11: API Endpoints (50+ tests)
- [ ] Module 12: Security (10+ tests)
- [ ] Module 13: Cross-Browser (5+ tests)

---

## 📝 Step 6: Update Test Reports

After testing, update the reports:

1. **Update success.md**
   - Add all passing tests
   - Include screenshots if helpful
   - Note any observations

2. **Update failing.md**
   - Document any failing tests
   - Include error messages
   - Provide steps to reproduce
   - Suggest fixes if possible

---

## 🎯 Quick Start Commands

```bash
# 1. Fix database connection (edit .env file first)

# 2. Run migrations
npm run db:push

# 3. Start server
npm run dev

# 4. In another terminal, run tests
npx playwright test

# 5. View test results
npx playwright show-report
```

---

## 💡 Tips

### Default Test Credentials
- **Email**: dev@geoscore.local
- **Password**: devpassword
- **OTP** (when SMTP not configured): 123456

### Common Issues

**Issue**: "Port 5000 already in use"
- **Fix**: Kill the process using port 5000 or change PORT in .env

**Issue**: "Cannot find module"
- **Fix**: Run `npm install` again

**Issue**: "OTP not working"
- **Fix**: Use default OTP `123456` when SMTP is not configured

**Issue**: "Database connection timeout"
- **Fix**: Check if database is accessible, verify connection string

---

## 📞 Need Help?

If you encounter issues:
1. Check server logs in the terminal
2. Check browser console for errors
3. Verify .env configuration
4. Ensure database is accessible
5. Try restarting the server

---

**Once database is fixed, testing should take approximately 2-4 hours for comprehensive coverage.**

