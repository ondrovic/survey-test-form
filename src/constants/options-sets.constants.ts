/**
 * Global constants for options sets
 */

export const RATING_OPTION_SET_NAME = 'Rating Scales' as const;
export const RATING_OPTION_BUTTON_NAME = 'Rating' as const;

export const RADIO_OPTION_SET_NAME = 'Radio Buttons' as const;
export const RADIO_OPTION_BUTTON_NAME = 'Radio' as const;

export const MULTISELECT_OPTION_SET_NAME = 'Checkboxes' as const;
export const MULTISELECT_OPTION_BUTTON_NAME = 'Checkbox' as const;

export const SELECT_OPTION_SET_NAME = 'Dropdowns' as const;
export const SELECT_OPTION_BUTTON_NAME = 'Dropdown' as const;

// Delete confirmation title prefix
export const DELETE_OPTION_SET_TITLE_PREFIX = 'Delete' as const;

// Delete confirmation message template
export const DELETE_CONFIRMATION_MESSAGE = (name: string) => 
    `Are you sure you want to delete '${name}'? This action cannot be undone.` as const;

// Empty state messages
export const RATING_EMPTY_MESSAGE = 'No rating scales found. Create your first rating scale to get started.' as const;
export const RADIO_EMPTY_MESSAGE = 'No radio option sets found. Create your first radio option set to get started.' as const;
export const MULTISELECT_EMPTY_MESSAGE = 'No multi-select option sets found. Create your first multi-select option set to get started.' as const;
export const SELECT_EMPTY_MESSAGE = 'No select option sets found. Create your first select option set to get started.' as const;

// Overview card descriptions
export const RATING_OVERVIEW_DESCRIPTION = 'Create and manage reusable rating scales with default values' as const;
export const RADIO_OVERVIEW_DESCRIPTION = 'Create and manage single-selection option groups' as const;
export const MULTISELECT_OVERVIEW_DESCRIPTION = 'Create and manage multiple-selection option groups with constraints' as const;
export const SELECT_OVERVIEW_DESCRIPTION = 'Create and manage dropdown-style option groups' as const;

// Overview card action labels
export const RATING_ACTION_LABEL = 'Manage Rating Scale Options' as const;
export const RADIO_ACTION_LABEL = 'Manage Radio Options' as const;
export const MULTISELECT_ACTION_LABEL = 'Manage Checkbox Options' as const;
export const SELECT_ACTION_LABEL = 'Manage Dropdown Options' as const;

// Overview card statistics labels
export const SCALES_STATISTIC_LABEL = 'Available Scales' as const;
export const SETS_STATISTIC_LABEL = 'Available Sets' as const;

// Statistics value formatters
export const SCALES_COUNT = (count: number) => `${count} scales` as const;
export const SETS_COUNT = (count: number) => `${count} sets` as const;

// Form labels and buttons
export const SAVE_BUTTON_LABEL = 'Save' as const;
export const SAVING_BUTTON_LABEL = 'Saving...' as const;
export const CANCEL_BUTTON_LABEL = 'Cancel' as const;
export const ADD_OPTION_BUTTON_LABEL = 'Add Option' as const;

// Form section titles
export const CREATE_NEW_PREFIX = 'Create New' as const;
export const EDIT_PREFIX = 'Edit' as const;
export const OPTIONS_SECTION_TITLE = 'Options' as const;
export const PREVIEW_SECTION_TITLE = 'Preview' as const;
export const LIVE_PREVIEW_BADGE = 'Live Preview' as const;

// Form field labels
export const NAME_FIELD_LABEL = 'Name' as const;
export const DESCRIPTION_FIELD_LABEL = 'Description' as const;
export const VALUE_FIELD_LABEL = 'Value' as const;
export const LABEL_FIELD_LABEL = 'Label' as const;
export const COLOR_FIELD_LABEL = 'Color' as const;
export const DEFAULT_FIELD_LABEL = 'Default' as const;

// Form placeholders
export const NAME_FIELD_PLACEHOLDER = 'Enter name' as const;
export const DESCRIPTION_FIELD_PLACEHOLDER = 'Enter description (optional)' as const;
export const VALUE_FIELD_PLACEHOLDER = 'e.g., option_value' as const;
export const LABEL_FIELD_PLACEHOLDER = 'e.g., Option label' as const;

// Preview messages
export const NO_OPTIONS_PREVIEW_TITLE = 'No options to preview' as const;
export const NO_OPTIONS_PREVIEW_SUBTITLE = 'Add some options above to see how they\'ll appear' as const;

// Option counters
export const OPTION_COUNT_SINGLE = 'option' as const;
export const OPTION_COUNT_PLURAL = 'options' as const;
export const TOTAL_OPTIONS_LABEL = 'Total options:' as const;
export const DEFAULT_OPTIONS_LABEL = 'Default options:' as const;

// Tooltips
export const DELETE_OPTION_TOOLTIP = 'Delete option' as const;