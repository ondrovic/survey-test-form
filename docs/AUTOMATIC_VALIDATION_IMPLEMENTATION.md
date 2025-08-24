# Automatic Configuration Validation Implementation

## Overview
Implemented automatic configuration validation that runs at key points to ensure survey configurations remain valid without requiring manual intervention.

## New Features

### 1. Automatic Validation Hook (`use-automatic-validation.ts`)
- **Background Validation**: Runs silently without showing success toasts
- **Post-Import Validation**: Automatically triggered after config imports
- **Page Load Validation**: Runs when visiting the Survey Framework admin tab

### 2. Integration Points

#### Config Import (`use-generic-import-export.ts`)
- Automatically runs validation after importing survey configurations
- Detects and handles invalid configurations immediately after import
- Provides console feedback about validation results

#### Survey Framework Admin (`framework.tsx`)  
- Runs background validation when the admin tab loads
- Triggered only when data is available (configs or instances exist)
- Non-intrusive - runs in background with console logging

## Validation Behavior

### Background Mode
- **Silent Operation**: No success toasts, only console logging
- **Error Handling**: Automatically deactivates instances with invalid configurations  
- **Status Tracking**: Uses `config_valid` field to prevent automated reactivation

### Validation Triggers
1. **After Config Import**: Ensures imported configurations are valid
2. **On Tab Visit**: Validates existing configurations when accessing admin panel
3. **Manual**: Original manual validation still available via "Verify" button

## User Experience

### Transparent Operation
- Validation runs automatically without user interaction
- Console logs provide detailed information for debugging
- Invalid configurations are handled automatically

### Feedback Mechanisms
- Console warnings when issues are found
- Automatic deactivation of problematic survey instances
- Existing validation modal still available for detailed review

## Implementation Details

### Files Modified
- `src/hooks/use-automatic-validation.ts` - New validation hook
- `src/hooks/use-generic-import-export.ts` - Added post-import validation
- `src/components/admin/framework/framework.tsx` - Added page load validation
- `src/hooks/index.ts` - Export new hook

### Key Methods
- `runBackgroundValidation()` - Silent validation without UI feedback
- `runPostImportValidation()` - Validation after config import
- `runOnPageLoad()` - Validation when visiting admin tab

## Database Integration

### Config Valid Field
- Uses existing `config_valid` boolean field
- Prevents automated date-range reactivation of invalid instances
- Tracks validation status separately from active status

### Status Change Logging
- Logs validation-based deactivation in `survey_instance_status_changes` table
- Reason: 'config_validation_deactivation'
- Includes `config_valid` status in trigger details

## Benefits

### Proactive Issue Detection
- Catches configuration problems immediately after import
- Prevents invalid configurations from becoming active
- Reduces manual validation overhead

### Improved Reliability
- Automated system won't reactivate problematic instances
- Consistent validation across all entry points
- Background operation doesn't interrupt user workflow

## Future Enhancements

### Potential Additions
- Real-time validation as configurations are edited
- Email notifications for validation failures  
- Dashboard widget showing validation status
- Bulk validation of all configurations periodically

### Configuration Options
- Enable/disable automatic validation
- Adjust validation timing and triggers
- Customize notification preferences

## Testing

### Verification Steps
1. Import a survey configuration with missing option sets
2. Observe automatic background validation in console
3. Verify invalid instances are deactivated (`config_valid=false`)
4. Visit Survey Framework tab and check for automatic validation
5. Create missing option sets and verify instances become eligible for activation

### Console Output
- Look for messages starting with `🔍 Running automatic validation...`
- Check for warnings about invalid configurations
- Verify deactivation messages with `config_valid=false`