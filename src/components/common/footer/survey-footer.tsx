import React from 'react';
import { clsx } from 'clsx';
import { FooterConfig } from '../../../types/framework.types';

interface SurveyFooterProps {
  config?: FooterConfig;
  className?: string;
}

const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  show: true,
  organizationName: 'Survey Application',
  includeCopyright: true,
  autoUpdateYear: true,
  text: undefined, // Will use default generated text
  links: []
};

export const SurveyFooter: React.FC<SurveyFooterProps> = ({
  config = {},
  className = ''
}) => {
  const mergedConfig = { ...DEFAULT_FOOTER_CONFIG, ...config };

  // Don't render if show is false
  if (mergedConfig.show === false) {
    return null;
  }

  /**
   * Generate footer text following DRY principles
   * Checkboxes apply to both generated and custom text
   * 
   * Examples with generated text:
   * - { organizationName: "Acme Corp", includeCopyright: true, includeAllRightsReserved: true }
   *   → "© 2025 Acme Corp. All rights reserved"
   * 
   * - { includeCopyright: true, includeAllRightsReserved: true }
   *   → "© 2025 All rights reserved"
   * 
   * Examples with custom text:
   * - { text: "Powered by MyApp", includeAllRightsReserved: true }
   *   → "Powered by MyApp. All rights reserved"
   * 
   * - { text: "Custom Footer", includeCopyright: true }
   *   → "© 2025 Custom Footer"
   * 
   * - { text: "Custom Footer", includeCopyright: true, includeAllRightsReserved: true }
   *   → "© 2025 Custom Footer. All rights reserved"
   */
  const getFooterText = (): string => {
    let baseText = '';
    
    // Start with custom text if provided, otherwise build from components
    if (mergedConfig.text) {
      baseText = mergedConfig.text;
    } else {
      // Build text components
      const components: string[] = [];
      
      // Add copyright and year if enabled
      if (mergedConfig.includeCopyright) {
        const year = mergedConfig.autoUpdateYear ? new Date().getFullYear() : 2025;
        components.push(`© ${year}`);
      }
      
      // Add organization name if provided
      if (mergedConfig.organizationName) {
        components.push(mergedConfig.organizationName);
      }
      
      // Build base text from components
      baseText = components.join(' ');
    }
    
    // Apply copyright to ANY base text (custom or generated) if enabled
    if (mergedConfig.includeCopyright && mergedConfig.text) {
      const year = mergedConfig.autoUpdateYear ? new Date().getFullYear() : 2025;
      baseText = `© ${year} ${baseText}`;
    }
    
    const rightsReservedText = 'All rights reserved';
    
    // Apply "All rights reserved" logic to ANY base text (custom or generated)
    if (mergedConfig.includeAllRightsReserved) {
      if (baseText) {
        // For custom text or when we have organization name, use period prefix
        if (mergedConfig.text || mergedConfig.organizationName) {
          baseText += `. ${rightsReservedText}`;
        } else {
          // For generated text without org name (e.g., just "© 2025"), use space
          baseText += ` ${rightsReservedText}`;
        }
      } else {
        // If no existing text, add standalone
        baseText = rightsReservedText;
      }
    }
    
    // Fallback to default if nothing was built
    return baseText || 'Survey Application';
  };

  const footerText = getFooterText();

  return (
    <footer className={clsx(
      'bg-white border-t flex-shrink-0',
      mergedConfig.className,
      className
    )}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col items-center justify-center space-y-4">
          {/* Main footer text */}
          {footerText && (
            <p className="text-sm text-gray-500 text-center">
              {footerText}
            </p>
          )}
          
          {/* Custom links */}
          {mergedConfig.links && mergedConfig.links.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
              {mergedConfig.links.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target={link.external ? '_blank' : undefined}
                  rel={link.external ? 'noopener noreferrer' : undefined}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {link.text}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};

export default SurveyFooter;