import React from 'react';
import { MultiSelectOptionSet } from '../../../types/framework.types';
import { multiSelectOptionSetConfig } from '../../../configs/option-set-configs';
import { GenericOptionSetManager } from '../generic-option-set-manager';
import { Input } from '../../common';

interface MultiSelectOptionSetManagerProps {
  isVisible: boolean;
  onClose: () => void;
  onOptionSetSelect?: (optionSetId: string) => void;
  editingOptionSet?: MultiSelectOptionSet | null;
  isCreating?: boolean;
}

export const MultiSelectOptionSetManager: React.FC<MultiSelectOptionSetManagerProps> = ({
  isVisible,
  onClose,
  onOptionSetSelect,
  editingOptionSet,
  isCreating,
}) => {
  const renderAdditionalFields = ({ data, setField }: {
    data: any;
    setField: (field: string, value: any) => void;
  }) => (
    <>
      <Input
        name="minSelections"
        label="Minimum Selections"
        type="number"
        value={Number(data.minSelections ?? 1)}
        onChange={(value) => setField('minSelections', parseInt(String(value)) || 1)}
        placeholder="1"
      />
      <Input
        name="maxSelections"
        label="Maximum Selections"
        type="number"
        value={Number(data.maxSelections ?? 3)}
        onChange={(value) => setField('maxSelections', parseInt(String(value)) || 3)}
        placeholder="3"
      />
    </>
  );

  return (
    <GenericOptionSetManager
      isVisible={isVisible}
      onClose={onClose}
      config={multiSelectOptionSetConfig}
      onOptionSetSelect={onOptionSetSelect}
      editingOptionSet={editingOptionSet}
      isCreating={isCreating}
      renderAdditionalFields={renderAdditionalFields}
    />
  );
};