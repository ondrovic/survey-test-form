# Survey Analytics Feature

## Overview

A new analytics dashboard has been added to the admin interface, providing comprehensive insights into survey performance and response data. This feature leverages Apache ECharts for professional-grade data visualization with interactive charts and real-time filtering.

## Features

### 📊 Key Metrics Dashboard

- **Total Responses**: Count of all survey responses
- **Completion Rate**: Percentage of completed surveys
- **Average Completion Time**: Time taken to complete surveys (when tracking is available)
- **Active Surveys**: Number of currently active survey instances

### 📈 Data Visualization (ECharts Integration)

- **Response Trends**: Interactive ECharts bar charts showing response patterns over time
- **Field Analysis**: Dynamic pie charts and histograms for response distribution
- **Value Distribution**: ECharts-powered bar charts and donut charts for top response values
- **Sparklines**: Compact trend indicators for quick metric overviews
- **Export Capability**: Download charts as PNG or SVG formats

### 🔍 Filtering & Grouping

- **Date Ranges**: 7 days, 30 days, or 90 days
- **Grouping Options**: By day, week, or month
- **Instance-specific**: View analytics for specific survey instances

## How to Access

### From Admin Overview

1. Navigate to the Admin section
2. Click on the "Overview" tab
3. Look for the "View Analytics" button in the Quick Actions section
4. Click to open the Analytics dashboard

### Direct Navigation

1. Navigate to the Admin section
2. Click on the "Analytics" tab in the main navigation

## Data Sources

The analytics dashboard pulls data from:

- Survey responses stored in your database
- Survey configurations and field definitions  
- Survey instance metadata
- Response timestamps and metadata
- **Survey sessions for tracking user engagement and abandonment**

## Survey Session Tracking & Abandonment

### Overview

The analytics system includes sophisticated session tracking that monitors user engagement from the moment they start a survey until completion or abandonment. This provides accurate completion rates and identifies where users drop off.

### Session States

| Status | Meaning | How It Gets There |
|--------|---------|------------------|
| `started` | User opened survey, hasn't progressed | Initial session creation when user visits survey |
| `in_progress` | User is actively working on survey | User moved to section 2+ or filled out fields |
| `completed` | Survey submitted successfully | User clicked final submit button |
| `abandoned` | No activity for 24+ hours | Automatic background job marks inactive sessions |
| `expired` | Session manually expired | Optional: immediate cleanup for special cases |

### User Flow & Abandonment Detection

#### Step 1: User Starts Survey
```
1. User clicks survey link
2. System creates survey_session record:
   - status: 'started'
   - started_at: current timestamp
   - session_token: unique identifier
   - current_section: 0
```

#### Step 2: User Progresses
```
1. User fills fields and navigates
2. System updates survey_session:
   - status: 'in_progress' 
   - current_section: incremented
   - last_activity_at: updated on every interaction
```

#### Step 3A: Successful Completion
```
1. User submits final survey
2. System creates survey_response:
   - started_at: from session.started_at
   - completed_at: current timestamp
   - completion_status: 'completed'
   - completion_time_seconds: auto-calculated
3. System updates session status to 'completed'
```

#### Step 3B: Abandonment Detection
```
Automatic abandonment (background job):
- Runs periodically (daily/hourly)
- Marks sessions as 'abandoned' if:
  - Status is 'started' or 'in_progress' 
  - No activity (last_activity_at) for 24+ hours
```

### Edge Cases & Scenarios

#### Page Refresh
- **What happens:** User refreshes browser during survey
- **Behavior:** Frontend checks localStorage for session token, resumes existing session
- **Result:** Session continues, activity updated, NOT abandoned

#### User Returns Next Day
- **What happens:** User closes browser, returns within 24 hours
- **Behavior:** Session remains valid, user can continue where they left off
- **Result:** Session continues, eventually completed successfully

#### True Abandonment
- **What happens:** User starts survey, never returns
- **Behavior:** After 24 hours, background job marks session as 'abandoned'
- **Result:** Session counted in abandonment rate, affects completion statistics

#### Extended Break (30+ Hours)
- **What happens:** User starts survey, gets distracted for over 24 hours
- **Behavior:** Session marked abandoned, user shown "session expired" message on return
- **Result:** Original session = abandoned, new session created if user continues

### Activity Tracking Implementation

The system tracks user activity to determine when sessions should be considered abandoned:

```typescript
// Activities that update last_activity_at:
- Page navigation between sections
- Form field inputs (debounced every 30 seconds)
- Button clicks and form interactions
- Any user interaction with the survey

// Example implementation:
const updateActivity = async () => {
  await updateSurveySession(sessionToken, {
    last_activity_at: new Date().toISOString()
  });
};
```

### Analytics Insights

This session tracking enables accurate analytics:

- **True Completion Rate:** (completed responses ÷ total sessions started) × 100
- **Abandonment Rate:** (abandoned sessions ÷ total sessions started) × 100  
- **Average Completion Time:** Actual time from session start to survey submission
- **Drop-off Analysis:** Identify which sections users abandon most frequently
- **Engagement Metrics:** Track how long users spend on surveys before abandoning

### Database Schema

#### survey_sessions table
```sql
- id: UUID primary key
- survey_instance_id: References survey instance
- session_token: Unique identifier for frontend tracking
- started_at: When session was created
- last_activity_at: Last user interaction timestamp
- current_section: Progress tracking
- status: Current session state
```

#### Enhanced survey_responses table
```sql
- session_id: Links response to originating session
- started_at: Copied from session when survey completed
- completed_at: Submission timestamp
- completion_time_seconds: Auto-calculated duration
- completion_status: 'completed', 'partial', or 'abandoned'
```

### Best Practices

1. **Session Resume:** Always check for existing sessions before creating new ones
2. **Activity Updates:** Update last_activity_at on meaningful user interactions
3. **Graceful Expiry:** Show clear messages when sessions expire
4. **Data Cleanup:** Periodically clean up very old abandoned sessions
5. **Performance:** Use debounced activity updates to avoid excessive database writes

## Technical Implementation

### Components

- `AdminAnalyticsPage`: Main analytics page component
- `AdminVisualizationPage`: Advanced visualization dashboard
- `BaseEChartsComponent`: Core ECharts wrapper for consistent chart behavior
- `EnhancedBarChart`, `SimpleEChartsPie`: Specialized chart components
- `ChartModal`: Full-screen chart viewing with export options
- Integration with existing survey data context and ECharts core

### Data Processing

- Real-time calculation of metrics from survey responses
- Dynamic field analysis based on survey configurations
- Professional chart rendering with Apache ECharts
- Responsive chart sizing and mobile-optimized layouts
- Interactive tooltips and data point highlighting

### Performance Features

- Lazy loading of analytics data
- Efficient data aggregation
- Responsive design for all screen sizes

## Customization

### Adding New Metrics

To add new analytics metrics:

1. Extend data interfaces in `src/components/admin/visualization/types.ts`
2. Add calculation logic in the respective data processing utilities
3. Create new ECharts component or extend existing ones in `src/components/admin/visualization/components/charts/`
4. Update the visualization dashboard to display the new metric

### Custom Charts (ECharts-Based)

The dashboard uses Apache ECharts with a flexible chart system that includes:

- **Chart Types**: Bar, pie, histogram, sparkline, and donut charts
- **Interactive Features**: Zoom, pan, brush selection, and data point highlighting
- **Custom Themes**: Professional color schemes optimized for data clarity
- **Animation Effects**: Smooth transitions and loading animations
- **Export Options**: PNG, SVG, and data export capabilities

## Browser Compatibility

- Modern browsers with ES6+ support
- Responsive design for mobile and desktop
- Optimized for Chrome, Firefox, Safari, and Edge

## Future Enhancements

Potential improvements for future versions:

- ✅ Export functionality for reports (PNG/SVG chart export implemented)
- ✅ Session tracking and abandonment analytics (implemented)
- ✅ Real completion rate and timing tracking (implemented)
- Real-time data updates via WebSocket connections
- Advanced filtering options (by user segments, device types)
- Custom dashboard layouts and widget arrangement
- Integration with external analytics tools (Google Analytics, Mixpanel)
- A/B testing capabilities for survey variations
- Heat maps showing field-level engagement
- Automated abandonment recovery emails

## Troubleshooting

### No Data Displayed

- Check if survey instances are active
- Verify survey responses exist in the database
- Ensure proper database permissions

### Performance Issues

- Large datasets may take time to load
- Consider implementing pagination for very large response sets
- Monitor database query performance

## Support

For issues or questions about the analytics feature:

1. Check the browser console for error messages
2. Verify database connectivity
3. Review survey data integrity
4. Check component prop passing in the admin interface

