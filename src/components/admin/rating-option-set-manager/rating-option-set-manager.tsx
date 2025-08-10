import React from 'react';
import { RatingScale } from '../../../types/framework.types';
import { ratingScaleConfig } from '../../../configs/option-set-configs';
import { GenericOptionSetManager } from '../generic-option-set-manager';

interface RatingScaleManagerProps {
    isVisible: boolean;
    onClose: () => void;
    onScaleSelect?: (scaleId: string) => void;
    editingScale?: RatingScale | null;
    isCreating?: boolean;
}

export const RatingScaleManager: React.FC<RatingScaleManagerProps> = ({
    isVisible,
    onClose,
    onScaleSelect,
    editingScale,
    isCreating,
}) => {
  return (
    <GenericOptionSetManager
      isVisible={isVisible}
      onClose={onClose}
      config={ratingScaleConfig}
      onOptionSetSelect={onScaleSelect}
      editingOptionSet={editingScale}
      isCreating={isCreating}
    />
  );
};