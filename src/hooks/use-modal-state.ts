import { useState, useCallback } from 'react';

export interface ModalState<T = any> {
  isOpen: boolean;
  data: T | null;
}

export const useModalState = <T = any>(initialData: T | null = null) => {
  const [state, setState] = useState<ModalState<T>>({
    isOpen: false,
    data: initialData
  });

  const open = useCallback((data?: T) => {
    setState({
      isOpen: true,
      data: data || null
    });
  }, []);

  const close = useCallback(() => {
    setState({
      isOpen: false,
      data: null
    });
  }, []);

  const toggle = useCallback((data?: T) => {
    setState(prev => ({
      isOpen: !prev.isOpen,
      data: prev.isOpen ? null : (data || null)
    }));
  }, []);

  return {
    ...state,
    open,
    close,
    toggle
  };
};