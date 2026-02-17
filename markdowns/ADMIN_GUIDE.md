# GeoScore Admin Guide

## Overview

This guide is for administrators who manage the GeoScore platform. Admin access is granted to users whose email addresses are listed in the `ADMIN_EMAILS` environment variable.

## Getting Admin Access

### 1. Configure Admin Emails

Add your email to the `.env` file:

```env
ADMIN_EMAILS=admin@geoscore.com,admin2@geoscore.com
```

Multiple emails can be comma-separated.

### 2. Sign In

1. Sign in with your admin email
2. Admin menu will appear in the sidebar
3. Access admin features from the Admin section

## Admin Dashboard

### Overview Page

**Location**: Admin → Dashboard

**Features**:
- Total users count
- Total brands count
- Active subscriptions
- Revenue metrics
- System health status
- Recent activity

**Key Metrics**:
- Daily active users (DAU)
- Monthly active users (MAU)
- Conversion rates
- Churn rate
- Average revenue per user (ARPU)

## User Management

### View All Users

**Location**: Admin → Users

**Information Displayed**:
- User ID
- Email address
- Name
- Sign-up date
- Last login
- Subscription plan
- Number of brands
- Account status

**Actions**:
- View user details
- View user's brands
- View user activity
- Suspend/unsuspend account
- Delete account (with confirmation)

### User Details

Click on any user to view:
- Full profile information
- All brands owned
- Subscription history
- Payment history
- Activity log
- API usage

### User Actions

**Suspend User**:
1. Go to user details
2. Click "Suspend Account"
3. Provide reason
4. Confirm suspension
5. User loses access immediately

**Delete User**:
1. Go to user details
2. Click "Delete Account"
3. Confirm deletion (irreversible)
4. User data deleted after 30 days

## Brand Management

### View All Brands

**Location**: Admin → Brands

**Information Displayed**:
- Brand name
- Owner email
- Industry
- Created date
- Number of prompts
- Number of competitors
- Last activity
- Status

**Filters**:
- By industry
- By creation date
- By activity
- By owner

### Brand Details

Click on any brand to view:
- Full brand information
- Brand context
- Competitors
- Prompts
- Topics
- Sources
- Recent jobs
- Analytics

### Brand Actions

**Edit Brand**:
- Update brand information
- Modify brand context
- Add/remove competitors

**Delete Brand**:
- Permanently delete brand
- Requires confirmation
- Cannot be undone

**Transfer Ownership**:
- Transfer brand to another user
- Requires new owner's email
- Notifies both parties

## Subscription Management

### View Plans

**Location**: Admin → Plans

**Features**:
- View all subscription plans
- Edit plan details
- Create new plans
- Disable plans

### Plan Configuration

**Plan Details**:
- Plan name
- Price (monthly/annual)
- Features included
- Limits (prompts, brands, etc.)
- Status (active/inactive)

**Create New Plan**:
1. Click "Create Plan"
2. Enter plan details
3. Set pricing
4. Configure features and limits
5. Save plan

**Edit Plan**:
1. Click on plan
2. Modify details
3. Save changes
4. Existing subscribers unaffected

### Subscription Management

**View Subscriptions**:
- All active subscriptions
- Subscription history
- Revenue by plan
- Churn analysis

**Actions**:
- Manually upgrade/downgrade users
- Issue refunds
- Cancel subscriptions
- Extend trial periods

## Analytics & Reporting

### Platform Analytics

**Location**: Admin → Analytics

**Metrics Available**:
- User growth
- Revenue trends
- Feature usage
- API usage
- Job statistics
- Error rates
- Performance metrics

**Reports**:
- Daily/weekly/monthly summaries
- User acquisition reports
- Revenue reports
- Churn analysis
- Feature adoption

### Export Data

Export analytics data:
- CSV format
- Custom date ranges
- Filtered by metrics
- Scheduled exports (coming soon)

## System Settings

### Global Configuration

**Location**: Admin → Settings

**Settings**:
- Platform name and branding
- Default limits
- Feature flags
- Maintenance mode
- Email templates
- Notification settings

### Integration Management

**LLM Providers**:
- Configure API keys
- Set rate limits
- Monitor usage
- View costs

**Payment Gateway**:
- Razorpay configuration
- Webhook settings
- Test mode toggle

**External APIs**:
- Brand enrichment APIs
- SERP APIs
- Knowledge Graph APIs

### Feature Flags

Enable/disable features:
- New features (beta)
- Experimental features
- Deprecated features
- Plan-specific features

## Job Management

### View Jobs

**Location**: Admin → Jobs

**Information**:
- Job ID
- Type (LLM sampling, enrichment, etc.)
- Status (queued, running, completed, failed)
- Brand
- Created date
- Completion time
- Error messages (if failed)

**Actions**:
- View job details
- Retry failed jobs
- Cancel running jobs
- Clear old jobs

### Job Statistics

**Metrics**:
- Total jobs processed
- Success rate
- Average processing time
- Jobs by type
- Jobs by status
- Error rates

### Job Queue Management

**Monitor**:
- Queue length
- Processing rate
- Worker status
- Bottlenecks

**Actions**:
- Pause queue
- Resume queue
- Clear queue
- Adjust worker count

## Audit Logs

### View Audit Logs

**Location**: Admin → Audit Logs

**Logged Events**:
- User actions (create, update, delete)
- Admin actions
- Authentication events
- Payment events
- API calls
- System events

**Information**:
- Timestamp
- User
- Action
- Entity type
- Entity ID
- Old value
- New value
- IP address
- User agent

**Filters**:
- By user
- By action type
- By date range
- By entity type

## Support & Moderation

### Support Tickets

**View Tickets**:
- All support requests
- Ticket status
- Priority
- Assigned admin

**Actions**:
- Respond to tickets
- Assign to admin
- Change priority
- Close tickets

### Content Moderation

**Review**:
- User-generated content
- Brand descriptions
- Prompts
- Flagged content

**Actions**:
- Approve content
- Reject content
- Flag for review
- Contact user

## Monitoring & Alerts

### System Health

**Monitor**:
- Server status
- Database performance
- API response times
- Error rates
- Queue status
- External API status

### Alerts

**Configure Alerts**:
- Email notifications
- Slack integration (coming soon)
- Alert thresholds
- Alert recipients

**Alert Types**:
- System errors
- High error rates
- Slow performance
- Queue backlog
- Payment failures
- Security events

## Security

### Security Dashboard

**Monitor**:
- Failed login attempts
- Suspicious activity
- API abuse
- Rate limit violations

**Actions**:
- Block IP addresses
- Suspend accounts
- Revoke API keys
- Force password resets

### Access Control

**Admin Roles** (coming soon):
- Super Admin (full access)
- Support Admin (user support)
- Billing Admin (payments only)
- Read-Only Admin (view only)

## Best Practices

### 1. Regular Monitoring

- Check dashboard daily
- Review error logs weekly
- Analyze metrics monthly
- Review audit logs regularly

### 2. User Support

- Respond to tickets promptly
- Be professional and helpful
- Document common issues
- Escalate when needed

### 3. Data Management

- Regular database backups
- Monitor storage usage
- Clean up old data
- Archive inactive accounts

### 4. Security

- Review audit logs for suspicious activity
- Keep admin list up-to-date
- Use strong passwords and 2FA
- Limit admin access to trusted users

### 5. Performance

- Monitor job queue
- Optimize slow queries
- Scale resources as needed
- Cache frequently accessed data

## Troubleshooting

### Common Issues

**Users Can't Sign In**:
- Check Clerk configuration
- Verify email is confirmed
- Check account status

**Jobs Not Processing**:
- Check job queue status
- Verify LLM API keys
- Check error logs
- Restart job workers

**Payment Failures**:
- Verify Razorpay configuration
- Check webhook settings
- Review payment logs

**Slow Performance**:
- Check database performance
- Monitor API response times
- Review server resources
- Optimize queries

## Contact & Escalation

For critical issues:
- **Technical Issues**: tech@geoscore.com
- **Security Issues**: security@geoscore.com
- **Billing Issues**: billing@geoscore.com

---

**Remember**: With great power comes great responsibility. Always act in the best interest of users and the platform.

