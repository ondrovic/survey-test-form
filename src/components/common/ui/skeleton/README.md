# Skeleton Loading Components

Reusable skeleton loading components based on Pagedone.io templates for consistent loading states across the application.

## Available Components

### Basic Components

#### `Skeleton`
Default text placeholder with multiple lines.
```tsx
<Skeleton lines={3} />
<Skeleton lines={1} className="w-48" />
```

#### `SkeletonImage`
Image placeholder with optional icon.
```tsx
<SkeletonImage width="200px" height="150px" />
<SkeletonImage className="w-full h-48" showIcon={false} />
```

### Card Components

#### `SkeletonCard`
Complete card placeholder with image, title, content, and actions.
```tsx
<SkeletonCard 
  hasImage={true}
  titleLines={2}
  contentLines={3}
  hasActions={true}
/>
```

#### `SkeletonStatsCard`
Stats card placeholder for dashboard metrics.
```tsx
<SkeletonStatsCard hasIcon={true} hasChart={false} />
```

### Table Components

#### `SkeletonTableRow`
Individual table row skeleton.
```tsx
<SkeletonTableRow columns={5} />
```

For complete table skeleton:
```tsx
<table>
  <tbody>
    {Array.from({ length: 10 }, (_, i) => (
      <SkeletonTableRow key={i} columns={4} />
    ))}
  </tbody>
</table>
```

### List Components

#### `SkeletonListItem`
List item placeholder with optional avatar and actions.
```tsx
<SkeletonListItem 
  hasAvatar={true}
  hasSecondaryText={true}
  hasActions={false}
/>
```

### Chart Components

#### `SkeletonChart`
Chart placeholder for different chart types.
```tsx
<SkeletonChart type="bar" hasLegend={true} />
<SkeletonChart type="pie" height="h-80" />
<SkeletonChart type="line" />
```

### Special Components

#### `SkeletonLongRunning`
For long-running activities with progress indication.
```tsx
<SkeletonLongRunning 
  title="Processing data..."
  description="This may take a few moments"
  showProgress={true}
  progress={45}
/>

// For activities without progress tracking
<SkeletonLongRunning 
  title="Generating report..."
  description="Please wait while we compile your data"
/>
```

#### `SkeletonPage`
Full page skeleton for different content types.
```tsx
<SkeletonPage 
  hasHeader={true}
  hasNavigation={true}
  contentType="cards"
  itemCount={6}
/>

<SkeletonPage contentType="table" itemCount={10} />
<SkeletonPage contentType="list" itemCount={8} />
```

## Common Props

All skeleton components support these common props:

- `className?: string` - Additional CSS classes
- `animate?: boolean` - Enable/disable animation (default: true)

## Usage Examples

### Loading Analytics Dashboard
```tsx
if (loading) {
  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonStatsCard key={i} hasIcon={true} />
        ))}
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonChart type="bar" hasLegend={true} />
        <SkeletonChart type="pie" />
      </div>
    </div>
  );
}
```

### Loading Data Table
```tsx
if (loading) {
  return (
    <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
      <table className="min-w-full">
        <thead>
          <tr>
            {columnHeaders.map((_, i) => (
              <th key={i} className="px-6 py-3">
                <Skeleton lines={1} className="w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: pageSize }, (_, i) => (
            <SkeletonTableRow key={i} columns={columnHeaders.length} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Long Running Operations
```tsx
if (processing) {
  return (
    <SkeletonLongRunning
      title="Importing data..."
      description="Processing your CSV file"
      showProgress={true}
      progress={uploadProgress}
    />
  );
}
```

## Design Principles

1. **Consistent with real content**: Skeletons should match the layout and proportions of actual content
2. **Performance focused**: Minimal DOM nodes and CSS for smooth animations  
3. **Accessible**: Proper ARIA labels and reduced motion support
4. **Dark mode support**: All skeletons work in both light and dark themes
5. **Customizable**: Easy to modify through props and CSS classes

## Animation Control

You can disable animations globally or per component:

```tsx
// Disable animation for specific component
<Skeleton animate={false} />

// Or use CSS to disable animations system-wide
@media (prefers-reduced-motion: reduce) {
  .animate-pulse,
  .animate-spin,
  .animate-bounce {
    animation: none;
  }
}
```