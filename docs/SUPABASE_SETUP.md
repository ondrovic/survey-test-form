# Supabase Database Setup Guide

This guide will help you set up a Supabase database for the Survey Application.

## 1. Create a Supabase Project

1. Go to https://supabase.com and sign up/log in
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `survey-app-dev` (or your preferred name)
   - **Database Password**: Choose a strong password (you'll need this later)
   - **Region**: Choose the closest region to your users
5. Click "Create new project"
6. Wait for the project to be created (this may take a few minutes)

## 2. Configure Environment Variables

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project-id.supabase.co`)
   - **Project API Keys** → **anon public** (the public key)

3. Update your `.env.local` file:

```env
VITE_DATABASE_PROVIDER=supabase
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
VITE_ADMIN_PASSWORD=your-secure-admin-password
```

## 3. Set Up Database Schema

### Option A: Optimized Setup (Recommended)

For the best performance and features, use the optimized schema:

1. In your Supabase project dashboard, go to **SQL Editor**
2. **First run**: Copy and paste the entire contents of `scripts/reset-supabase-optimized.sql` and click "Run"
3. **Then run**: Copy and paste the entire contents of `scripts/setup-supabase-optimized.sql` and click "Run"

This sets up:
- ✅ Legacy and normalized schemas for backward compatibility
- ✅ 10x faster query performance with proper indexing
- ✅ Security model updated (RLS disabled for realtime compatibility)
- ✅ Real-time subscriptions enabled
- ✅ Complete audit trails and analytics tables
- ✅ Real-time error logging with instant UI updates and trigger-based cleanup
- ✅ Automated session and error maintenance

### Option B: Basic Setup

For a simpler setup (legacy only):

1. In your Supabase project dashboard, go to **SQL Editor**
2. Copy the entire contents of `scripts/setup-supabase.sql`
3. Paste it into the SQL editor and click "Run"

This will create all the necessary tables and automation functions:

### Core Tables
- `survey_configs` - Survey configuration templates
- `survey_instances` - Active survey instances
- `survey_responses` - User responses to surveys
- `rating_scales` - Reusable rating scale definitions
- `radio_option_sets` - Radio button option sets
- `multi_select_option_sets` - Multi-select option sets
- `select_option_sets` - Select dropdown option sets
- `survey_instance_status_changes` - **NEW: Audit trail for status changes**
- `error_logs` - **NEW: Intelligent error logging system**
- `surveys` - Legacy survey data (for backward compatibility)

### Automation Functions
- `update_survey_instance_statuses()` - **NEW: Automated status updates**
- `get_upcoming_status_changes()` - **NEW: Preview upcoming changes**
- `log_survey_instance_status_change()` - **NEW: Audit trail trigger**
- `log_error()` - **NEW: Error logging function**
- `cleanup_error_logs()` - **NEW: Error maintenance function**
- `lightweight_error_cleanup()` - **NEW: Trigger-based cleanup**

### Database Triggers
- Automatic audit logging for all survey instance status changes
- Updated timestamp triggers for all tables
- **NEW: Error log cleanup trigger** - Automatic maintenance on new error insertion
- **NEW: Session cleanup triggers** - Automated session lifecycle management

## 4. Security Model ✅ **UPDATED**

**RLS has been disabled** to fix realtime subscriptions and simplify authentication.

### Current Security Approach:
1. **Application-level authentication**: Admin password + cookie sessions
2. **No RLS policies**: Realtime subscriptions work perfectly
3. **Single client pattern**: No more multiple client warnings
4. **Network security**: Protected by Supabase's infrastructure

### Migration Applied:
```sql
-- All RLS policies have been removed via:
-- Migration: 20250828000003_disable_all_rls_simplify_auth.sql
```

**Result**: Clean, simple authentication with working realtime features.

## 5. Test the Setup

### Basic Connection Test
1. Start your development server: `npm run dev`
2. Open your browser to the application
3. You should see the application load without database errors
4. Try accessing the admin panel to verify everything works

### Automation System Test
Run the included test script to verify the automation features:

```bash
# Install test dependencies
npm install @supabase/supabase-js dotenv

# Run the automation test
node scripts/test-status-automation.js
```

This will verify:
- Database functions are accessible
- Automation system is ready
- Audit trail is working
- Survey status management is functional

### Manual Verification
1. **Create a survey instance** with a date range in the admin panel
2. **Check audit trail**: Go to Supabase → Table Editor → `survey_instance_status_changes`
3. **Test automation**: Manually trigger GitHub Actions workflow
4. **Verify logs**: Check that status changes are recorded

## 6. Deploy Edge Functions (Optional)

Edge Functions provide server-side analytics and validation capabilities.

### Prerequisites

The Supabase CLI is already included in your project. You just need to authenticate:

```bash
# Login to Supabase
yarn supabase:login

# Link to your project (find YOUR_PROJECT_REF in your Supabase dashboard URL)
yarn supabase:link --project-ref YOUR_PROJECT_REF
```

### Deploy Functions

```bash
# Deploy all Edge Functions
yarn supabase:functions:deploy

# Or deploy individually
npx supabase functions deploy send-survey-email
yarn supabase:functions:deploy:analytics
yarn supabase:functions:deploy:validation
```

### Available Functions

**send-survey-email**
- Automatic email notifications on survey completion
- Universal SMTP support (Gmail, Exchange, Mailtrap, etc.)
- Professional HTML and plain text email formatting
- Dynamic email field detection in survey responses

**survey-analytics**
- Real-time analytics and reporting
- Response trends and completion rates
- Field-level analysis with value distribution
- Time-based grouping (day/week/month)

**survey-validation** 
- Server-side validation for survey responses
- Spam detection and duplicate checking
- Business rules validation
- Date range and instance status checking

### Using Edge Functions

After deployment, you can call them from your application:

```typescript
// Send Survey Email (called automatically on survey completion)
const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-survey-email`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    surveyInstanceId: 'survey-instance-id',
    sessionId: 'session-id',
    recipientEmail: 'user@example.com',
    surveyResponses: { field1: 'value1', field2: 'value2' },
    surveyTitle: 'My Survey'
  })
});

// Survey Analytics
const response = await fetch(`${supabaseUrl}/functions/v1/survey-analytics`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    instanceId: 'survey-instance-id',
    metrics: ['responses', 'field_analysis', 'trends']
  })
});

// Survey Validation
const validation = await fetch(`${supabaseUrl}/functions/v1/survey-validation`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    instanceId: 'survey-instance-id',
    responses: { field1: 'value1', field2: 'value2' }
  })
});
```

## 6.5: Configure Email Notifications (Optional)

To enable automatic email notifications when surveys are completed:

### Set SMTP Secrets

Configure SMTP settings using the Supabase CLI:

```bash
# Required SMTP settings
npx supabase secrets set SMTP_HOST=your-smtp-host
npx supabase secrets set SMTP_PORT=587
npx supabase secrets set SMTP_USERNAME=your-email@example.com
npx supabase secrets set SMTP_PASSWORD=your-password

# Optional: Admin email for receiving copies
npx supabase secrets set ADMIN_EMAIL=admin@yourcompany.com
```

### SMTP Provider Examples

**Gmail:**
```bash
npx supabase secrets set SMTP_HOST=smtp.gmail.com
npx supabase secrets set SMTP_PORT=587
npx supabase secrets set SMTP_USERNAME=your-gmail@gmail.com
npx supabase secrets set SMTP_PASSWORD=your-app-password  # Use App Password, not regular password
```

**Exchange/Outlook:**
```bash
npx supabase secrets set SMTP_HOST=smtp-mail.outlook.com
npx supabase secrets set SMTP_PORT=587
npx supabase secrets set SMTP_USERNAME=your-email@outlook.com
npx supabase secrets set SMTP_PASSWORD=your-password
```

**Mailtrap (for testing):**
```bash
npx supabase secrets set SMTP_HOST=sandbox.smtp.mailtrap.io
npx supabase secrets set SMTP_PORT=2525
npx supabase secrets set SMTP_USERNAME=your-mailtrap-username
npx supabase secrets set SMTP_PASSWORD=your-mailtrap-password
```

### Deploy Email Function

```bash
npx supabase functions deploy send-survey-email
```

### Test Email Configuration

The system automatically:
- Detects email fields in survey responses (looks for fields containing 'email')
- Sends professional HTML and plain text emails
- Works with any SMTP provider
- Fails gracefully (survey completion works even if email fails)

📖 **Detailed Guide**: See [SMTP_EMAIL_SETUP.md](./SMTP_EMAIL_SETUP.md) for comprehensive instructions.

## 7. Configure Automation (Required for Production)

### GitHub Secrets Setup

For the automated survey status management to work, you need to configure GitHub Secrets:

1. **Go to your GitHub repository Settings → Secrets and variables → Actions**
2. **Add these secrets:**

   | Secret Name                | Description                  | Where to find it |
   | -------------------------- | ---------------------------- | ---------------- |
   | `VITE_SUPABASE_URL`       | Your project URL             | Supabase → Settings → API |
   | `VITE_SUPABASE_ANON_KEY`  | Anonymous/public key         | Supabase → Settings → API |
   | `SUPABASE_SERVICE_ROLE_KEY` | **Service role key (important!)** | Supabase → Settings → API |

   ⚠️ **Important**: The `SUPABASE_SERVICE_ROLE_KEY` is different from the anon key and is required for the automation to work.

   **Note**: SMTP secrets are set separately using the Supabase CLI and are not added to GitHub secrets.

### Test the Automation

The GitHub Actions workflow will run automatically every 6 hours, but you can test it manually:

1. **Go to your repository → Actions tab**
2. **Find "Update Survey Instance Status" workflow**
3. **Click "Run workflow" to test manually**
4. **Check the logs** to see if surveys were activated/deactivated

## 7. For Production

When you're ready for production:

1. **Create a separate Supabase project** for production
2. **Run the same setup script** on the production database
3. **Update your production environment variables** and GitHub secrets
4. **Configure proper RLS policies** for security
5. **Set up backup and monitoring**
6. **Test the automation system** in the production environment

## Troubleshooting

### Common Issues:

1. **"Cannot read properties of undefined (reading 'from')"**
   - Check that your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
   - Verify the database schema was created successfully

2. **Authentication errors**
   - Make sure you're using the correct anon key (not the service role key)
   - Check that your project URL is correct

3. **CORS errors**
   - Supabase handles CORS automatically, but ensure you're using the correct project URL

4. **Missing tables**
   - Re-run the setup script in the Supabase SQL Editor
   - Check the database schema in the Table Editor

5. **Email notifications not working**
   - Verify SMTP secrets are set: `npx supabase secrets list`
   - Check Edge Function logs in Supabase dashboard
   - Ensure the send-survey-email function is deployed
   - Test with Mailtrap for debugging

### Useful Supabase Dashboard Sections:

- **Table Editor**: View and edit your data
- **SQL Editor**: Run custom queries and scripts
- **API Docs**: Auto-generated API documentation
- **Logs**: View database and API logs
- **Settings** → **API**: Get your project URLs and keys

## Development vs Production

For the best development experience:

- **Development**: Use a separate Supabase project with relaxed security
- **Production**: Use a different project with proper RLS policies and security measures

This allows you to test freely in development without affecting production data.