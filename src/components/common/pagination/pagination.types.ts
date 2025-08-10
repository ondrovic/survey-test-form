export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    totalPages: number;
}

export interface UsePaginationReturn {
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    goToPage: (page: number) => void;
    nextPage: () => void;
    prevPage: () => void;
    goToFirstPage: () => void;
    goToLastPage: () => void;
}
