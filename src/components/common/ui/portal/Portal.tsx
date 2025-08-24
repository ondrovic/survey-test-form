import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
  container?: Element;
}

export const Portal: React.FC<PortalProps> = ({ children, container }) => {
  const defaultContainer = useRef<HTMLDivElement>();

  useEffect(() => {
    if (!container) {
      defaultContainer.current = document.createElement('div');
      defaultContainer.current.className = 'portal-container';
      document.body.appendChild(defaultContainer.current);
    }
    
    return () => {
      if (defaultContainer.current && document.body.contains(defaultContainer.current)) {
        document.body.removeChild(defaultContainer.current);
      }
    };
  }, [container]);

  const targetContainer = container || defaultContainer.current;
  
  return targetContainer ? createPortal(children, targetContainer) : null;
};