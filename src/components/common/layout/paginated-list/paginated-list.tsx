import { useMemo, useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import { usePagination } from '../../../../hooks/use-pagination';
import { Pagination } from '../pagination/pagination';
import { Input } from '../../ui/input/input';
import { PaginatedListProps } from './paginated-list.types';
import { PAGINATION_DEFAULTS } from '../../../../constants/pagination.constants';


export const PaginatedList = <T,>({
    items,
    itemsPerPage = PAGINATION_DEFAULTS.ITEMS_PER_PAGE,
    renderItem,
    emptyMessage = 'No items found.',
    className = '',
    searchable = false,
    searchPlaceholder = 'Search...',
    searchFields = [],
    onSearch
}: PaginatedListProps<T>) => {
    const [searchQuery, setSearchQuery] = useState('');

    // Generic search function that works on any object type
    const matchesSearch = useCallback((item: T, query: string): boolean => {
        if (!query.trim()) return true;
        
        const lowerQuery = query.toLowerCase();
        
        // If specific search fields are provided, search only those fields
        if (searchFields.length > 0) {
            return searchFields.some(field => {
                const value = item[field];
                if (value == null) return false;
                return String(value).toLowerCase().includes(lowerQuery);
            });
        }
        
        // Otherwise, search all string-like fields in the object
        return Object.values(item as any).some(value => {
            if (value == null) return false;
            if (typeof value === 'object' && !Array.isArray(value)) return false;
            if (Array.isArray(value)) {
                // Search in array values (useful for options, tags, etc.)
                return value.some(arrayItem => 
                    String(arrayItem).toLowerCase().includes(lowerQuery)
                );
            }
            return String(value).toLowerCase().includes(lowerQuery);
        });
    }, [searchFields]);

    // Apply search
    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) {
            return items;
        }
        
        return items.filter(item => matchesSearch(item, searchQuery));
    }, [items, searchQuery, matchesSearch]);

    const { currentPage, totalPages, goToPage, resetToFirstPage } = usePagination({
        totalItems: filteredItems.length,
        itemsPerPage
    });

    // Reset to first page when search changes
    useMemo(() => {
        resetToFirstPage();
    }, [searchQuery, resetToFirstPage]);

    const clearSearch = useCallback(() => {
        setSearchQuery('');
        onSearch?.('');
    }, [onSearch]);

    const hasSearch = searchQuery.trim().length > 0;
    
    // Show search only when there are enough items to warrant pagination
    const originalTotalPages = Math.ceil(items.length / itemsPerPage);
    const shouldShowSearch = searchable && originalTotalPages > 1;

    const paginatedItems = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredItems.slice(startIndex, endIndex);
    }, [filteredItems, currentPage, itemsPerPage]);

    const handleSearchChange = useCallback((query: string) => {
        setSearchQuery(query);
        onSearch?.(query);
    }, [onSearch]);

    if (items.length === 0) {
        return (
            <div className={`text-center py-8 ${className}`}>
                <p className="text-gray-500">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className={className}>
            {/* Search Control */}
            {shouldShowSearch && (
                <div className="mb-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <Input
                            name="search"
                            type="text"
                            placeholder={searchPlaceholder}
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="pl-10"
                        />
                    </div>
                    
                    {/* Results Summary */}
                    {hasSearch && (
                        <div className="text-sm text-gray-600 mt-2">
                            Showing {filteredItems.length} of {items.length} items matching &quot;{searchQuery}&quot;
                        </div>
                    )}
                </div>
            )}

            {/* Items List */}
            {filteredItems.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500">
                        {hasSearch 
                            ? `No items match "${searchQuery}".` 
                            : emptyMessage
                        }
                    </p>
                    {hasSearch && (
                        <button
                            onClick={clearSearch}
                            className="mt-2 text-amber-600 hover:text-amber-800 text-sm underline"
                        >
                            Clear search
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {paginatedItems.map((item, index) => renderItem(item, index))}
                    </div>

                    {totalPages > 1 && (
                        <div className="mt-6">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={goToPage}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
