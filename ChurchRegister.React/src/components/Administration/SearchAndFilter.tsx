import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  InputAdornment,
  Chip,
  Stack,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { UserAccountStatus } from '../../types/administration';
import type { SystemRoleDto, UserGridQuery } from '../../types/administration';

export interface SearchAndFilterProps {
  onSearch: (query: UserGridQuery) => void;
  availableRoles: SystemRoleDto[];
  loading?: boolean;
  initialQuery?: Partial<UserGridQuery>;
}

interface FilterState {
  searchTerm: string;
  statusFilter?: UserAccountStatus;
  roleFilter?: string;
}

// Debounce hook for search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  onSearch,
  availableRoles,
  loading = false,
  initialQuery,
}) => {
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: initialQuery?.searchTerm || '',
    statusFilter: initialQuery?.statusFilter,
    roleFilter: initialQuery?.roleFilter,
  });

  const debouncedSearchTerm = useDebounce(filters.searchTerm, 500);

  // Trigger search when debounced search term or filters change
  useEffect(() => {
    const query: UserGridQuery = {
      page: 1, // Reset to first page on new search
      pageSize: initialQuery?.pageSize || 20,
      searchTerm: debouncedSearchTerm || undefined,
      statusFilter: filters.statusFilter,
      roleFilter: filters.roleFilter,
      sortBy: initialQuery?.sortBy || 'firstName',
      sortDirection: initialQuery?.sortDirection || 'asc',
    };

    onSearch(query);
  }, [
    debouncedSearchTerm,
    filters.statusFilter,
    filters.roleFilter,
    onSearch,
    initialQuery?.pageSize,
    initialQuery?.sortBy,
    initialQuery?.sortDirection,
  ]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({
      ...prev,
      searchTerm: event.target.value,
    }));
  };

  const handleStatusChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setFilters((prev) => ({
      ...prev,
      statusFilter: value ? (Number(value) as UserAccountStatus) : undefined,
    }));
  };

  const handleRoleChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setFilters((prev) => ({
      ...prev,
      roleFilter: value || undefined,
    }));
  };

  const clearSearch = () => {
    setFilters((prev) => ({
      ...prev,
      searchTerm: '',
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      searchTerm: '',
      statusFilter: undefined,
      roleFilter: undefined,
    });
  };

  const hasActiveFilters = filters.statusFilter || filters.roleFilter;
  const hasAnyFilters = hasActiveFilters || filters.searchTerm;

  const getStatusLabel = (status: UserAccountStatus): string => {
    switch (status) {
      case UserAccountStatus.Invited:
        return 'Invited';
      case UserAccountStatus.Pending:
        return 'Pending';
      case UserAccountStatus.Active:
        return 'Active';
      case UserAccountStatus.Locked:
        return 'Locked';
      case UserAccountStatus.Inactive:
        return 'Inactive';
      default:
        return 'Unknown';
    }
  };

  return (
    <Box sx={{ mb: 1.5 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 1 }}>
        {/* Search Input */}
        <TextField
          fullWidth
          placeholder="Search by name or email..."
          value={filters.searchTerm}
          onChange={handleSearchChange}
          disabled={loading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: filters.searchTerm && (
              <InputAdornment position="end">
                <IconButton
                  aria-label="clear search"
                  onClick={clearSearch}
                  edge="end"
                  size="small"
                  disabled={loading}
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: { md: 300 } }}
        />

        {/* Status Filter */}
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={
              filters.statusFilter !== undefined
                ? String(filters.statusFilter)
                : ''
            }
            onChange={handleStatusChange}
            label="Status"
            disabled={loading}
          >
            <MenuItem value="">
              <em>All</em>
            </MenuItem>
            {Object.values(UserAccountStatus).map((status) => (
              <MenuItem key={status} value={status}>
                {getStatusLabel(status)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Role Filter */}
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Role</InputLabel>
          <Select
            value={filters.roleFilter || ''}
            onChange={handleRoleChange}
            label="Role"
            disabled={loading}
          >
            <MenuItem value="">
              <em>All</em>
            </MenuItem>
            {availableRoles.map((role) => (
              <MenuItem key={role.id} value={role.name}>
                {role.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Clear All Button */}
        {hasAnyFilters && (
          <Button
            variant="outlined"
            onClick={clearAllFilters}
            disabled={loading}
            startIcon={<ClearIcon />}
            sx={{ minWidth: 'fit-content', whiteSpace: 'nowrap' }}
          >
            Clear All
          </Button>
        )}
      </Stack>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <FilterIcon color="action" sx={{ fontSize: 20 }} />
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            {filters.statusFilter && (
              <Chip
                label={`Status: ${getStatusLabel(filters.statusFilter)}`}
                onDelete={() =>
                  handleStatusChange({
                    target: { value: '' },
                  } as SelectChangeEvent<string>)
                }
                size="small"
                variant="outlined"
              />
            )}
            {filters.roleFilter && (
              <Chip
                label={`Role: ${filters.roleFilter}`}
                onDelete={() =>
                  handleRoleChange({
                    target: { value: '' },
                  } as SelectChangeEvent<string>)
                }
                size="small"
                variant="outlined"
              />
            )}
          </Stack>
        </Box>
      )}
    </Box>
  );
};
