import { Button } from "@/components/common";
import React from "react";
import { useVisualization } from "../../context";

interface AdvancedFiltersProps {
  // sectionNames: string[];
  // subsectionsBySection: Record<string, Array<{ id: string; title: string }>>;
  orderedSections: any[];
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  orderedSections,
}) => {
  const { filters, updateFilters, expandAll, collapseAll, state } =
    useVisualization();

  const handleCollapseAll = () => {
    const allSectionIds = orderedSections.map((s) => s.id);
    const allSubsectionIds = orderedSections.flatMap((s) =>
      (s.subsections || []).map((ss) => ss.id)
    );
    collapseAll(allSectionIds, allSubsectionIds);
  };

  if (!state.showAdvanced) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 items-end">
      {/* Make search span two columns on lg+ screens */}
      <div className="lg:col-span-3"></div>
      <div>
        <label
          htmlFor="search-input"
          className="block text-sm text-gray-700 dark:text-gray-300 mb-1"
        >
          Search
        </label>
        <input
          id="search-input"
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md w-full md:w-72 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="Search"
          value={filters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
        />
      </div>

      <div className="md:col-span-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="form" onClick={expandAll}>
            Expand all
          </Button>
          <Button variant="outline" size="form" onClick={handleCollapseAll}>
            Collapse all
          </Button>
        </div>
      </div>
    </div>
  );
};
