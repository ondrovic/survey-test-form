# Multi-Select Field Editor

## Overview

The Multi-Select Field Editor is a new feature that allows administrators to select multiple fields across different sections of a survey and apply bulk updates to them simultaneously. This is particularly useful for updating rating fields to use rating scales or applying common settings to multiple fields at once.

## Features

### Field Selection

- **Multi-select Interface**: Click on any field to select/deselect it for bulk editing
- **Visual Feedback**: Selected fields are highlighted with a blue border and checkmark
- **Section Organization**: Fields are organized by their respective sections for easy navigation
- **Field Information**: Each field displays its type and current configuration (e.g., if it uses a rating scale)

### Bulk Update Options

#### Rating Scale Assignment

- **Select Rating Scale**: Choose from available rating scales to apply to selected rating fields
- **Scale Management**: Integrates with the existing Rating Scale Manager
- **Visual Confirmation**: Selected scale is displayed with a green indicator
- **Clear Option**: Remove rating scale assignment if needed

#### Field Properties

- **Required Field Toggle**: Make selected fields required or optional
- **Placeholder Text**: Set placeholder text for text input fields
- **Batch Application**: Apply changes to all selected fields at once

### User Interface

#### Left Panel - Field Selection

- Lists all sections and their fields
- Click to select/deselect fields
- Shows field type and current configuration
- Displays selection count

#### Right Panel - Bulk Update Options

- Rating scale selection with visual feedback
- Required field toggle
- Placeholder text input
- Apply updates button with loading state

## Usage

### Accessing the Multi-Select Editor

1. Open the Survey Builder
2. Click the "Multi-Edit Fields" button in the header
3. The multi-select editor modal will open

### Selecting Fields

1. Browse through sections in the left panel
2. Click on any field to select it (blue highlight and checkmark)
3. Click again to deselect
4. Selected field count is displayed at the top

### Applying Bulk Updates

1. Select the fields you want to update
2. Configure the desired changes in the right panel:
   - Choose a rating scale (for rating fields)
   - Toggle required field setting
   - Set placeholder text
3. Click "Apply Updates to X Field(s)" button
4. Changes are applied and the modal closes

### Rating Scale Integration

- **Select Scale**: Click "Select Rating Scale" to open the Rating Scale Manager
- **Choose Scale**: Browse and select an available rating scale
- **Apply**: The selected scale will be applied to all selected rating fields
- **Clear**: Remove scale assignment if needed

## Technical Implementation

### Components

- `MultiSelectFieldEditor`: Main component for the multi-select interface
- Integrated with existing `SurveyBuilder` component
- Uses existing `RatingScaleManager` for scale selection

### State Management

- Tracks selected fields across sections
- Manages bulk update options
- Handles loading states and error handling

### Data Flow

1. User selects fields from the survey configuration
2. Configures bulk update options
3. Changes are applied to the survey configuration
4. Updated configuration is passed back to the Survey Builder

## Benefits

### Efficiency

- Update multiple fields simultaneously instead of one-by-one
- Consistent application of settings across related fields
- Reduced time for survey configuration

### Consistency

- Apply rating scales to multiple rating fields at once
- Ensure uniform field properties across sections
- Maintain survey structure integrity

### User Experience

- Intuitive multi-select interface
- Visual feedback for selections and changes
- Integration with existing tools and workflows

## Example Use Cases

### Rating Scale Migration

1. Select all rating fields that should use a specific scale
2. Choose the appropriate rating scale
3. Apply to update all selected fields simultaneously

### Field Standardization

1. Select multiple text input fields
2. Set a common placeholder text
3. Apply to standardize user experience

### Required Field Management

1. Select fields that should be required
2. Toggle the required setting
3. Apply to update field validation

## Future Enhancements

- **Field Type Filtering**: Filter fields by type for easier selection
- **Search Functionality**: Search for specific fields by name
- **Preset Configurations**: Save and reuse common bulk update configurations
- **Undo/Redo**: Add ability to undo bulk changes
- **Validation Preview**: Show how changes will affect form validation
