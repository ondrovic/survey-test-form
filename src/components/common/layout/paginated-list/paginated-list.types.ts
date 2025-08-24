export interface PaginatedListProps<T> {
    items: T[];
    itemsPerPage?: number;
    renderItem: (item: T, index: number) => React.ReactNode;
    emptyMessage?: string;
    className?: string;
    searchable?: boolean;
    searchPlaceholder?: string;
    searchFields?: (keyof T)[];
    onSearch?: (query: string) => void;
}