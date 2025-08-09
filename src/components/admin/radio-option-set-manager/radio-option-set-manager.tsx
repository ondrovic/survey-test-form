import React from 'react';
import { RadioOptionSet } from '../../../types/framework.types';
import { radioOptionSetConfig } from '../../../configs/option-set-configs';
import { GenericOptionSetManager } from '../generic-option-set-manager';

interface RadioOptionSetManagerProps {
  isVisible: boolean;
  onClose: () => void;
  onOptionSetSelect?: (optionSetId: string) => void;
  editingOptionSet?: RadioOptionSet | null;
  isCreating?: boolean;
}

export const RadioOptionSetManager: React.FC<RadioOptionSetManagerProps> = ({
  isVisible,
  onClose,
  onOptionSetSelect,
  editingOptionSet,
  isCreating,
}) => {
  return (
    <GenericOptionSetManager
      isVisible={isVisible}
      onClose={onClose}
      config={radioOptionSetConfig}
      onOptionSetSelect={onOptionSetSelect}
      editingOptionSet={editingOptionSet}
      isCreating={isCreating}
    />
  );
};