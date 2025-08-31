# GitHub Secrets Setup Guide

This guide will help you set up GitHub secrets for secure deployment of the Service Line Survey App with Supabase integration.

## 🔐 Why GitHub Secrets?

GitHub secrets allow you to store sensitive information (like Supabase API keys) securely without exposing them in your code or repository. This is essential for public repositories.

## 📋 Environment Setup Strategy

### **Local Development** → Use `.env.local`

- Create a `.env.local` file in your project root
- Add your Supabase configuration for local development
- This file should be in `.gitignore` (never committed)
- Used when running `npm run dev` locally

### **Production Deployment** → Use GitHub Secrets

- Configure secrets in your GitHub repository settings
- Used by GitHub Actions during deployment
- Secure and encrypted
- Not exposed in the deployed application

**Both use the same Supabase configuration values, but in different environments.**

### **SMTP Email Configuration** → Use Supabase Secrets

- SMTP credentials are stored as Supabase secrets (not GitHub secrets)
- Set using Supabase CLI: `npx supabase secrets set SMTP_HOST=your-host`
- Used by Supabase Edge Functions for email notifications
- See [SMTP_EMAIL_SETUP.md](./SMTP_EMAIL_SETUP.md) for details

## 📋 Required Secrets

You need to set up the following secrets in your GitHub repository:

| Secret Name                    | Description                      | Required | Example                                    |
| ------------------------------ | -------------------------------- | -------- | ------------------------------------------ |
| `VITE_SUPABASE_URL`           | Supabase project URL             | Yes      | `https://abc123.supabase.co`               |
| `VITE_SUPABASE_ANON_KEY`      | Supabase anonymous key           | Yes      | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ...` |
| `SUPABASE_SERVICE_ROLE_KEY`   | Supabase service role key        | Yes      | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ...` |
| `VITE_ADMIN_PASSWORD`          | Admin panel password             | Yes      | `your-secure-admin-password`               |

### SMTP Configuration (Separate - Not GitHub Secrets)

IMPORTANT: SMTP credentials are NOT stored as GitHub secrets. They are stored as Supabase secrets using the Supabase CLI:

| SMTP Secret Name | Description                    | Set Via Supabase CLI               |
| ---------------- | ------------------------------ | ---------------------------------- |
| `SMTP_HOST`      | SMTP server hostname           | `npx supabase secrets set SMTP_HOST=smtp.gmail.com` |
| `SMTP_PORT`      | SMTP server port               | `npx supabase secrets set SMTP_PORT=587`            |
| `SMTP_USERNAME`  | SMTP authentication username   | `npx supabase secrets set SMTP_USERNAME=user@gmail.com` |
| `SMTP_PASSWORD`  | SMTP authentication password   | `npx supabase secrets set SMTP_PASSWORD=app-password`   |
| `ADMIN_EMAIL`    | Admin email for copies         | `npx supabase secrets set ADMIN_EMAIL=admin@company.com` (optional) |

## 🚀 Setup Instructions

### Step 1: Get Your Supabase Configuration

1. Go to the [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the configuration values:

Your Supabase config values:

```bash
# Project URL
VITE_SUPABASE_URL=https://your-project-id.supabase.co

# Anonymous key (public)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ...

# Service role key (private - for automation)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ...

# Admin password (you choose this)
VITE_ADMIN_PASSWORD=your-secure-admin-password
```

### Step 2: Add Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret one by one:

   **For each secret:**

   - **Name**: Use the exact name from the table above
   - **Value**: Copy the corresponding value from your Supabase config
   - Click **Add secret**

### Step 3: Verify Setup

1. Go to **Actions** tab in your repository
2. Push a change to the main branch
3. Check that the deployment workflow runs successfully
4. Verify that your app is deployed without Supabase connection errors

## 🔍 Troubleshooting

### Common Issues

1. **"Secret not found" errors**

   - Double-check the secret names (they're case-sensitive)
   - Ensure you're adding them as repository secrets, not environment secrets

2. **Supabase connection fails in deployed app**

   - Verify all required secrets are set
   - Check that the values match your Supabase configuration exactly
   - Ensure your Supabase project is properly set up
   - Make sure you're using the correct anon key (not the service role key for client connections)

3. **Build fails with environment variable errors**
   - Make sure all required secrets are added
   - Check the GitHub Actions logs for specific error messages

4. **Email notifications not working**
   - Email configuration is separate from GitHub secrets
   - Use Supabase CLI to set SMTP secrets: `npx supabase secrets set SMTP_HOST=your-host`
   - Check Supabase Edge Function logs for email errors
   - See [SMTP_EMAIL_SETUP.md](./SMTP_EMAIL_SETUP.md) for troubleshooting

### Testing Secrets

You can test if your secrets are working by:

1. Making a small change to your code
2. Pushing to the main branch
3. Checking the GitHub Actions build logs
4. Looking for any environment variable errors

## 🔒 Security Notes

- **Never commit Supabase keys to your repository**
- **GitHub secrets are encrypted and secure**
- **Secrets are only available during GitHub Actions runs**
- **They are not exposed in the deployed application**
- **SMTP credentials are stored separately in Supabase secrets (not GitHub)**
- **Service role key is no longer needed** - RLS has been disabled for simplified authentication

## 📞 Need Help?

If you're having trouble setting up GitHub secrets:

1. Check the [GitHub Secrets documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
2. Verify your Supabase configuration is correct
3. For email issues, see [SMTP_EMAIL_SETUP.md](./SMTP_EMAIL_SETUP.md)
4. Check the troubleshooting section above
5. Create an issue in this repository with specific error messages

---

**Remember**: Your Supabase configuration is sensitive information. Always use GitHub secrets for public repositories!

**For Email Setup**: See [SMTP_EMAIL_SETUP.md](./SMTP_EMAIL_SETUP.md) for complete SMTP configuration instructions.
