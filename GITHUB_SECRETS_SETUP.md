# GitHub Secrets Setup Guide

This guide will help you set up GitHub secrets for secure deployment of the Service Line Survey App.

## 🔐 Why GitHub Secrets?

GitHub secrets allow you to store sensitive information (like Firebase API keys) securely without exposing them in your code or repository. This is essential for public repositories.

## 📋 Environment Setup Strategy

### **Local Development** → Use `.env.local`

- Create a `.env.local` file in your project root
- Add your Firebase configuration for local development
- This file should be in `.gitignore` (never committed)
- Used when running `npm run dev` locally

### **Production Deployment** → Use GitHub Secrets

- Configure secrets in your GitHub repository settings
- Used by GitHub Actions during deployment
- Secure and encrypted
- Not exposed in the deployed application

**Both use the same Firebase configuration values, but in different environments.**

## 📋 Required Secrets

You need to set up the following secrets in your GitHub repository:

| Secret Name                         | Description                  | Required | Example                        |
| ----------------------------------- | ---------------------------- | -------- | ------------------------------ |
| `VITE_FIREBASE_API_KEY`             | Firebase API key             | Yes      | `AIzaSyC...`                   |
| `VITE_FIREBASE_AUTH_DOMAIN`         | Firebase auth domain         | Yes      | `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID`          | Firebase project ID          | Yes      | `your-project-id`              |
| `VITE_FIREBASE_STORAGE_BUCKET`      | Firebase storage bucket      | Yes      | `your-project.appspot.com`     |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | Yes      | `123456789`                    |
| `VITE_FIREBASE_APP_ID`              | Firebase app ID              | Yes      | `1:123456789:web:abcdef123456` |
| `VITE_FIREBASE_MEASUREMENT_ID`      | Firebase measurement ID      | Optional | `G-XXXXXXXXXX`                 |

## 🚀 Setup Instructions

### Step 1: Get Your Firebase Configuration

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (gear icon) → **General**
4. Scroll down to **Your apps** section
5. Click on your web app (or create one if you haven't)
6. Copy the configuration object

Your Firebase config should look like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
  measurementId: "G-XXXXXXXXXX",
};
```

### Step 2: Add Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret one by one:

   **For each secret:**

   - **Name**: Use the exact name from the table above
   - **Value**: Copy the corresponding value from your Firebase config
   - Click **Add secret**

### Step 3: Verify Setup

1. Go to **Actions** tab in your repository
2. Push a change to the main branch
3. Check that the deployment workflow runs successfully
4. Verify that your app is deployed without Firebase connection errors

## 🔍 Troubleshooting

### Common Issues

1. **"Secret not found" errors**

   - Double-check the secret names (they're case-sensitive)
   - Ensure you're adding them as repository secrets, not environment secrets

2. **Firebase connection fails in deployed app**

   - Verify all required secrets are set
   - Check that the values match your Firebase configuration exactly
   - Ensure your Firebase project is properly set up

3. **Build fails with environment variable errors**
   - Make sure all required secrets are added
   - Check the GitHub Actions logs for specific error messages

### Testing Secrets

You can test if your secrets are working by:

1. Making a small change to your code
2. Pushing to the main branch
3. Checking the GitHub Actions build logs
4. Looking for any environment variable errors

## 🔒 Security Notes

- **Never commit Firebase keys to your repository**
- **GitHub secrets are encrypted and secure**
- **Secrets are only available during GitHub Actions runs**
- **They are not exposed in the deployed application**

## 📞 Need Help?

If you're having trouble setting up GitHub secrets:

1. Check the [GitHub Secrets documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
2. Verify your Firebase configuration is correct
3. Check the troubleshooting section above
4. Create an issue in this repository with specific error messages

---

**Remember**: Your Firebase configuration is sensitive information. Always use GitHub secrets for public repositories!
