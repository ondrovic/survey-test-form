# Database Setup Guide

This application now supports multiple database providers: Firebase, Supabase, and PostgreSQL. You can choose which provider to use based on your needs.

## Configuration

Set your database provider in your `.env` file:

```env
VITE_DATABASE_PROVIDER=firebase  # or 'supabase' or 'postgres'
```

## Firebase Setup (Default)

Firebase is the default provider and requires no database schema setup.

1. Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Set up your environment variables:

```env
VITE_DATABASE_PROVIDER=firebase
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

## Supabase Setup

Supabase provides a PostgreSQL database with a nice dashboard and real-time capabilities.

1. Create a Supabase project at [https://supabase.com/](https://supabase.com/)
2. Run the database migration:
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `database/migrations/001_initial_schema.sql`
   - Execute the migration
3. Set up your environment variables:

```env
VITE_DATABASE_PROVIDER=supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Instance-Specific Response Tables

For Supabase, you'll need to create response tables for each survey instance. These are created automatically when the first response is submitted, but you can also create them manually:

```sql
-- Example for a survey instance with ID "customer-satisfaction-001"
CREATE TABLE IF NOT EXISTS survey_responses_customer_satisfaction_001 (
    id SERIAL PRIMARY KEY,
    survey_instance_id VARCHAR(255) NOT NULL,
    config_version VARCHAR(255) NOT NULL,
    responses JSONB NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## PostgreSQL Setup

Use this option for a direct PostgreSQL connection (local or remote).

1. Set up a PostgreSQL database
2. Run the database migration from `database/migrations/001_initial_schema.sql`
3. Set up your environment variables:

```env
VITE_DATABASE_PROVIDER=postgres
VITE_POSTGRES_HOST=localhost
VITE_POSTGRES_PORT=5432
VITE_POSTGRES_DATABASE=survey_db
VITE_POSTGRES_USERNAME=survey_user
VITE_POSTGRES_PASSWORD=your-password-here
VITE_POSTGRES_SSL=false
```

### Local PostgreSQL Setup

If you want to run PostgreSQL locally:

1. Install PostgreSQL
2. Create a database and user:

```sql
CREATE DATABASE survey_db;
CREATE USER survey_user WITH PASSWORD 'your-password-here';
GRANT ALL PRIVILEGES ON DATABASE survey_db TO survey_user;
```

3. Run the migration:

```bash
psql -h localhost -U survey_user -d survey_db -f database/migrations/001_initial_schema.sql
```

## Migration from Firebase

If you're migrating from Firebase to Supabase or PostgreSQL, you'll need to export your data from Firebase and import it into your new database. The data structures are designed to be compatible, but you may need to transform the data slightly due to different field naming conventions:

### Field Mappings

- `isActive` (Firebase) → `is_active` (SQL databases)
- `configId` (Firebase) → `config_id` (SQL databases)
- `surveyInstanceId` (Firebase) → `survey_instance_id` (SQL databases)
- `configVersion` (Firebase) → `config_version` (SQL databases)
- `submittedAt` (Firebase) → `submitted_at` (SQL databases)
- `activeDateRange` (Firebase) → `active_date_range` (SQL databases)
- `maxSelections` (Firebase) → `max_selections` (SQL databases)
- `minSelections` (Firebase) → `min_selections` (SQL databases)
- `allowMultiple` (Firebase) → `allow_multiple` (SQL databases)

## Provider Comparison

| Feature | Firebase | Supabase | PostgreSQL |
|---------|----------|----------|------------|
| Setup Complexity | Low | Medium | High |
| Real-time Updates | Yes | Yes | No |
| Offline Support | Yes | Limited | No |
| Cost | Pay-per-use | Fixed tiers | Infrastructure cost |
| Scalability | Auto-scaling | Auto-scaling | Manual scaling |
| SQL Queries | No | Yes | Yes |
| Self-hosted | No | Yes | Yes |

## Troubleshooting

### Common Issues

1. **"Database service not initialized"**: Make sure you've called `initializeDatabase()` before using any database operations
2. **Connection timeouts**: Check your network configuration and database credentials
3. **Migration errors**: Ensure your database user has the necessary permissions to create tables and indexes

### Debug Information

The application logs which database provider is being used during initialization. Check the browser console for messages like:

```
Initializing database with provider: firebase
Database service initialized successfully
```

## Performance Considerations

- **Firebase**: Optimized for real-time applications, good for small to medium datasets
- **Supabase**: Good balance of features and performance, built on PostgreSQL
- **PostgreSQL**: Best for large datasets and complex queries, requires more setup

## Backup and Recovery

- **Firebase**: Built-in backup through Firebase console
- **Supabase**: Built-in point-in-time recovery and manual backups
- **PostgreSQL**: Standard PostgreSQL backup tools (pg_dump, etc.)