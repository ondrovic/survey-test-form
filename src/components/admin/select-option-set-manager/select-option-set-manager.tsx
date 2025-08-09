import React from 'react';
import { SelectOptionSet } from '../../../types/framework.types';
import { selectOptionSetConfig } from '../../../configs/option-set-configs';
import { GenericOptionSetManager } from '../generic-option-set-manager';

interface SelectOptionSetManagerProps {
  isVisible: boolean;
  onClose: () => void;
  onOptionSetSelect?: (optionSetId: string) => void;
  editingOptionSet?: SelectOptionSet | null;
  isCreating?: boolean;
  filterMultiple?: boolean; // true = show only allowMultiple=true, false = show only allowMultiple=false, undefined = show all
}

export const SelectOptionSetManager: React.FC<SelectOptionSetManagerProps> = ({
  isVisible,
  onClose,
  onOptionSetSelect,
  editingOptionSet,
  isCreating,
  filterMultiple,
}) => {
  const renderAdditionalFields = ({ data, setField }: {
    data: any;
    setField: (field: string, value: any) => void;
  }) => (
    <div className="mt-6">
      <div className="flex items-center">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={!!data.allowMultiple}
            onChange={(e) => setField('allowMultiple', e.target.checked)}
            className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
          />
          <span className="ml-2 text-sm text-gray-700">Allow multiple selections</span>
        </label>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        {data.allowMultiple 
          ? "Users can select multiple options from this dropdown"
          : "Users can only select one option from this dropdown"
        }
      </p>
      {filterMultiple !== undefined && (
        <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
          {filterMultiple 
            ? "Note: Only showing option sets that allow multiple selections"
            : "Note: Only showing option sets that allow single selection"
          }
        </div>
      )}
    </div>
  );

  return (
    <GenericOptionSetManager
      isVisible={isVisible}
      onClose={onClose}
      config={selectOptionSetConfig}
      onOptionSetSelect={onOptionSetSelect}
      editingOptionSet={editingOptionSet}
      isCreating={isCreating}
      renderAdditionalFields={renderAdditionalFields}
    />
  );
};