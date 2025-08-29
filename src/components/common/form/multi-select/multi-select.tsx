import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface MultiSelectOption {
    value: string;
    label: string;
}

export interface MultiSelectProps {
    value: string[];
    onChange: (value: string[]) => void;
    options: MultiSelectOption[];
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    maxSelectedLabels?: number;
    display?: 'comma' | 'chip';
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
    value = [],
    onChange,
    options,
    placeholder = 'Select items...',
    disabled = false,
    className = '',
    maxSelectedLabels = 3,
    display = 'comma'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Define toggleOption function before using it in useEffect
    const toggleOption = useCallback((optionValue: string) => {
        const newValue = value.includes(optionValue)
            ? value.filter(v => v !== optionValue)
            : [...value, optionValue];
        onChange(newValue);
    }, [value, onChange]);

    // Filter options based on search term
    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
                setFocusedIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!isOpen) {
                if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
                    event.preventDefault();
                    setIsOpen(true);
                    setFocusedIndex(0);
                }
                return;
            }

            switch (event.key) {
                case 'Escape':
                    setIsOpen(false);
                    setSearchTerm('');
                    setFocusedIndex(-1);
                    break;
                case 'ArrowDown':
                    event.preventDefault();
                    setFocusedIndex(prev =>
                        prev < filteredOptions.length - 1 ? prev + 1 : prev
                    );
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    setFocusedIndex(prev => prev > 0 ? prev - 1 : -1);
                    break;
                case 'Enter':
                    event.preventDefault();
                    if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
                        toggleOption(filteredOptions[focusedIndex].value);
                    }
                    break;
                case 'Tab':
                    setIsOpen(false);
                    setSearchTerm('');
                    setFocusedIndex(-1);
                    break;
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, focusedIndex, filteredOptions, toggleOption]);

    const removeOption = (optionValue: string) => {
        onChange(value.filter(v => v !== optionValue));
    };

    const getDisplayValue = () => {
        if (value.length === 0) return '';

        if (display === 'chip') {
            return `${value.length} selected`;
        }

        const selectedLabels = value
            .map(v => options.find(opt => opt.value === v)?.label)
            .filter(Boolean);

        if (selectedLabels.length <= maxSelectedLabels) {
            return selectedLabels.join(', ');
        }

        return `${selectedLabels.slice(0, maxSelectedLabels).join(', ')} +${selectedLabels.length - maxSelectedLabels}`;
    };

    const handleInputClick = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen) {
                setFocusedIndex(0);
                setTimeout(() => inputRef.current?.focus(), 0);
            }
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setFocusedIndex(0);
        if (!isOpen) {
            setIsOpen(true);
        }
    };

    return (
        <div
            ref={containerRef}
            className={`relative ${className}`}
        >
            {/* Main input */}
            <div
                className={`
          flex items-center justify-between w-full px-3 py-2 border rounded-md cursor-pointer
          ${disabled
                        ? 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 cursor-not-allowed'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-500 dark:focus-within:ring-blue-400'
                    }
          ${isOpen ? 'border-blue-500 dark:border-blue-400 ring-1 ring-blue-500 dark:ring-blue-400' : ''}
        `}
                onClick={handleInputClick}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleInputClick();
                    }
                }}
                tabIndex={0}
                role="button"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <div className="flex-1 min-w-0">
                    {display === 'chip' ? (
                        <div className="flex flex-wrap gap-1">
                            {value.map(v => {
                                const option = options.find(opt => opt.value === v);
                                if (!option) return null;
                                return (
                                    <span
                                        key={v}
                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full border border-blue-200 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                                    >
                                        {option.label}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeOption(v);
                                            }}
                                            className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 hover:bg-blue-300 dark:hover:bg-blue-700 rounded-full w-4 h-4 flex items-center justify-center transition-colors"
                                            title="Remove"
                                        >
                                            ×
                                        </button>
                                    </span>
                                );
                            })}
                            {value.length === 0 && (
                                <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
                            )}
                        </div>
                    ) : (
                        <span className={value.length === 0 ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}>
                            {getDisplayValue() || placeholder}
                        </span>
                    )}
                </div>

                {/* Dropdown arrow */}
                <svg
                    className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {/* Dropdown */}
            {isOpen && !disabled && (
                <div className="absolute z-[99999] md:z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg dark:shadow-gray-900/50 max-h-60 sm:max-h-80 overflow-auto ring-1 ring-black dark:ring-gray-600 ring-opacity-5">
                    {/* Search input */}
                    <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600 p-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchTerm}
                            onChange={handleInputChange}
                            placeholder="Search..."
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>

                    {/* Options list */}
                    <div className="py-1">
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">No options found</div>
                        ) : (
                            filteredOptions.map((option, index) => {
                                const isSelected = value.includes(option.value);
                                const isFocused = index === focusedIndex;

                                return (
                                    <div
                                        key={option.value}
                                        className={`
                      flex items-center px-3 py-3 sm:py-2 cursor-pointer text-sm touch-manipulation
                      ${isFocused ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}
                      ${isSelected ? 'bg-blue-100 dark:bg-blue-900/50' : ''}
                    `}
                                        onClick={() => toggleOption(option.value)}
                                        onMouseEnter={() => setFocusedIndex(index)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                toggleOption(option.value);
                                            }
                                        }}
                                        tabIndex={0}
                                        role="option"
                                        aria-selected={isSelected}
                                    >
                                        {/* Checkbox */}
                                        <div className={`
                      w-4 h-4 border rounded mr-3 flex items-center justify-center
                      ${isSelected
                                                ? 'bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500'
                                                : 'border-gray-300 dark:border-gray-500'
                                            }
                    `}>
                                            {isSelected && (
                                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>

                                        {/* Option label */}
                                        <span className={isSelected ? 'font-medium' : ''}>
                                            {option.label}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
