# GeoScore Deployment Guide

## Prerequisites

- Node.js 20+ installed
- PostgreSQL 16+ database
- Clerk account for authentication
- At least one LLM API key (OpenAI, Anthropic, or Google)

## Environment Setup

### 1. Database Configuration

Set up your PostgreSQL database and update the `.env` file:

```env
DATABASE_URL=postgresql://user:password@host:5432/geoscore
```

### 2. Run Database Migrations

```bash
npm run db:push
```

This will create all necessary tables in your database.

### 3. Configure Authentication

1. Create a Clerk account at https://dashboard.clerk.com
2. Create a new application
3. Copy your API keys to `.env`:

```env
CLERK_SECRET_KEY=sk_test_...
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

4. Configure sign-in methods in Clerk dashboard:
   - Email/Password
   - Phone (SMS)
   - Google OAuth
   - Enable 2FA

### 4. Set Admin Emails

Add admin email addresses (comma-separated):

```env
ADMIN_EMAILS=admin@geoscore.com,admin2@geoscore.com
```

### 5. Configure LLM APIs

Add at least one LLM provider API key:

```env
# OpenAI (recommended)
OPENAI_API_KEY=sk-...

# OR Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# OR Google
GOOGLE_API_KEY=...
```

### 6. Optional: Configure Payment Gateway

For Razorpay integration (Indian market):

```env
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

### 7. Optional: Brand Enrichment APIs

```env
BRAND_DEV_API_KEY=...
GOOGLE_KG_API_KEY=...
DATAFORSEO_LOGIN=...
DATAFORSEO_PASSWORD=...
```

## Build and Deploy

### Development Mode

```bash
npm install
npm run dev
```

The application will be available at http://localhost:5000

### Production Build

```bash
npm install
npm run build
npm start
```

### Deployment Platforms

#### Replit (Recommended for Quick Deploy)

1. Import repository to Replit
2. Configure environment variables in Secrets
3. Click "Run"

#### Vercel/Netlify

1. Connect your repository
2. Set build command: `npm run build`
3. Set start command: `node dist/index.cjs`
4. Configure environment variables
5. Deploy

#### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["node", "dist/index.cjs"]
```

## Post-Deployment Checklist

- [ ] Verify database connection
- [ ] Test user registration
- [ ] Test authentication (email, phone, Google)
- [ ] Create test brand
- [ ] Test LLM sampling
- [ ] Verify job queue is working
- [ ] Test admin dashboard access
- [ ] Configure Razorpay webhook URL (if using payments)
- [ ] Set up monitoring/logging
- [ ] Configure backup strategy

## Monitoring

Monitor the following:

1. **Application Logs**: Check server logs for errors
2. **Database**: Monitor connection pool and query performance
3. **Job Queue**: Ensure jobs are processing
4. **API Rate Limits**: Monitor LLM API usage
5. **User Activity**: Track registration and usage patterns

## Troubleshooting

### Database Connection Issues

- Verify DATABASE_URL is correct
- Check database is running and accessible
- Ensure migrations have been run

### Authentication Not Working

- Verify Clerk keys are correct
- Check Clerk dashboard for application status
- Ensure VITE_CLERK_PUBLISHABLE_KEY starts with `pk_`

### LLM Sampling Fails

- Verify at least one LLM API key is set
- Check API key validity
- Monitor API rate limits and quotas

### Jobs Not Processing

- Check server logs for job system initialization
- Verify database connection
- Ensure job workers are running

## Security Considerations

1. **Environment Variables**: Never commit `.env` to version control
2. **API Keys**: Rotate keys regularly
3. **Database**: Use strong passwords and SSL connections
4. **HTTPS**: Always use HTTPS in production
5. **Rate Limiting**: Implement rate limiting for API endpoints
6. **CORS**: Configure CORS appropriately for your domain

## Scaling

For high-traffic scenarios:

1. **Database**: Use connection pooling and read replicas
2. **Job Queue**: Deploy separate worker instances
3. **Caching**: Implement Redis for session and data caching
4. **CDN**: Use CDN for static assets
5. **Load Balancing**: Deploy multiple application instances

## Support

For issues or questions:
- Check logs in `server/index.ts`
- Review error messages in browser console
- Verify all environment variables are set correctly

