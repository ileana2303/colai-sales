export type AreaSelectMenuContentProps = {
  areas: string[];
  error?: unknown;
  isError?: boolean;
  isLoading?: boolean;
  isOpen: boolean;
  onRetry?: () => void;
  onSearchQueryChange: (value: string) => void;
  onSelect: (area: string) => void;
  pendingArea?: string | null;
  searchQuery: string;
  selectedArea: string;
};
