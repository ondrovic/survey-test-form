# SMTP Email Notifications Setup Guide

This guide walks you through setting up automatic email notifications for the Survey Framework. The system sends professional emails to participants when they complete surveys.

## Overview

The email notification system includes:
- **Automatic Detection**: Finds email fields in survey responses automatically
- **Universal SMTP Support**: Works with Gmail, Exchange, Mailtrap, and any SMTP provider
- **Professional Formatting**: Sends both HTML and plain text versions
- **Non-blocking Operation**: Survey completion works even if email fails
- **Admin Copies**: Optional admin email notifications
- **Secure Configuration**: SMTP credentials stored as Supabase secrets

## How It Works

1. **Survey Completion**: When a user completes a survey, the system automatically triggers the email function
2. **Email Detection**: The system looks for email fields in the survey responses using multiple strategies:
   - Direct field name matching (email, Email, emailAddress, etc.)
   - Pattern matching (fields ending with '_email', '_Email', etc.)
   - Content validation (any field containing a valid email address)
3. **Email Generation**: Creates professional HTML and plain text versions of the email
4. **SMTP Delivery**: Sends via your configured SMTP provider
5. **Graceful Fallback**: If email fails, survey completion still succeeds

## Prerequisites

- Supabase project set up
- Supabase CLI installed (`npm install -g supabase`)
- Access to an SMTP email provider

## Step 1: Choose Your SMTP Provider

### Gmail (Recommended for personal use)

**Setup Requirements:**
- Enable 2-Factor Authentication on your Google account
- Generate an App Password (not your regular password)
- Use `smtp.gmail.com` with port 587

**Configuration:**
```bash
npx supabase secrets set SMTP_HOST=smtp.gmail.com
npx supabase secrets set SMTP_PORT=587
npx supabase secrets set SMTP_USERNAME=your-gmail@gmail.com
npx supabase secrets set SMTP_PASSWORD=your-app-password
```

**Getting Gmail App Password:**
1. Go to Google Account Settings → Security
2. Enable 2-Factor Authentication
3. Go to App Passwords section
4. Generate a new app password for "Mail"
5. Use this password (not your regular Gmail password)

### Exchange/Outlook (Recommended for business)

**Configuration:**
```bash
npx supabase secrets set SMTP_HOST=smtp-mail.outlook.com
npx supabase secrets set SMTP_PORT=587
npx supabase secrets set SMTP_USERNAME=your-email@outlook.com
npx supabase secrets set SMTP_PASSWORD=your-password
```

**For Office 365 Business:**
```bash
npx supabase secrets set SMTP_HOST=smtp.office365.com
npx supabase secrets set SMTP_PORT=587
npx supabase secrets set SMTP_USERNAME=your-business-email@company.com
npx supabase secrets set SMTP_PASSWORD=your-password
```

### Mailtrap (Recommended for testing)

**Configuration:**
```bash
npx supabase secrets set SMTP_HOST=sandbox.smtp.mailtrap.io
npx supabase secrets set SMTP_PORT=2525
npx supabase secrets set SMTP_USERNAME=your-mailtrap-username
npx supabase secrets set SMTP_PASSWORD=your-mailtrap-password
```

**Getting Mailtrap Credentials:**
1. Sign up at [mailtrap.io](https://mailtrap.io)
2. Create a new inbox
3. Copy the SMTP credentials from the integration settings

### Other SMTP Providers

The system works with any SMTP provider. Common configurations:

**SendGrid:**
```bash
npx supabase secrets set SMTP_HOST=smtp.sendgrid.net
npx supabase secrets set SMTP_PORT=587
npx supabase secrets set SMTP_USERNAME=apikey
npx supabase secrets set SMTP_PASSWORD=your-sendgrid-api-key
```

**Amazon SES:**
```bash
npx supabase secrets set SMTP_HOST=email-smtp.us-east-1.amazonaws.com
npx supabase secrets set SMTP_PORT=587
npx supabase secrets set SMTP_USERNAME=your-ses-access-key
npx supabase secrets set SMTP_PASSWORD=your-ses-secret-key
```

## Step 2: Configure SMTP Secrets

### Required Secrets

Set these four required secrets using the Supabase CLI:

```bash
npx supabase secrets set SMTP_HOST=your-smtp-host
npx supabase secrets set SMTP_PORT=587  # or your provider's port
npx supabase secrets set SMTP_USERNAME=your-username
npx supabase secrets set SMTP_PASSWORD=your-password
```

### Optional Secrets

```bash
# Optional: Admin email to receive copies of all survey completion emails
npx supabase secrets set ADMIN_EMAIL=admin@yourcompany.com
```

### Verify Secrets

Check that your secrets are set correctly:

```bash
npx supabase secrets list
```

You should see:
- SMTP_HOST
- SMTP_PORT
- SMTP_USERNAME
- SMTP_PASSWORD
- ADMIN_EMAIL (if set)

## Step 3: Deploy the Email Edge Function

Deploy the email function to your Supabase project:

```bash
# Make sure you're logged in and linked to your project
npx supabase login
npx supabase link --project-ref your-project-ref

# Deploy the email function
npx supabase functions deploy send-survey-email
```

Verify deployment in your Supabase dashboard under Functions.

## Step 4: Test the Email System

### Manual Test

You can test the email function directly:

```javascript
// In your browser console or a test script
const response = await fetch('https://your-project.supabase.co/functions/v1/send-survey-email', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-anon-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    surveyInstanceId: 'test-instance',
    sessionId: 'test-session',
    recipientEmail: 'test@example.com',
    surveyResponses: {
      name: 'John Doe',
      feedback: 'Great survey!'
    },
    surveyTitle: 'Test Survey'
  })
});

console.log(await response.json());
```

### Integration Test

Create a test survey with an email field and complete it to test the full integration.

## Email Field Detection

The system automatically detects email fields in survey responses using these strategies:

### Strategy 1: Direct Field Name Matching
Looks for fields with these exact names:
- `email`, `Email`, `EMAIL`
- `emailAddress`, `EmailAddress`, `email_address`
- `participantEmail`, `userEmail`, `user_email`
- `contactEmail`, `contact_email`, `e_mail`, `eMail`

### Strategy 2: Pattern Matching
Looks for fields ending with:
- `_email`, `_Email`, `email`, `Email`

### Strategy 3: Content Validation
Scans all text fields for valid email addresses using regex pattern matching.

## Email Format

The system sends both HTML and plain text versions:

### HTML Version
- Professional styling with company branding
- Formatted survey responses with clear question/answer pairs
- Header with survey title
- Footer with completion timestamp

### Plain Text Version
- Clean, readable format
- All survey responses listed
- Survey completion details

## Troubleshooting

### Common Issues

**1. Email not sending**
```bash
# Check if secrets are set
npx supabase secrets list

# Check function deployment
npx supabase functions list

# Check function logs
npx supabase functions logs send-survey-email
```

**2. Gmail authentication errors**
- Ensure 2FA is enabled on your Google account
- Use App Password, not your regular password
- Check that the App Password was generated for "Mail"

**3. Exchange/Outlook errors**
- Verify you're using the correct SMTP host for your email type
- Check if your organization requires specific security settings

**4. Email not found in survey responses**
```bash
# Check the Edge Function logs to see what fields were detected
npx supabase functions logs send-survey-email --follow
```

### Debug Mode

Enable debug logging by checking the Edge Function logs:

```bash
# Follow logs in real-time
npx supabase functions logs send-survey-email --follow
```

The logs show:
- SMTP configuration (sanitized)
- Email field detection results
- SMTP conversation details
- Success/failure messages

### Test with Mailtrap

For development and testing, use Mailtrap to safely test email sending without sending real emails:

1. Sign up at [mailtrap.io](https://mailtrap.io)
2. Create a test inbox
3. Use Mailtrap SMTP credentials
4. All emails will be captured in your Mailtrap inbox instead of being sent

## Security Considerations

### SMTP Credentials
- Stored securely as Supabase secrets
- Never exposed in client-side code
- Only accessible to Edge Functions

### Email Content
- Survey responses are included in emails
- Consider data privacy regulations (GDPR, etc.)
- Admin email copies should be used carefully

### Rate Limiting
- SMTP providers have sending limits
- Monitor usage to avoid hitting limits
- Consider implementing queuing for high-volume surveys

## Production Deployment

### Environment Separation

Use different SMTP configurations for different environments:

**Development:**
- Use Mailtrap or a dedicated development SMTP account
- Set ADMIN_EMAIL to your development team

**Staging:**
- Use a staging SMTP configuration
- Send emails to test accounts only

**Production:**
- Use production SMTP credentials
- Carefully configure ADMIN_EMAIL
- Monitor email delivery rates

### Monitoring

Monitor your email system:

1. **Supabase Function Logs**: Check for errors
2. **SMTP Provider Metrics**: Monitor delivery rates
3. **Survey Completion Rates**: Ensure email failures don't affect surveys
4. **User Feedback**: Check if users are receiving emails

### Backup Strategy

Consider implementing:
- Fallback SMTP providers
- Email queue for retry logic
- Alternative notification methods (SMS, in-app notifications)

## FAQ

**Q: Do surveys work if email fails?**
A: Yes! Email sending is non-blocking. Survey completion always succeeds even if email fails.

**Q: Can I customize the email template?**
A: Yes, edit the `formatSurveyResponsesAsHTML` and `formatSurveyResponsesAsText` functions in the Edge Function.

**Q: What if my survey doesn't have an email field?**
A: No email will be sent. The system gracefully handles this situation.

**Q: Can I send emails to multiple recipients?**
A: Currently, emails are sent to the email address found in the survey response. You can modify the Edge Function to support multiple recipients.

**Q: How do I change the "from" email address?**
A: The system uses your SMTP username as the "from" address. For custom "from" addresses, configure your SMTP provider accordingly.

**Q: Is there a rate limit for emails?**
A: Rate limits depend on your SMTP provider. Check your provider's documentation for specific limits.

## Support

If you need help:

1. Check the [troubleshooting section](#troubleshooting) above
2. Review Edge Function logs: `npx supabase functions logs send-survey-email`
3. Test with Mailtrap to isolate SMTP issues
4. Create an issue in the project repository

---

**🎉 Your email notification system is now ready!**