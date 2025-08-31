import React from "react";

interface SelectFieldsProps {
  data: any;
  setField: (field: string, value: any) => void;
  filterMultiple?: boolean;
}

/**
 * Additional fields for Select Option Sets
 * Handles allowMultiple configuration with optional filtering notice
 */
export const SelectFields: React.FC<SelectFieldsProps> = ({
  data,
  setField,
  filterMultiple,
}) => (
  <div className="mt-6">
    <div className="flex items-center">
      <label className="flex items-center">
        <input
          type="checkbox"
          checked={!!data.allowMultiple}
          onChange={(e) => setField("allowMultiple", e.target.checked)}
          className="rounded border-gray-300 dark:border-gray-600 text-amber-600 dark:text-amber-500 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 bg-white dark:bg-gray-700"
        />
        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
          Allow multiple selections
        </span>
      </label>
    </div>
    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
      {data.allowMultiple
        ? "Users can select multiple options from this dropdown"
        : "Users can only select one option from this dropdown"}
    </p>
    {filterMultiple !== undefined && (
      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/30 rounded text-xs text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
        {filterMultiple
          ? "Note: Only showing option sets that allow multiple selections"
          : "Note: Only showing option sets that allow single selection"}
      </div>
    )}
  </div>
);