# Error Logging System Documentation

## Overview

The error logging system provides comprehensive error tracking and automatic maintenance for the survey application. It features intelligent severity classification, trigger-based cleanup, real-time UI updates, and efficient database management.

## Architecture

### Components

1. **Error Collection**
   - Global error handlers
   - Component-level error boundaries
   - API/Network error tracking
   - Database error logging
   - User action error tracking

2. **Smart Severity Classification**
   - `critical` - System failures, data corruption
   - `high` - Component crashes, data modification failures, permission errors
   - `medium` - Network issues, API failures, unhandled errors
   - `low` - Chunk loading errors, non-critical failures

3. **Trigger-Based Cleanup**
   - Automatic cleanup on new error insertion
   - Threshold-based activation (>1000 errors)
   - Preserves critical errors longer
   - No UI polling required

4. **Admin Interface**
   - Sortable error table with instant real-time updates
   - Filtering by severity, status, component
   - Manual clear all functionality
   - Modal confirmation dialogs
   - No polling required - live database subscriptions

## Database Schema

### Error Logs Table

```sql
CREATE TABLE error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Error details
    error_message TEXT NOT NULL,
    error_code VARCHAR(100),
    stack_trace TEXT,
    
    -- Context
    component_name VARCHAR(255),
    file_path VARCHAR(500),
    line_number INTEGER,
    function_name VARCHAR(255),
    user_action TEXT,
    
    -- User context
    user_id UUID,
    user_email VARCHAR(255),
    session_token VARCHAR(255),
    survey_instance_id UUID,
    
    -- System info
    user_agent TEXT,
    ip_address INET,
    url TEXT,
    http_method VARCHAR(10),
    browser_info JSONB DEFAULT '{}',
    screen_resolution VARCHAR(50),
    viewport_size VARCHAR(50),
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'ignored')),
    assigned_to VARCHAR(255),
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by VARCHAR(255),
    
    -- Additional data
    additional_context JSONB DEFAULT '{}',
    tags TEXT[],
    error_boundary BOOLEAN DEFAULT false,
    is_handled BOOLEAN DEFAULT false,
    error_hash VARCHAR(64),
    occurrence_count INTEGER DEFAULT 1,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Automatic Cleanup System

### Trigger-Based Cleanup

The system uses database triggers for efficient, automatic cleanup:

```sql
-- Trigger function that runs on new error insertion
CREATE OR REPLACE FUNCTION trigger_error_log_cleanup()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only cleanup when >1000 errors exist
    IF (SELECT COUNT(*) FROM error_logs) > 1000 THEN
        -- Remove resolved/ignored errors older than 7 days
        DELETE FROM error_logs 
        WHERE 
            occurred_at < NOW() - INTERVAL '7 days'
            AND severity NOT IN ('critical')
            AND status IN ('resolved', 'ignored');
    END IF;
    
    RETURN NEW;
END;
$$;
```

### Cleanup Schedule

1. **Trigger-Based** (Real-time)
   - Runs on every error insertion
   - Activates when >1000 errors exist
   - Removes resolved/ignored errors >7 days old
   - Preserves critical errors

2. **Weekly Cron Job** (Deep cleanup)
   - Runs Sunday at 3 AM
   - Removes all errors >90 days old
   - Handles critical error cleanup
   - Final maintenance pass

## Usage

### Frontend Integration

```typescript
import { useErrorLogging } from '@/hooks/use-error-logging';

const { logError, logCriticalError } = useErrorLogging('MyComponent');

try {
  // risky operation
} catch (error) {
  await logError('Operation failed', error, 'high', 'user clicked submit');
}
```

### Service Layer

```typescript
import { ErrorLoggingService } from '@/services/error-logging.service';

// Log with automatic severity detection
await ErrorLoggingService.logUnhandledError(error, errorInfo);

// Log API errors
await ErrorLoggingService.logApiError(
  'Failed to fetch user data',
  '/api/users',
  'GET',
  500,
  response
);
```

### Database Functions

```sql
-- Log error via database function
SELECT log_error(
  p_severity := 'medium',
  p_error_message := 'Database operation failed',
  p_component_name := 'UserService'
);

-- Manual cleanup
SELECT lightweight_error_cleanup();
SELECT cleanup_error_logs(30); -- Keep 30 days
```

## Admin Management

### Error Log Page Features

- **Real-time Updates**: Instant display of new errors via Supabase subscriptions
- **Live Status Changes**: Updates appear immediately without refresh
- **Sorting**: All columns sortable (default: date descending)
- **Filtering**: By severity, status, component, search terms
- **Bulk Actions**: Status updates, clear all
- **Modal Dialogs**: Confirmation for destructive actions
- **Zero Polling**: No background requests - pure event-driven updates

### Management Commands

```sql
-- View active triggers
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'error_logs';

-- View cron jobs
SELECT jobname, schedule, command, active 
FROM cron.job 
WHERE jobname LIKE '%error%';

-- Manual cleanup functions
SELECT lightweight_error_cleanup();
SELECT cleanup_error_logs(90);
```

## Configuration

### Environment Setup

1. **Database Extensions**
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_cron;
   ```

2. **Security Model** ✅ **UPDATED**
   - RLS has been **disabled** to enable real-time subscriptions
   - Security is now handled at the application level (admin password authentication)
   - All database operations use a single client for simplicity

### Browser Extension Filtering

The system automatically filters out browser extension errors:

```typescript
const extensionPatterns = [
  'injected.js',
  'hide-notification',
  'chrome-extension://',
  'moz-extension://',
  'content-script'
];
```

## Performance Considerations

### Indexing Strategy

```sql
-- Primary query indexes
CREATE INDEX idx_error_logs_occurred_at ON error_logs(occurred_at DESC);
CREATE INDEX idx_error_logs_severity ON error_logs(severity);
CREATE INDEX idx_error_logs_status ON error_logs(status);

-- Composite indexes
CREATE INDEX idx_error_logs_severity_status ON error_logs(severity, status, occurred_at DESC);
CREATE INDEX idx_error_logs_unresolved ON error_logs(status, occurred_at DESC) 
WHERE status IN ('open', 'investigating');
```

### Cleanup Strategy

1. **Lightweight**: Removes old resolved/ignored errors (3-7 days)
2. **Standard**: Weekly cleanup of general errors (30-90 days)
3. **Deep**: Periodic cleanup including critical errors
4. **Preservation**: Critical errors kept longer for analysis

## Monitoring

### Health Checks

```sql
-- Check trigger status
SELECT COUNT(*) FROM information_schema.triggers 
WHERE event_object_table = 'error_logs' 
AND trigger_name = 'trigger_cleanup_on_error_insert';

-- Check cleanup effectiveness
SELECT 
  COUNT(*) as total_errors,
  COUNT(*) FILTER (WHERE occurred_at < NOW() - INTERVAL '30 days') as old_errors,
  COUNT(*) FILTER (WHERE status = 'resolved') as resolved_errors
FROM error_logs;
```

### Error Statistics

```sql
-- Get error breakdown
SELECT * FROM get_error_statistics(24, null);

-- Recent error trends
SELECT 
  DATE_TRUNC('hour', occurred_at) as hour,
  severity,
  COUNT(*) as error_count
FROM error_logs 
WHERE occurred_at > NOW() - INTERVAL '24 hours'
GROUP BY 1, 2 
ORDER BY 1 DESC, 2;
```

## Best Practices

1. **Severity Assignment**
   - Use appropriate severity levels
   - Critical for data loss/corruption
   - High for user-facing failures
   - Medium for recoverable errors
   - Low for non-critical issues

2. **Context Information**
   - Include user action context
   - Add relevant component names
   - Provide stack traces when available
   - Tag errors for categorization

3. **Performance**
   - Leverage automatic cleanup
   - Monitor table size growth
   - Use appropriate retention periods
   - Regular statistics review

4. **Security**
   - Never log sensitive information
   - Sanitize user input in error messages
   - Use admin-only access for error logs
   - Regular security audits

## Troubleshooting

### Common Issues

1. **High Error Volume**
   - Check trigger activation threshold
   - Review cleanup effectiveness
   - Adjust retention policies

2. **Missing Triggers**
   ```sql
   -- Recreate trigger
   CREATE TRIGGER trigger_cleanup_on_error_insert
     AFTER INSERT ON error_logs
     FOR EACH ROW
     EXECUTE FUNCTION trigger_error_log_cleanup();
   ```

3. **Cron Job Failures**
   ```sql
   -- Check job status
   SELECT * FROM cron.job_run_details 
   WHERE jobname LIKE '%error%' 
   ORDER BY start_time DESC;
   ```

### Migration Commands

```bash
# Apply new migrations
supabase db push

# Reset database (development only)
yarn db:reset

# Test error logging
node scripts/test-cron-automation.js
```

## Migration History

- `20250827000000` - Initial error logging system
- `20250828000000` - Added daily cron job cleanup  
- `20250828000001` - Added trigger-based cleanup system

This system provides robust, self-maintaining error logging that scales with your application while keeping the UI responsive and the database efficient.