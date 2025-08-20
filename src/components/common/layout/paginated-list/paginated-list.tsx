import { useMemo } from 'react';
import { usePagination } from '../../../../hooks/use-pagination';
import { Pagination } from '../pagination/pagination';
import { PaginatedListProps } from './paginated-list.types';


export const PaginatedList = <T,>({
    items,
    itemsPerPage = 10,
    renderItem,
    emptyMessage = 'No items found.',
    className = ''
}: PaginatedListProps<T>) => {
    const { currentPage, totalPages, goToPage } = usePagination({
        totalItems: items.length,
        itemsPerPage
    });

    const paginatedItems = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return items.slice(startIndex, endIndex);
    }, [items, currentPage, itemsPerPage]);

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
                        onPageChange={goToPage}
                    />
                </div>
            )}
        </div>
    );
};
