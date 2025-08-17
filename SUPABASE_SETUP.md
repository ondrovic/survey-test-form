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

1. In your Supabase project dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire contents of `scripts/setup-supabase.sql`
4. Paste it into the SQL editor
5. Click "Run" to execute the script

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
- `surveys` - Legacy survey data (for backward compatibility)

### Automation Functions
- `update_survey_instance_statuses()` - **NEW: Automated status updates**
- `get_upcoming_status_changes()` - **NEW: Preview upcoming changes**
- `log_survey_instance_status_change()` - **NEW: Audit trail trigger**

### Database Triggers
- Automatic audit logging for all survey instance status changes
- Updated timestamp triggers for all tables

## 4. Configure Row Level Security (Optional but Recommended)

For production, you should enable Row Level Security (RLS):

1. Go to **Authentication** → **Policies**
2. For each table, you can create policies to control access
3. For development, you might want to allow all operations:

```sql
-- Example: Allow all operations on survey_configs (adjust as needed)
ALTER TABLE survey_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on survey_configs" ON survey_configs
FOR ALL USING (true);

-- Repeat for other tables as needed
```

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

## 6. Configure Automation (Required for Production)

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