import { useModalState } from '@/hooks';
import { SurveyConfig, SurveyInstance } from '@/types';
import { DeleteModalData } from './use-admin-framework-handlers';

export const useAdminFrameworkModals = () => {
  // Modal states
  const deleteModal = useModalState<DeleteModalData>();
  const settingsModal = useModalState<SurveyInstance>();
  const createInstanceModal = useModalState<SurveyConfig>();
  const importConfigModal = useModalState();
  const importInstanceModal = useModalState();

  // Modal actions interface
  const modalActions = {
    deleteModal: {
      open: deleteModal.open,
      close: deleteModal.close
    },
    settingsModal: {
      open: settingsModal.open,
      close: settingsModal.close
    },
    createInstanceModal: {
      open: createInstanceModal.open,
      close: createInstanceModal.close
    },
    importConfigModal: {
      open: importConfigModal.open,
      close: importConfigModal.close
    },
    importInstanceModal: {
      open: importInstanceModal.open,
      close: importInstanceModal.close
    }
  };

  return {
    modalStates: {
      deleteModal,
      settingsModal,
      createInstanceModal,
      importConfigModal,
      importInstanceModal
    },
    modalActions
  };
};