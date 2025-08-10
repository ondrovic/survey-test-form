# Layout Utilities Documentation

## Overview

The layout utilities provide consistent grid and flexbox layouts across all multi-option form components, ensuring professional appearance and optimal user experience.

## Components Updated

### Form Components
- `CheckboxGroup` (multiselect fields)
- `RadioGroup` (radio fields)

### Preview Components  
- `SurveyPreview` (rating field badges)
- `PaginatedSectionRenderer` (rating field badges)

## Layout Options

### `balanced` (Default)
Distributes items evenly to avoid awkward wrapping:
- 1-2 items: Single row
- 3-4 items: 2 columns
- 5 items: 3 columns (2-2-1 layout)
- 6 items: 3 columns (2-2-2 layout)
- 7-8 items: 2 columns (even distribution)
- 9-12 items: 3 columns
- 13+ items: 2-4 columns (responsive)

### `grid`
Smart grid that maximizes space usage:
- 1-2 items: Single row
- 3-4 items: 2 columns
- 5-6 items: 3 columns
- 7-8 items: 4 columns
- 9-12 items: 3-4 columns (responsive)
- 13+ items: 2-5 columns (responsive)

### `horizontal`
Flex wrap (original behavior)

### `vertical`
Stack items vertically

## Badge Layouts

For small elements like rating badges, uses `getBadgeLayoutClasses()`:
- More conservative column counts
- Smaller gaps (`gap-2` vs `gap-3`)
- Optimized for readability

## Usage

```typescript
// In form components
import { getSmartLayoutClasses } from '../../../utils/layout.utils';

const layoutClasses = getSmartLayoutClasses(options.length, 'balanced');

// For badge-style elements
import { getBadgeLayoutClasses } from '../../../utils/layout.utils';

<div className={getBadgeLayoutClasses(field.options.length)}>
  {/* badge elements */}
</div>
```

## Benefits

- ✅ Eliminates awkward wrapping (5 on top, 1 underneath)
- ✅ Consistent appearance across all components
- ✅ Responsive design for all screen sizes
- ✅ Touch-friendly sizing (44px minimum height)
- ✅ Professional grid distributions
- ✅ Centralized layout logic for easy maintenance