import React, { useState } from 'react';

interface CollapsibleProps {
    title: string;
    children: React.ReactNode;
    defaultExpanded?: boolean;
    className?: string;
    titleClassName?: string;
    contentClassName?: string;
}

export const Collapsible: React.FC<CollapsibleProps> = ({
    title,
    children,
    defaultExpanded = false,
    className = '',
    titleClassName = '',
    contentClassName = ''
}) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div className={`border-t pt-4 ${className}`}>
            <button
                onClick={toggleExpanded}
                className={`flex items-center justify-between w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 py-1 ${titleClassName}`}
                aria-expanded={isExpanded}
                aria-controls={`collapsible-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
            >
                <h4 className="font-medium text-gray-700">{title}</h4>
                <svg
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                        isExpanded ? 'transform rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>
            <div
                id={`collapsible-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
                className={`transition-all duration-200 ease-in-out overflow-hidden ${
                    isExpanded ? 'max-h-screen opacity-100 mt-3' : 'max-h-0 opacity-0'
                }`}
            >
                <div className={contentClassName}>
                    {children}
                </div>
            </div>
        </div>
    );
};