# Fixing Supabase RLS Issues

## Problem
You're encountering "new row violates row-level security policy" errors when trying to add data. This happens because:

1. Your app uses anonymous authentication
2. Supabase RLS policies require authenticated users for admin operations
3. You need elevated permissions for admin panel operations

## Solution

### Step 1: Get Your Service Role Key

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project: `gmzoqgdzdpuwsoqluoen`
3. Go to **Settings** → **API**
4. Copy the **service_role secret** key (NOT the anon public key)
5. This key bypasses RLS policies for admin operations

### Step 2: Update Your Environment

Replace `your_service_role_key_here` in `.env.local` with your actual service role key:

```bash
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtenUxxxx
```

**Note**: The `VITE_` prefix is required for Vite to expose the environment variable to the browser.

**⚠️ SECURITY WARNING:**
- Never commit the service role key to git
- Add `.env.local` to your `.gitignore` (if not already)
- In production, use environment variables or secrets management

### Step 3: Restart Your Application

After updating the environment variable:
1. Stop your development server
2. Restart it with `npm run dev` or `yarn dev`

## What Was Changed

The code has been updated to:
1. Create two Supabase clients: one for anonymous users, one for admin operations
2. Use the service role client for admin operations (bypasses RLS)
3. Keep using anonymous client for public survey submissions

## Testing

After setting up the service role key, try adding data again. You should now be able to:
- ✅ Add survey configurations
- ✅ Create survey instances  
- ✅ Add option sets (rating scales, etc.)
- ✅ Perform other admin operations

Anonymous users can still:
- ✅ Submit survey responses
- ✅ View active surveys

## Alternative Solutions (If Service Role Key Doesn't Work)

If you can't use the service role key, you could modify the RLS policies to be more permissive:

1. **Option A**: Allow anonymous inserts for specific tables
2. **Option B**: Implement proper user authentication
3. **Option C**: Create custom RLS policies based on your needs

Let me know if you need help with any of these alternatives!