# GeoScore Production Deployment Guide

## 🚀 Pre-Deployment Checklist

### 1. Database Setup (Supabase/PostgreSQL)

#### Option A: Supabase
1. Create a new Supabase project at https://supabase.com
2. Go to Project Settings > Database
3. Copy the connection string (URI format)
4. Run the migration:
   ```bash
   psql "your-supabase-connection-string" < migrations/001_initial_schema.sql
   ```

#### Option B: Convex
1. Create a new Convex project at https://convex.dev
2. Follow Convex-specific PostgreSQL setup
3. Run the migration SQL file

#### Option C: Self-Hosted PostgreSQL
1. Ensure PostgreSQL 14+ is installed
2. Create a new database:
   ```sql
   CREATE DATABASE geoscore;
   ```
3. Run the migration:
   ```bash
   psql -U postgres -d geoscore < migrations/001_initial_schema.sql
   ```

### 2. Environment Variables Configuration

Create a `.env.production` file with the following variables:

```bash
# ============= REQUIRED =============

# Database
DATABASE_URL=postgresql://user:password@host:5432/geoscore

# Clerk Authentication (MUST be production keys)
CLERK_SECRET_KEY=sk_live_xxxxxxxxxxxxx
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx

# Session Secret (MUST be changed from default)
SESSION_SECRET=your-secure-random-secret-min-32-chars

# Node Environment
NODE_ENV=production

# ============= OPTIONAL (Recommended) =============

# LLM Providers (at least one recommended)
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
GOOGLE_API_KEY=xxxxxxxxxxxxx
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxx
GROK_API_KEY=xxxxxxxxxxxxx
DEEPSEEK_API_KEY=xxxxxxxxxxxxx
OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxxx

# Google Ecosystem
GOOGLE_KG_API_KEY=xxxxxxxxxxxxx
SERPAPI_API_KEY=xxxxxxxxxxxxx

# Payment Gateway
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxx

# Social Media APIs
BRAND_DEV_API_KEY=xxxxxxxxxxxxx

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Server Configuration
PORT=5000
```

### 3. Security Validation

The application will automatically validate your environment on startup:

✅ **Required Checks:**
- DATABASE_URL is set and not localhost
- CLERK_SECRET_KEY is set and not a test key (sk_test_)
- VITE_CLERK_PUBLISHABLE_KEY is set and not a test key (pk_test_)
- SESSION_SECRET is changed from default

⚠️ **Warnings:**
- At least one LLM provider API key is recommended
- Payment gateway keys for billing functionality

**If validation fails in production, the application will exit with code 1.**

### 4. Build the Application

```bash
# Install dependencies
npm install

# Build for production
npm run build
```

This creates optimized production files in the `dist/` directory.

### 5. Hostinger Cloud Startup Deployment

#### Step 1: Upload Files
1. Log in to Hostinger control panel
2. Go to File Manager or use FTP/SFTP
3. Upload the entire project directory to your hosting space
4. Ensure `node_modules` is NOT uploaded (will install on server)

#### Step 2: Install Dependencies on Server
```bash
ssh your-server
cd /path/to/your/app
npm install --production
```

#### Step 3: Set Environment Variables
- In Hostinger control panel, go to Environment Variables
- Add all variables from `.env.production`
- OR create `.env` file on server (ensure it's not in public directory)

#### Step 4: Start the Application
```bash
# Using PM2 (recommended)
npm install -g pm2
pm2 start npm --name "geoscore" -- start
pm2 save
pm2 startup

# Or using node directly
npm start
```

#### Step 5: Configure Reverse Proxy (if needed)
If using Apache/Nginx, configure reverse proxy to port 5000:

**Nginx Example:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6. Post-Deployment Verification

#### Health Check
```bash
curl https://yourdomain.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-26T...",
  "environment": "production"
}
```

#### Check Logs
```bash
# If using PM2
pm2 logs geoscore

# Check application logs
tail -f logs/combined-*.log
tail -f logs/error-*.log
```

#### Test Authentication
1. Visit your domain
2. Try to sign up/sign in
3. Verify Clerk authentication works

#### Test Database Connection
- Create a test brand
- Verify data is saved to database

### 7. Monitoring & Maintenance

#### Log Files
Production logs are stored in `logs/` directory:
- `combined-YYYY-MM-DD.log` - All logs
- `error-YYYY-MM-DD.log` - Error logs only
- Logs rotate daily and keep 14 days

#### Rate Limiting
- General API: 100 requests per 15 minutes per IP
- Auth endpoints: 5 requests per 15 minutes per IP
- Admin endpoints: 200 requests per 15 minutes per IP
- Job triggers: 10 requests per minute per IP
- Exports: 10 requests per hour per IP
- Webhooks: 100 requests per minute per IP

#### Security Headers
Automatically applied via Helmet.js:
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security (HSTS)

### 8. Troubleshooting

#### Application Won't Start
1. Check environment validation errors in console
2. Verify DATABASE_URL is correct
3. Ensure Clerk keys are production keys (not test keys)
4. Check SESSION_SECRET is set

#### Database Connection Errors
1. Verify DATABASE_URL format
2. Check database server is accessible
3. Ensure migrations have been run
4. Check database user has proper permissions

#### Authentication Not Working
1. Verify CLERK_SECRET_KEY and VITE_CLERK_PUBLISHABLE_KEY are set
2. Ensure keys are production keys (sk_live_, pk_live_)
3. Check CORS configuration includes your domain
4. Verify Clerk dashboard settings

## 📞 Support

For issues or questions:
1. Check logs in `logs/` directory
2. Review environment validation output
3. Verify all required environment variables are set
4. Ensure database migrations completed successfully

## 🔒 Security Notes

- Never commit `.env` files to version control
- Use strong, unique SESSION_SECRET (min 32 characters)
- Keep all API keys secure
- Regularly update dependencies
- Monitor logs for security events
- Enable HTTPS/SSL in production
- Configure firewall rules appropriately

