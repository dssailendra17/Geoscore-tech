# GeoScore - Quick Start Guide

**⚠️ IMPORTANT**: Database connection must be fixed before starting

---

## 🚀 Quick Fix & Start (5 Minutes)

### Step 1: Fix Database (Choose One)

#### Option A: Supabase (Recommended)
1. Go to https://supabase.com/dashboard
2. Find or create your project
3. Get connection string from Settings → Database
4. Update `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
   ```
   **Remember**: URL-encode special characters in password!

#### Option B: Local PostgreSQL
1. Install PostgreSQL
2. Create database: `createdb geoscore`
3. Update `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/geoscore
   ```

### Step 2: Setup Database
```bash
npm run db:push
```

### Step 3: Start Server
```bash
npm run dev
```

### Step 4: Test
Open http://localhost:5000

---

## 🧪 Quick Test (2 Minutes)

1. **Sign Up**
   - Click "Sign Up"
   - Fill: Test User, test@example.com, TestPass123!
   - Click "Sign Up"

2. **Verify Email**
   - Enter OTP: `1` `2` `3` `4` `5` `6`
   - Click "Verify Email"

3. **Onboarding**
   - Fill brand details
   - Click "Complete Onboarding"

4. **Dashboard**
   - Verify dashboard loads
   - Check navigation works

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `TESTING_SUMMARY.md` | Overview & status |
| `HOW_TO_FIX_AND_TEST.md` | Detailed fix guide |
| `success.md` | What's working |
| `failing.md` | What's blocked |
| `testing.md` | Full test specs |

---

## 🔑 Default Credentials

**Dev User** (pre-created):
- Email: `dev@geoscore.local`
- Password: `devpassword`

**OTP** (when SMTP not configured):
- Code: `123456`

---

## ⚡ Common Commands

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:push

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type check
npm run check
```

---

## 🐛 Troubleshooting

### "Database connection failed"
→ Check DATABASE_URL in `.env`  
→ Verify database is accessible  
→ URL-encode special characters in password

### "Port 5000 already in use"
→ Kill process on port 5000  
→ Or change PORT in `.env`

### "OTP not working"
→ Use default OTP: `123456`  
→ SMTP is not configured (optional)

### "Cannot find module"
→ Run `npm install`

---

## 📊 Current Status

✅ **Code**: Complete & verified  
✅ **Config**: Updated  
✅ **Dependencies**: Installed  
❌ **Database**: Connection blocked  
❌ **Testing**: Waiting for database

---

## 🎯 Next Steps

1. Fix database connection (see Step 1 above)
2. Run migrations
3. Start server
4. Run tests from `testing.md`
5. Update `success.md` and `failing.md`

---

**Estimated Time to Fix & Test**: 2-4 hours

