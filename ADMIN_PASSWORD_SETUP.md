# Admin Password Setup Guide

This guide explains how to set up the admin password for accessing the survey data download functionality.

## Overview

The admin panel allows authorized users to download all survey responses as an Excel file (.xlsx). Access is protected by a password that should be stored securely as a GitHub secret.

## Setup Instructions

### 1. Local Development

For local development, add the admin password to your `.env` file:

```bash
# Copy from env.example
cp env.example .env

# Edit .env and set your admin password
VITE_ADMIN_PASSWORD=your-secure-password-here
```

### 2. Production Setup (GitHub Secrets)

For production deployment, the admin password should be stored as a GitHub secret:

1. **Go to your GitHub repository**

   - Navigate to your repository on GitHub
   - Click on "Settings" tab
   - Click on "Secrets and variables" → "Actions"

2. **Add the admin password secret**

   - Click "New repository secret"
   - Name: `ADMIN_PASSWORD`
   - Value: Your secure admin password
   - Click "Add secret"

3. **Verify the secret is used in the workflow**
   - The GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically uses this secret
   - The secret is injected as `VITE_ADMIN_PASSWORD` during the build process

## Security Best Practices

### Password Requirements

- Use a strong, unique password (at least 12 characters)
- Include uppercase, lowercase, numbers, and special characters
- Avoid common words or patterns
- Consider using a password generator

### Access Control

- Only share the password with authorized personnel
- Regularly rotate the password
- Monitor access logs if possible
- Consider implementing additional security measures for sensitive data

### Environment Variables

- Never commit the actual password to version control
- Always use environment variables or secrets
- Use different passwords for development and production

## Accessing the Admin Panel

### Method 1: Hidden Button

- Look for a subtle settings icon in the top-right corner of the application
- The button has low opacity and becomes visible on hover
- Click to open the admin panel

### Method 2: Keyboard Shortcut

- Press `Ctrl + Shift + A` (Windows/Linux) or `Cmd + Shift + A` (Mac)
- This will open the admin panel directly

### Method 3: Developer Tools

- Open browser developer tools (F12)
- In the console, you can programmatically trigger the admin panel:
  ```javascript
  // This will open the admin panel
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      ctrlKey: true,
      shiftKey: true,
      key: "A",
    })
  );
  ```

## Admin Panel Features

Once authenticated, the admin panel provides:

1. **Dynamic Data Download**: Download all survey responses as an Excel file with columns automatically generated based on the service line constants
2. **File Naming**: Automatic filename generation with current date
3. **Data Format**: Comprehensive Excel export with all survey fields including:
   - Personal information (name, email, franchise)
   - Business information (market regions, licenses, focus)
   - All residential service lines with ratings (dynamically based on `RESIDENTIAL_SERVICE_LINES`)
   - All commercial service lines with ratings (dynamically based on `COMMERCIAL_SERVICE_LINES`)
   - All industry selections with ratings (dynamically based on `INDUSTRIES`)
   - Additional notes for each section
4. **Security**: Session-based authentication (logout required for new session)
5. **Automatic Updates**: When service line constants are updated, the Excel export automatically includes the new fields

## Troubleshooting

### Password Not Working

- Verify the password is correctly set in GitHub secrets
- Check that the deployment completed successfully
- Ensure the environment variable is properly injected during build

### Download Issues

- Check browser console for errors
- Verify Firebase connection is working
- Ensure you have proper permissions to access the data

### Build Failures

- Verify all required secrets are set in GitHub
- Check the GitHub Actions logs for specific error messages
- Ensure the workflow file is properly configured

## Support

If you encounter issues with the admin panel setup:

1. Check the browser console for error messages
2. Verify all environment variables are properly configured
3. Review the GitHub Actions deployment logs
4. Contact the development team for assistance

## Example Configuration

### Local Development (.env)

```bash
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_ADMIN_PASSWORD=your-secure-admin-password
```

### GitHub Secrets

- `ADMIN_PASSWORD`: your-secure-admin-password
- `VITE_FIREBASE_API_KEY`: your-firebase-api-key
- `VITE_FIREBASE_AUTH_DOMAIN`: your-project.firebaseapp.com
- `VITE_FIREBASE_PROJECT_ID`: your-project-id
- `VITE_FIREBASE_STORAGE_BUCKET`: your-project.appspot.com
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: 123456789
- `VITE_FIREBASE_APP_ID`: 1:123456789:web:abcdef123456
- `VITE_FIREBASE_MEASUREMENT_ID`: G-XXXXXXXXXX
