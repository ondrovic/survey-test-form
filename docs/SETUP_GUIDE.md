# Complete Setup Guide

This guide will walk you through setting up the Survey Framework application from start to finish.

## Overview

The Survey Framework is a comprehensive application that provides:
- **Supabase Database**: PostgreSQL-powered database with advanced features
- **Advanced Survey Building**: Visual drag-and-drop interface
- **Automated Status Management**: Time-based survey activation/deactivation
- **Data Visualization**: Interactive ECharts-powered charts and analytics
- **Import/Export**: Full system backup and restore capabilities
- **Email Notifications**: Automatic SMTP email notifications on survey completion
- **Real-time Error Logging**: Live error tracking with instant UI updates and automatic cleanup

## Prerequisites

- Node.js 20+
- npm or yarn
- Git
- Supabase account
- GitHub account (for deployment and automation)

## Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-username/service-line-survey.git
cd service-line-survey

# Install dependencies
npm install
```

## Step 2: Set Up Supabase Database

**Why Supabase?**
- ✅ Automated survey status management
- ✅ Advanced data visualization  
- ✅ Complete audit trail
- ✅ SQL capabilities for complex queries
- ✅ GitHub Actions integration
- ✅ Real-time updates
- ✅ Real-time error logging with live UI updates
- ✅ Predictable pricing

**Setup Steps:**
1. **Follow [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** for detailed instructions
2. **Create your `.env.local` file:**
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_ADMIN_PASSWORD=your-secure-password
   ```
3. **Optional: Configure SMTP for email notifications** (see Step 2.5 below)

## Step 2.5: Configure Email Notifications (Optional)

The Survey Framework can automatically send email notifications to participants when they complete surveys.

**SMTP Configuration:**

Set up SMTP secrets in your Supabase project:

```bash
# Gmail example
npx supabase secrets set SMTP_HOST=smtp.gmail.com
npx supabase secrets set SMTP_PORT=587
npx supabase secrets set SMTP_USERNAME=your-gmail@gmail.com
npx supabase secrets set SMTP_PASSWORD=your-app-password

# Exchange/Outlook example
npx supabase secrets set SMTP_HOST=smtp-mail.outlook.com
npx supabase secrets set SMTP_PORT=587
npx supabase secrets set SMTP_USERNAME=your-email@outlook.com
npx supabase secrets set SMTP_PASSWORD=your-password

# Mailtrap (for testing) example
npx supabase secrets set SMTP_HOST=sandbox.smtp.mailtrap.io
npx supabase secrets set SMTP_PORT=2525
npx supabase secrets set SMTP_USERNAME=your-mailtrap-username
npx supabase secrets set SMTP_PASSWORD=your-mailtrap-password

# Optional: Admin email for receiving copies
npx supabase secrets set ADMIN_EMAIL=admin@yourcompany.com
```

**Deploy the Email Edge Function:**

```bash
# Deploy the email function
npx supabase functions deploy send-survey-email
```

**How it works:**
- Automatically detects email fields in survey responses
- Sends professional HTML and plain text emails
- Works with any SMTP provider (Gmail, Exchange, Mailtrap, etc.)
- Non-blocking: survey completion works even if email fails

📖 **Detailed Guide**: See [SMTP_EMAIL_SETUP.md](./SMTP_EMAIL_SETUP.md) for comprehensive instructions.

## Step 3: Local Development

```bash
# Start the development server
npm run dev

# Open your browser to http://localhost:5173
```

**Test your setup:**
1. ✅ Application loads without errors
2. ✅ Admin panel is accessible at `/admin`
3. ✅ You can create survey configurations
4. ✅ Database connection is working
5. ✅ Email notifications work (if configured)

## Step 4: GitHub Setup for Deployment

### Configure GitHub Secrets

1. **Go to your repository → Settings → Secrets and variables → Actions**
2. **Add the required secrets:**

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # For automation
VITE_ADMIN_PASSWORD=your-secure-password
# Email secrets are set separately using supabase CLI
```

**📖 Detailed Instructions:** See [GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md)

### Enable GitHub Pages

1. **Go to repository Settings → Pages**
2. **Select "GitHub Actions" as source**
3. **Push your code to trigger deployment**

## Step 5: Test Automation

Test the automated survey status management system:

```bash
# Install test dependencies
npm install @supabase/supabase-js dotenv

# Run the automation test
node scripts/test-status-automation.js
```

**Manual Testing:**
1. Create a survey instance with a date range
2. Go to GitHub → Actions → "Update Survey Instance Status"
3. Click "Run workflow" to test automation
4. Check Supabase audit trail for logged changes

## Step 6: Create Your First Survey

1. **Access Admin Panel**: Navigate to `/admin`
2. **Create Survey Configuration**: 
   - Add sections and fields
   - Configure option sets (rating scales, radio options)
   - Save your configuration
3. **Create Survey Instance**:
   - Choose your configuration
   - Set title and description
   - Configure date range (Supabase only)
   - Generate shareable URL
4. **Test Survey**: Use the generated URL to test the survey

## Step 7: Production Deployment

### For Netlify (Recommended Future)
1. **Connect your GitHub repository to Netlify**
2. **Set environment variables in Netlify dashboard**
3. **Deploy and test**

### For GitHub Pages (Current)
1. **Push to main branch** (automatic deployment)
2. **Monitor Actions tab** for build status
3. **Access your app** at `https://yourusername.github.io/repo-name`

## Common Issues & Solutions

### Database Connection Issues
- **Check environment variables** are correctly set
- **Verify database provider** matches your setup
- **Test database connection** using provided test scripts

### Deployment Issues
- **Check GitHub Actions logs** for build errors
- **Verify all required secrets** are set
- **Ensure main branch** has latest code

### Automation Not Working (Supabase)
- **Verify service role key** is set in GitHub Secrets
- **Check GitHub Actions logs** for automation workflow
- **Test manually** using the GitHub Actions interface

## Key Features

✅ **Automated Status Management**: Surveys activate/deactivate based on date ranges  
✅ **Advanced Data Visualization**: Interactive ECharts-based charts with filtering and export  
✅ **Complete Audit Trail**: Track all system changes and user actions  
✅ **Real-time Updates**: Live data synchronization across all clients  
✅ **Full Import/Export**: Complete system backup and restore capabilities  
✅ **GitHub Actions Integration**: Scheduled automation workflows  
✅ **SQL Database**: PostgreSQL with advanced query capabilities  
✅ **Email Notifications**: Universal SMTP support for automatic survey completion emails  
✅ **Predictable Pricing**: Fixed-tier pricing model

## Next Steps

1. **Create your surveys** using the admin interface
2. **Share survey URLs** with your target audience
3. **Monitor responses** in the admin panel
4. **Export data** for analysis
5. **Use automation features** (Supabase) for scheduled surveys

## Getting Help

- **Check the troubleshooting sections** in specific setup guides
- **Review GitHub Actions logs** for deployment issues
- **Test database connections** using provided scripts
- **Create GitHub issues** for bugs or feature requests

## Documentation References

- **[README.md](./README.md)** - Overview and quick start
- **[DATABASE_SETUP.md](./DATABASE_SETUP.md)** - Database provider comparison
- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Detailed Supabase setup
- **[SMTP_EMAIL_SETUP.md](./SMTP_EMAIL_SETUP.md)** - Email notification configuration
- **[GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md)** - GitHub deployment setup
- **[ADMIN_PASSWORD_SETUP.md](./ADMIN_PASSWORD_SETUP.md)** - Admin security setup

---

**🎉 You're ready to build amazing surveys!**