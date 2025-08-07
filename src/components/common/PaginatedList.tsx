import React, { useMemo, useState } from 'react';
import { Pagination } from './Pagination';

interface PaginatedListProps<T> {
    items: T[];
    itemsPerPage?: number;
    renderItem: (item: T, index: number) => React.ReactNode;
    emptyMessage?: string;
    className?: string;
}

export const PaginatedList = <T,>({
    items,
    itemsPerPage = 10,
    renderItem,
    emptyMessage = 'No items found.',
    className = ''
}: PaginatedListProps<T>) => {
    const [currentPage, setCurrentPage] = useState(1);

    const paginatedItems = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return items.slice(startIndex, endIndex);
    }, [items, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(items.length / itemsPerPage);

    // Reset to first page when items change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [items.length]);

    if (items.length === 0) {
        return (
            <div className={`text-center py-8 ${className}`}>
                <p className="text-gray-500">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className={className}>
            <div className="space-y-4">
                {paginatedItems.map((item, index) => renderItem(item, index))}
            </div>

            {totalPages > 1 && (
                <div className="mt-6">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}
        </div>
    );
};
