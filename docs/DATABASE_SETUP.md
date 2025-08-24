# Database Setup Guide

This application uses **Supabase** as its database provider. Supabase provides a PostgreSQL database with advanced features including automated survey management and real-time capabilities.

## Why Supabase?

✅ **Full SQL Database**: PostgreSQL with advanced query capabilities  
✅ **Automated Status Management**: Time-based survey activation/deactivation  
✅ **Advanced Data Visualization**: ECharts-powered interactive charts and analytics  
✅ **Complete Audit Trail**: Track all survey changes and user actions  
✅ **Real-time Updates**: Live data synchronization  
✅ **GitHub Actions Integration**: Scheduled automation workflows  
✅ **Self-hosted Option**: Deploy on your own infrastructure if needed  
✅ **Predictable Pricing**: Fixed-tier pricing model

## Configuration

Set your database provider in your `.env` file:

```env
VITE_DATABASE_PROVIDER=supabase
```

## Quick Start

Get started with Supabase in just a few steps:

1. **Create Account**: Sign up at [https://supabase.com](https://supabase.com)
2. **Create Project**: Start a new project in your desired region
3. **Run Setup Script**: Execute `scripts/setup-supabase.sql` in the Supabase SQL Editor
4. **Configure Environment**: Set up your environment variables
5. **Start Building**: Create your first survey!

Detailed instructions are available in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).

## Supabase Setup (Recommended)

Supabase provides a PostgreSQL database with advanced features including automated survey status management.

### Why Choose Supabase?
- ✅ **Automated Status Management**: Surveys automatically activate/deactivate based on date ranges
- ✅ **Advanced Data Visualization**: ECharts-powered interactive charts and analytics
- ✅ **Audit Trail**: Complete logging of all survey changes
- ✅ **SQL Capabilities**: Complex queries and data analysis
- ✅ **GitHub Actions Integration**: Scheduled automation

### Setup Steps

1. **Create a Supabase project** at [https://supabase.com/](https://supabase.com/)
2. **Run the database setup script**:
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `scripts/setup-supabase.sql`
   - Execute the script
   
   This creates:
   - All survey tables with proper relationships
   - **Automated status management functions**
   - **Audit trail system** for tracking changes
   - **Database triggers** for automatic logging

3. **Set up environment variables**:

```env
VITE_DATABASE_PROVIDER=supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_ADMIN_PASSWORD=your-secure-admin-password
```

4. **Configure GitHub Secrets** (for automated status management):
   - `SUPABASE_SERVICE_ROLE_KEY`: For automated survey status updates
   - See [GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md) for details

### Automated Features

With Supabase, you get these automated features:

- **Scheduled Status Updates**: GitHub Actions runs every 6 hours to activate/deactivate surveys
- **Audit Trail**: Every status change is logged with timestamp and reason
- **Upcoming Changes**: System tracks surveys that will change status soon
- **Manual Testing**: Use `scripts/test-status-automation.js` to verify setup

### Automated Survey Status Management

Supabase includes a sophisticated automation system:

```sql
-- These functions are included in the setup script:

-- 1. Main automation function (called by GitHub Actions)
SELECT update_survey_instance_statuses();

-- 2. Check upcoming changes (for notifications)
SELECT get_upcoming_status_changes(24); -- next 24 hours

-- 3. View audit trail
SELECT * FROM survey_instance_status_changes 
ORDER BY changed_at DESC;
```

#### How It Works
1. **Real-time**: Users accessing surveys get immediate status checks
2. **Scheduled**: GitHub Actions runs every 6 hours to update database flags
3. **Logged**: All changes are recorded in the audit trail
4. **Notification-ready**: System can alert about upcoming changes


## Core Features

### Survey Management
- **Visual Survey Builder**: Drag-and-drop interface for creating surveys
- **Survey Instances**: Create multiple instances with different configurations
- **Automated Scheduling**: Surveys activate/deactivate based on date ranges
- **Slug URLs**: Human-readable survey links

### Data & Analytics  
- **Real-time Visualization**: Interactive ECharts-powered charts and graphs
- **Multiple Chart Types**: Bar charts, pie charts, histograms, and sparklines
- **Advanced Filtering**: Filter responses by date, section, or field
- **Chart Export**: Download charts as PNG/SVG formats
- **Excel Export**: Export survey data for external analysis
- **SQL Access**: Direct database queries for custom reporting

### System Administration
- **Complete Audit Trail**: Track all system changes
- **Import/Export**: Backup and restore entire configurations
- **GitHub Actions**: Automated workflows for status management
- **Admin Authentication**: Secure access controls

## Environment Variables

Set these environment variables in your `.env.local` file for development:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_ADMIN_PASSWORD=your-secure-admin-password
```

For production deployment, set these as GitHub Secrets:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` 
- `SUPABASE_SERVICE_ROLE_KEY` (for automation)
- `VITE_ADMIN_PASSWORD`

## Testing Your Setup

### Supabase Test Script

Run the included test script to verify your Supabase setup:

```bash
# Install dependencies if needed
npm install @supabase/supabase-js dotenv

# Run the test script
node scripts/test-status-automation.js
```

This will verify:
- Database functions are working
- Automation system is ready
- Audit trail is accessible
- Survey instances can be managed

### Manual Testing

1. **Create a survey instance** with a date range in the admin panel
2. **Check the audit trail** in your Supabase dashboard
3. **Run manual status update**: Call the GitHub Actions workflow
4. **Verify automation**: Status should update based on current time vs. date range

## Troubleshooting

### Common Issues

1. **"Database service not initialized"**
   - Verify environment variables are set correctly
   - Check that database provider is specified: `VITE_DATABASE_PROVIDER=supabase`

2. **Automation not working**
   - Verify `SUPABASE_SERVICE_ROLE_KEY` is set in GitHub Secrets
   - Check GitHub Actions logs for errors
   - Test manually with the test script

3. **Missing functions error**
   - Re-run the `scripts/setup-supabase.sql` script
   - Check Supabase SQL Editor for any error messages

4. **Connection timeouts**
   - Check your network configuration and database credentials
   - Verify Supabase project URL and keys

### Debug Information

The application logs which database provider is being used during initialization. Check the browser console for messages like:

```
Initializing database with provider: supabase
Database service initialized successfully
Survey instance automation system ready
```

## Migration Between Providers

### Data Import/Export

The application includes built-in import/export functionality:

1. **Export Data**: Use the admin panel to export surveys, configurations, and responses
2. **Backup System**: Complete system backup including all settings and data
3. **Migration Tools**: Import data from other survey systems or previous installations
4. **Excel Export**: Export response data for analysis in spreadsheet applications

## Performance & Scaling

### Database Performance
- **PostgreSQL Engine**: Battle-tested database with excellent performance
- **Connection Pooling**: Built-in optimization for high-traffic applications
- **Automatic Scaling**: Scales with your usage automatically
- **Real-time Subscriptions**: Live data updates across all connected clients
- **Efficient Indexing**: Optimized queries for fast data retrieval

### Scaling Capabilities
- **Horizontal Scaling**: Add read replicas for increased performance
- **Vertical Scaling**: Increase compute and memory as needed
- **Global Distribution**: Deploy globally for reduced latency
- **Edge Functions**: Run code close to your users

## Backup & Recovery

### Built-in Protection
- **Point-in-time Recovery**: Restore to any moment in time
- **Automated Backups**: Daily backups on paid plans
- **Manual Snapshots**: Create backups on-demand
- **Cross-region Replication**: Disaster recovery across regions

### Application-level Backups
- **Admin Panel Export**: Full system backup through the UI
- **SQL Dumps**: Direct database backups
- **Configuration Export**: Save survey templates and settings
- **Response Data Export**: Export survey responses to Excel/CSV