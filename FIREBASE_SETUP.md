# Firebase Setup Guide

## 🚀 Quick Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name it "survey-app" (or your preferred name)
4. Enable Google Analytics (optional)
5. Create project

### 2. Set Up Firestore Database

1. In Firebase Console → Firestore Database
2. Click "Create database"
3. Start in **test mode** (we'll secure it later)
4. Choose a location close to your users (e.g., `us-central1`)

### 3. Get Firebase Config

1. Project Settings → General → Your apps
2. Click "Add app" → Web
3. Register app with name "survey-app"
4. Copy the config object

### 4. Update Environment Variables

Create a `.env` file in your project root with your Firebase config:

```bash
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 5. Deploy to GitHub Pages

1. Push your code to GitHub
2. Enable GitHub Pages in your repository settings
3. Set source to "Deploy from a branch" → `main` branch
4. Your survey will be live at `https://yourusername.github.io/your-repo-name`

## ✅ Benefits of Firebase

- **Free Tier:** 1GB storage, 50K reads/day, 20K writes/day
- **No Rate Limits:** Unlike GitHub API
- **Real-time:** Can sync data in real-time
- **Simple Setup:** Just add Firebase SDK
- **GitHub Pages Compatible:** Works perfectly with static hosting
- **Secure:** Built-in security rules
- **Scalable:** Can handle thousands of survey responses

## 🔒 Security (Optional)

Later, you can secure your Firestore database by adding security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /surveys/{document} {
      allow read, write: if true; // For now, allow all access
    }
  }
}
```

## 📊 Viewing Survey Data

1. Go to Firebase Console → Firestore Database
2. You'll see a `surveys` collection
3. Each survey response will be a document with all the form data
4. You can export data as JSON or CSV

## 🎯 Perfect for Your Use Case

- ✅ **No Server Required:** Firebase handles everything
- ✅ **Free Hosting:** GitHub Pages is free
- ✅ **Easy Sharing:** Just share the GitHub Pages URL
- ✅ **Data Collection:** All responses stored in Firebase
- ✅ **No Rate Limits:** Can handle unlimited survey responses
- ✅ **Professional:** Looks and works like a production app

Your survey will be live and collecting data in minutes! 🚀
