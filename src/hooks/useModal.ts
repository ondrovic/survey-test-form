import { useCallback, useState } from "react";

interface UseModalReturn<T = any> {
  isOpen: boolean;
  data: T | null;
  open: (data?: T) => void;
  close: () => void;
  toggle: () => void;
}

export const useModal = <T = any>(): UseModalReturn<T> => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const open = useCallback((modalData?: T) => {
    setIsOpen(true);
    if (modalData !== undefined) {
      setData(modalData);
    }
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
    if (isOpen) {
      setData(null);
    }
  }, [isOpen]);

  return {
    isOpen,
    data,
    open,
    close,
    toggle,
  };
};
