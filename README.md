# Service Line Survey

A comprehensive survey framework application built on Supabase with advanced survey building, automated status management, and data visualization capabilities.

<!-- Last updated: 2025-01-17 -->

## 🚀 Features

### Core Survey System
- **Modern React 18 + TypeScript**: Built with the latest React features and strict TypeScript
- **Professional UI/UX**: Clean, accessible design with smooth animations
- **Supabase Database**: PostgreSQL-powered database with advanced features
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Accessibility**: Full ARIA compliance and keyboard navigation

### Survey Management
- **Visual Survey Builder**: Drag-and-drop interface for creating complex surveys
- **Dynamic Form Rendering**: Support for multiple field types (text, radio, checkbox, rating, etc.)
- **Survey Instances**: Create multiple instances of surveys with different configurations
- **Automated Status Management**: Time-based activation/deactivation with audit trails
- **Slug-based URLs**: Human-readable survey URLs for easy sharing

### Data & Analytics
- **Advanced Data Visualization**: Interactive charts and graphs for survey responses
- **Real-time Filtering**: Filter and analyze data by date ranges, sections, and fields
- **Excel Export**: Export survey data and configurations for external analysis
- **Audit Trail**: Complete logging of all survey instance status changes

### Admin Features
- **Comprehensive Admin Panel**: Manage surveys, option sets, and view analytics
- **Import/Export System**: Backup and restore survey configurations
- **Generic Option Set Management**: Reusable rating scales, radio sets, and multi-select options
- **Security**: reCAPTCHA integration and secure authentication

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Routing**: React Router DOM v7
- **Styling**: Tailwind CSS, CSS Custom Properties
- **Icons**: Lucide React
- **State Management**: React Context + Custom hooks
- **Form Handling**: React Hook Form
- **Drag & Drop**: @dnd-kit/core for survey builder
- **Data Storage**: Supabase PostgreSQL database
- **Database**: PostgreSQL (via Supabase), Firestore (Firebase)
- **Charts**: Custom chart components with visualization utilities
- **Excel Export**: xlsx library for admin downloads
- **reCAPTCHA**: Google reCAPTCHA v2 integration
- **Deployment**: GitHub Pages → Netlify (planned)
- **CI/CD**: GitHub Actions with automated survey status management
- **Automation**: Database functions and triggers for scheduled tasks

## 📋 Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account
- Supabase project setup

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

### 3. Environment Setup

Copy the environment example file and configure your Supabase settings:

```bash
cp env.example .env.local
```

Edit `.env.local` with your Supabase configuration:

```env
VITE_DATABASE_PROVIDER=supabase
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
VITE_ADMIN_PASSWORD=your-secure-admin-password
VITE_USE_OPTIMIZED_PROVIDER=true
```

**⚠️ Important:** The `.env.local` file is for local development only and should never be committed to the repository.

### 4. Database Setup

**Quick Setup (Recommended):** Follow [SUPABASE_SIMPLE_SETUP.md](./SUPABASE_SIMPLE_SETUP.md) for a simple setup without RLS.

**Advanced Setup:** Follow [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) to set up your Supabase database with:
- Full SQL database capabilities
- Advanced data visualization
- Automated status management
- Better performance for complex queries
- Complete audit trail system

### 5. GitHub Secrets Setup (Production Deployment)

For secure production deployment, set up the following GitHub secrets in your repository:

**🔒 This is required for production deployment only. Local development uses `.env.local`.**

1. **Go to your repository Settings → Secrets and variables → Actions**
2. **Add the following repository secrets based on your database provider:**

   | Secret Name                    | Description               | Required |
   | ------------------------------ | ------------------------- | -------- |
   | `VITE_SUPABASE_URL`           | Supabase project URL      | Yes      |
   | `VITE_SUPABASE_ANON_KEY`      | Supabase anon key         | Yes      |
   | `SUPABASE_SERVICE_ROLE_KEY`   | For automated status mgmt | Yes      |
   | `VITE_ADMIN_PASSWORD`         | Admin panel password      | Yes      |

**📖 Detailed Setup Guide:** See [GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md) for step-by-step instructions.

### 6. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (Vite default port)

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

## 📜 Available Scripts

### Development
- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn preview` - Preview production build

### Code Quality
- `yarn lint` - Run ESLint
- `yarn lint:fix` - Fix ESLint issues automatically
- `yarn type-check` - Run TypeScript type checking

### Testing
- `yarn test` - Run tests with Vitest
- `yarn test:ui` - Run tests with UI
- `yarn test:coverage` - Run tests with coverage report

### Database
- `yarn db:setup` - Instructions for database setup
- `yarn db:migrate` - Run database migrations

### Supabase Edge Functions
- `yarn supabase:login` - Login to Supabase CLI
- `yarn supabase:link` - Link to your Supabase project
- `yarn supabase:functions:deploy` - Deploy all Edge Functions
- `yarn supabase:functions:deploy:analytics` - Deploy analytics function
- `yarn supabase:functions:deploy:validation` - Deploy validation function

## 🏗️ Project Structure

```
service-line-survey/
├── src/
│   ├── components/          # React components
│   │   ├── admin/          # Admin panel and survey builder
│   │   ├── common/         # Reusable UI components
│   │   ├── form/           # Form-specific components
│   │   └── survey/         # Survey-specific components
│   ├── contexts/           # React Context providers
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript type definitions
│   │   ├── database-rows.types.ts    # Database row types
│   │   └── normalized-schema.types.ts # Normalized schema types
│   ├── repositories/       # Repository pattern implementation
│   ├── mappers/            # Data mapping between domain and database
│   ├── services/           # Business logic services
│   ├── providers/          # Database provider implementations
│   ├── utils/              # Utility functions
│   ├── config/             # Configuration files
│   ├── styles/             # Global styles
│   ├── tests/              # Test files
│   ├── app.tsx             # Main app component
│   └── main.tsx            # App entry point
├── supabase/
│   └── functions/          # Edge Functions
│       ├── survey-analytics/    # Analytics function
│       └── survey-validation/   # Validation function
├── scripts/                # Database and utility scripts
│   ├── reset-supabase-optimized.sql   # Database reset
│   ├── setup-supabase-optimized.sql   # Optimized setup
│   └── test-status-automation.js      # Test script
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

- **useAuth**: Authentication state management
- **useToast**: Toast notifications
- **useSurveyData**: Survey data and configuration management
- **useSurveyBuilder**: Survey builder state and operations
- **useAdminTab**: Admin panel tab navigation

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

### Key System Features

- **Supabase Integration**: Full PostgreSQL database with advanced SQL capabilities
- **Automated Survey Management**: Time-based activation/deactivation with GitHub Actions
- **Advanced Data Visualization**: Interactive charts with filtering and export capabilities
- **Survey Framework**: Complete admin interface for creating and managing surveys
- **Import/Export System**: Backup and restore survey configurations and data
- **Audit Trail**: Complete logging of all system changes and user actions
- **Slug-based URLs**: Human-readable survey links for better user experience
- **Security**: Admin authentication and reCAPTCHA spam protection

### Environment Variables

| Variable                    | Description               | Required |
| --------------------------- | ------------------------- | -------- |
| `VITE_SUPABASE_URL`        | Supabase project URL      | Yes      |
| `VITE_SUPABASE_ANON_KEY`   | Supabase anon key         | Yes      |
| `VITE_ADMIN_PASSWORD`       | Admin panel password      | Yes      |

### Database Setup

Set up your Supabase database:

1. Create a Supabase project at [https://supabase.com](https://supabase.com)
2. Run the setup script from `scripts/setup-supabase.sql`
3. Configure environment variables
4. Includes automated status management and advanced features

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) and [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed setup instructions.

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
