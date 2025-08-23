# reCAPTCHA Setup Guide

This guide explains how to set up and use reCAPTCHA with your Survey Application (using Supabase backend).

## Prerequisites

1. Google reCAPTCHA account: https://www.google.com/recaptcha/admin
2. Supabase project with Edge Functions (for backend verification)
3. Your survey application

## Step 1: Configure reCAPTCHA

1. Go to the [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Click "Create" to add a new site
3. Choose "reCAPTCHA v2" with "I'm not a robot" checkbox
4. Add your domain(s):
   - For development: `localhost`, `127.0.0.1`
   - For production: Your actual domain
5. Accept the terms and click "Submit"
6. Copy both the **Site Key** and **Secret Key**

## Step 2: Environment Variables

Add the reCAPTCHA site key to your `.env` file:

```env
# reCAPTCHA Configuration
VITE_RECAPTCHA_SITE_KEY=your-recaptcha-site-key-here
```

**Important**: Never expose the secret key in the frontend. It should only be used in backend/server code.

## Step 3: Supabase Edge Function (Backend Verification)

Create a Supabase Edge Function to verify reCAPTCHA tokens on the server side:

### Install Supabase CLI (if not already installed)

```bash
npm install -g @supabase/supabase-js
# or use npx for project-specific usage
npx supabase
```

### Initialize Firebase Functions

```bash
firebase init functions
```

### Create the verification function

Create `functions/src/index.ts`:

```typescript
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

interface ReCaptchaVerificationResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}

export const verifyRecaptcha = functions.https.onCall(async (data, context) => {
  try {
    const { token } = data;

    if (!token) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "reCAPTCHA token is required"
      );
    }

    // Get the secret key from environment variables
    const secretKey = functions.config().recaptcha?.secret_key;

    if (!secretKey) {
      throw new functions.https.HttpsError(
        "internal",
        "reCAPTCHA secret key not configured"
      );
    }

    // Verify the token with Google
    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          secret: secretKey,
          response: token,
        }),
      }
    );

    if (!response.ok) {
      throw new functions.https.HttpsError(
        "internal",
        "reCAPTCHA verification request failed"
      );
    }

    const verificationData: ReCaptchaVerificationResponse =
      await response.json();

    if (!verificationData.success) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "reCAPTCHA verification failed"
      );
    }

    return { success: true };
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    throw new functions.https.HttpsError(
      "internal",
      "reCAPTCHA verification failed"
    );
  }
});
```

### Set the secret key in Firebase

```bash
firebase functions:config:set recaptcha.secret_key="your-recaptcha-secret-key-here"
```

### Deploy the function

```bash
firebase deploy --only functions
```

## Step 4: Update Frontend to Use Cloud Function

Update your `src/utils/recaptcha.utils.ts` to include the Cloud Function verification:

```typescript
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth } from "@/config/firebase";

// ... existing code ...

/**
 * Verify reCAPTCHA token using Firebase Cloud Function
 * @param token - The reCAPTCHA token from the frontend
 * @returns Promise<boolean> - Whether the token is valid
 */
export async function verifyReCaptchaTokenWithFirebase(
  token: string
): Promise<boolean> {
  try {
    const functions = getFunctions();
    const verifyRecaptcha = httpsCallable(functions, "verifyRecaptcha");

    const result = await verifyRecaptcha({ token });
    return (result.data as any).success;
  } catch (error) {
    console.error("Error verifying reCAPTCHA token:", error);
    return false;
  }
}
```

## Step 5: Update App.tsx to Use Firebase Function

Update the `handleSubmit` function in `src/App.tsx`:

```typescript
import { verifyReCaptchaTokenWithFirebase } from "@/utils/recaptcha.utils";

// In handleSubmit function:
if (isReCaptchaConfigured() && formData.recaptchaToken) {
  const isValid = await verifyReCaptchaTokenWithFirebase(
    formData.recaptchaToken
  );
  if (!isValid) {
    throw new Error("reCAPTCHA verification failed");
  }
}
```

## Step 6: Testing

1. Start your development server: `npm run dev`
2. Fill out the survey form
3. Complete the reCAPTCHA verification
4. Submit the form
5. Check the browser console and Firebase Functions logs for any errors

## Security Notes

1. **Never expose the secret key** in frontend code or client-side JavaScript
2. **Always verify tokens on the server side** using the secret key
3. **Use HTTPS** in production to ensure secure communication
4. **Set appropriate domain restrictions** in the reCAPTCHA admin console
5. **Monitor for abuse** and adjust reCAPTCHA settings as needed

## Troubleshooting

### reCAPTCHA not showing

- Check that the site key is correctly set in your environment variables
- Verify the domain is added to your reCAPTCHA configuration
- Check browser console for any JavaScript errors

### Verification failing

- Ensure the secret key is correctly set in Firebase Functions config
- Check Firebase Functions logs for detailed error messages
- Verify the token is being passed correctly from frontend to backend

### Domain errors

- Add all necessary domains (including localhost for development) to reCAPTCHA settings
- Ensure the domain matches exactly (including protocol and port)

## Production Deployment

1. Update your reCAPTCHA domain settings to include your production domain
2. Deploy your Firebase Functions to production
3. Set the production secret key in Firebase Functions config
4. Update your environment variables with the production site key
5. Test thoroughly in production environment

## Additional Resources

- [reCAPTCHA Documentation](https://developers.google.com/recaptcha)
- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
