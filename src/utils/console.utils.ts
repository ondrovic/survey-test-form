/**
 * Suppress specific console warnings that are not actionable
 */
export const suppressConsoleWarnings = () => {
  // Store original console methods
  const originalWarn = console.warn;
  const originalError = console.error;

  // Override console.warn to filter out passive event listener warnings
  console.warn = (...args: any[]) => {
    const message = args[0];
    if (typeof message === 'string' && 
        (message.includes('Added non-passive event listener') || 
         message.includes('wheel') ||
         message.includes('scroll-blocking'))) {
      return; // Suppress this warning
    }
    originalWarn.apply(console, args);
  };

  // Override console.error to filter out passive event listener violations
  console.error = (...args: any[]) => {
    const message = args[0];
    if (typeof message === 'string' && 
        (message.includes('Added non-passive event listener') || 
         message.includes('wheel') ||
         message.includes('scroll-blocking'))) {
      return; // Suppress this error
    }
    originalError.apply(console, args);
  };
}; 