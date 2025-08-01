# Service Line Survey App

A modern, professional survey application built with React 18, TypeScript, and Vite. The app features expandable rating sections, Firebase Firestore integration for data storage, and a responsive design optimized for all devices.

## 🚀 Features

- **Modern React 18 + TypeScript**: Built with the latest React features and strict TypeScript
- **Professional UI/UX**: Clean, accessible design with smooth animations
- **Interactive Service Line Selection**: Checkbox-based service line selection with proper state management
- **Expandable Rating Sections**: Click to expand and select High/Medium/Low ratings for selected services
- **Firebase Firestore Integration**: Store survey data in Firebase Firestore
- **Local Storage Fallback**: Works offline with browser storage
- **Form Validation**: Comprehensive client-side validation with real-time feedback
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Accessibility**: Full ARIA compliance and keyboard navigation
- **Auto-deployment**: GitHub Actions workflow for seamless deployment
- **Robust State Management**: Proper handling of complex nested form state with race condition prevention

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, CSS Custom Properties
- **Icons**: Lucide React
- **State Management**: Custom hooks with React patterns
- **Data Storage**: Firebase Firestore + localStorage fallback
- **Deployment**: GitHub Pages
- **CI/CD**: GitHub Actions

## 📋 Prerequisites

- Node.js 20+ (required for Firebase compatibility)
- npm or yarn
- Firebase account (for data storage)
- Firebase project setup

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/service-line-survey.git
cd service-line-survey
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup (Local Development)

For local development, copy the environment example file and configure your Firebase settings:

```bash
cp env.example .env.local
```

Edit `.env.local` with your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

**⚠️ Important:** The `.env.local` file is for local development only and should never be committed to the repository.

### 4. Firebase Setup

Follow the detailed setup guide in [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) to:

1. Create a Firebase project
2. Set up Firestore database
3. Get your Firebase configuration
4. Configure security rules

### 5. GitHub Secrets Setup (Production Deployment)

For secure production deployment, set up the following GitHub secrets in your repository:

**🔒 This is required for production deployment only. Local development uses `.env.local`.**

1. **Go to your repository Settings → Secrets and variables → Actions**
2. **Add the following repository secrets:**

   | Secret Name                         | Description                  | Required |
   | ----------------------------------- | ---------------------------- | -------- |
   | `VITE_FIREBASE_API_KEY`             | Firebase API key             | Yes      |
   | `VITE_FIREBASE_AUTH_DOMAIN`         | Firebase auth domain         | Yes      |
   | `VITE_FIREBASE_PROJECT_ID`          | Firebase project ID          | Yes      |
   | `VITE_FIREBASE_STORAGE_BUCKET`      | Firebase storage bucket      | Yes      |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | Yes      |
   | `VITE_FIREBASE_APP_ID`              | Firebase app ID              | Yes      |
   | `VITE_FIREBASE_MEASUREMENT_ID`      | Firebase measurement ID      | Optional |

3. **Get these values from your Firebase Console:**
   - Go to Project Settings → General → Your apps
   - Copy the values from your Firebase configuration object

**Note:** These secrets are used during the GitHub Actions build process and are not exposed in the deployed application.

**📖 Detailed Setup Guide:** See [GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md) for step-by-step instructions.

### 6. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## 📦 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint (fails on errors)
npm run lint:check   # Run ESLint (never fails, shows issues)
npm run lint:strict  # Run ESLint (fails on warnings)
npm run lint:fix     # Fix ESLint errors automatically
npm run type-check   # Run TypeScript type checking

# Testing
npm run test         # Run tests
npm run test:ui      # Run tests with UI
npm run test:coverage # Run tests with coverage
```

## 🏗️ Project Structure

```
service-line-survey/
├── src/
│   ├── components/          # React components
│   │   ├── common/         # Reusable UI components
│   │   ├── form/           # Form-specific components
│   │   └── survey/         # Survey-specific components
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── constants/          # App constants
│   ├── styles/             # Global styles
│   ├── App.tsx            # Main app component
│   └── main.tsx           # App entry point
├── .github/workflows/      # GitHub Actions
├── public/                 # Static assets
└── dist/                   # Build output
```

## 🎨 Component Architecture

### Reusable Components

- **Button**: Polymorphic button with multiple variants
- **Input**: Generic input with validation support
- **Alert**: Dismissible alert component
- **CheckboxGroup**: Multiple selection component
- **RadioGroup**: Single selection component
- **RatingSection**: Expandable rating component
- **ServiceLineSection**: Interactive service line selection with rating capabilities

### Custom Hooks

- **useForm**: Form state management with validation
- **useLocalStorage**: Local storage persistence
- **useFirebaseStorage**: Firebase data storage with fallback
- **useValidation**: Form validation utilities

## 🌐 Deployment

### GitHub Pages Deployment

1. **Enable GitHub Pages**:

   - Go to repository Settings → Pages
   - Select "GitHub Actions" as source

2. **Set up GitHub Secrets** (Required):

   - Follow the GitHub Secrets Setup section above
   - Ensure all Firebase configuration secrets are added to your repository

3. **Push to Main Branch**:

   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

4. **Monitor Deployment**:
   - Check the Actions tab for deployment status
   - Your app will be available at `https://your-username.github.io/service-line-survey/`

### Manual Deployment

```bash
npm run build
# Upload dist/ folder to your web server
```

## 🔧 Configuration

### Environment Setup Summary

| Environment               | Configuration Method | Purpose                              |
| ------------------------- | -------------------- | ------------------------------------ |
| **Local Development**     | `.env.local` file    | Development on your local machine    |
| **Production Deployment** | GitHub Secrets       | Secure deployment via GitHub Actions |

**Both use the same Firebase configuration values, but in different secure environments.**

### Recent Improvements

- **Fixed Checkbox State Management**: Resolved race condition issues in service line selection checkboxes
- **Enhanced User Experience**: Improved checkbox interaction with proper state synchronization
- **Robust Form Handling**: Better handling of complex nested form state updates
- **Performance Optimizations**: Reduced unnecessary re-renders and improved state management efficiency

### Environment Variables

| Variable                            | Description                  | Required |
| ----------------------------------- | ---------------------------- | -------- |
| `VITE_FIREBASE_API_KEY`             | Firebase API key             | Yes      |
| `VITE_FIREBASE_AUTH_DOMAIN`         | Firebase auth domain         | Yes      |
| `VITE_FIREBASE_PROJECT_ID`          | Firebase project ID          | Yes      |
| `VITE_FIREBASE_STORAGE_BUCKET`      | Firebase storage bucket      | Yes      |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | Yes      |
| `VITE_FIREBASE_APP_ID`              | Firebase app ID              | Yes      |
| `VITE_FIREBASE_MEASUREMENT_ID`      | Firebase measurement ID      | Optional |

### Firebase Setup

1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/)
2. Set up Firestore database in test mode
3. Get your Firebase configuration from Project Settings
4. The app will automatically create the data collection structure

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## 📱 Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+
- Mobile browsers (iOS 14+, Android Chrome)

## ♿ Accessibility

- Full ARIA compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Reduced motion support

## 🔒 Security

- Environment variables for sensitive data
- Firebase security rules for data access control
- Client-side validation
- Secure data transmission

## 🐛 Troubleshooting

### Common Issues

1. **Firebase Connection Failed**

   - **Local Development**: Verify your `.env.local` file is properly configured
   - **Production**: Verify your GitHub secrets are correctly set
   - Check that Firestore database is set up and accessible
   - Ensure environment variables are correctly set for your environment

2. **Build Errors**

   - Run `npm run type-check` to identify TypeScript issues
   - Run `npm run lint:check` to check for code quality issues (non-blocking)
   - Run `npm run lint` to check for code quality issues (blocking)
   - Ensure all dependencies are installed

3. **Form State Issues**

   - The application now properly handles checkbox state management
   - Service line selections are correctly synchronized between local and form state
   - Race conditions in state updates have been resolved

4. **Deployment Issues**
   - Check GitHub Actions logs for build errors
   - Verify repository settings and permissions
   - Ensure the main branch is properly configured
   - **GitHub Secrets Missing**: Ensure all Firebase configuration secrets are set in repository settings
   - **Build Failures**: Check that all required environment variables are properly configured as GitHub secrets

### Getting Help

1. Check the [Issues](../../issues) page for known problems
2. Create a new issue with detailed error information
3. Include browser console logs and error messages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📝 Changelog

### Latest Updates

- **Updated Node.js Requirement**: Upgraded to Node.js 20+ for Firebase compatibility
- **Enhanced Linting Options**: Added multiple lint commands for different workflow needs
  - `npm run lint:check` - Non-blocking linting for development workflows
  - `npm run lint:strict` - Strict linting that fails on warnings
  - `npm run lint` - Standard linting that fails on errors
- **Fixed Checkbox Functionality**: Resolved issue where checkboxes couldn't be unchecked after being selected
- **Improved State Management**: Implemented robust state synchronization between local component state and form state
- **Enhanced User Experience**: Better handling of complex form interactions with proper race condition prevention
- **Code Quality**: Cleaned up debug code and improved overall code maintainability
- **Security Improvements**: Updated deployment workflow to use GitHub secrets instead of environment files for secure Firebase configuration
- **Documentation**: Added comprehensive GitHub secrets setup guide for secure deployment

### Previous Versions

- Initial release with basic survey functionality
- Added Firebase integration
- Implemented responsive design
- Added form validation and accessibility features

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Lucide React](https://lucide.dev/) - Icons

## 📞 Support

For support and questions:

- Create an issue in this repository
- Check the troubleshooting section above
- Review the documentation and examples

---

**Built with ❤️ using modern web technologies**
