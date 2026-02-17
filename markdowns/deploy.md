ext Steps for Deployment
1. Install Dependencies
2. Setup Database
Run the migration on your Supabase/Convex database:

psql "your-database-url" < migrations/001_initial_schema.sql
3. Configure Environment
Copy .env.production.example to .env and fill in your actual values:

Production Clerk keys (sk_live_, pk_live_)
Production database URL
Secure SESSION_SECRET (min 32 chars)
Your domain(s) in ALLOWED_ORIGINS
API keys for LLM providers, Razorpay, etc.
4. Build for Production
npm run build
5. Deploy to Hostinger
Follow the detailed steps in PRODUCTION_DEPLOYMENT.md:

Upload files via FTP/SFTP
Install dependencies on server
Set environment variables
Start with PM2 or node
Configure reverse proxy if needed
6. Verify Deployment
curl https://yourdomain.com/health
⚠️ Important Security Notes
The application will automatically EXIT in production if:

DATABASE_URL points to localhost
Clerk keys are test keys (sk_test_, pk_test_)
SESSION_SECRET is the default value
CLERK_SECRET_KEY is not set
This prevents accidental deployment with insecure configuration.