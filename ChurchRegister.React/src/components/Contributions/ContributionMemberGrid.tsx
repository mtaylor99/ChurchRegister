import React, { useState, useCallback, useMemo } from 'react';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import type {
  GridColDef,
  GridPaginationModel,
  GridSortModel,
} from '@mui/x-data-grid';
import {
  Box,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Alert,
  Button,
  Stack,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { contributionsApi } from '../../services/api/contributionsApi';
import type {
  ContributionMemberDto,
  ContributionMemberGridProps,
  ContributionGridQuery,
} from '../../types/contributions';
import type { AddressDto } from '../../types/churchMembers';

/**
 * Contribution Member Grid Component
 * Displays church members with contribution-focused columns:
 * - Name, Member Number, This Year's Contribution
 */
export const ContributionMemberGrid: React.FC<ContributionMemberGridProps> =
  React.memo(({ onViewContributions, initialQuery }) => {
    // Grid state
    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>(
      {
        page: initialQuery?.page ? initialQuery.page - 1 : 0,
        pageSize: initialQuery?.pageSize || 20,
      }
    );

    const [sortModel, setSortModel] = useState<GridSortModel>([
      {
        field: initialQuery?.sortBy || 'thisYearsContribution',
        sort: (initialQuery?.sortDirection || 'desc') as 'asc' | 'desc',
      },
    ]);

    const [searchTerm, setSearchTerm] = useState(
      initialQuery?.searchTerm || ''
    );
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

    // Year filter state
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(
      initialQuery?.year || currentYear
    );

    // Generate array of last 5 years including current year
    const years = useMemo(
      () => Array.from({ length: 5 }, (_, i) => currentYear - i),
      [currentYear]
    );

    // Action menu state
    const [actionMenuAnchorEl, setActionMenuAnchorEl] =
      useState<null | HTMLElement>(null);
    const [selectedMember, setSelectedMember] =
      useState<ContributionMemberDto | null>(null);

    // Debounce search term
    React.useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedSearchTerm(searchTerm);
      }, 300);

      return () => clearTimeout(timer);
    }, [searchTerm]);

    // Build query
    const searchQuery: ContributionGridQuery = useMemo(
      () => ({
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
        searchTerm: debouncedSearchTerm,
        sortBy: sortModel[0]?.field || 'thisYearsContribution',
        sortDirection: sortModel[0]?.sort || 'desc',
        year: selectedYear,
      }),
      [
        paginationModel.page,
        paginationModel.pageSize,
        debouncedSearchTerm,
        sortModel,
        selectedYear,
      ]
    );

    // Fetch contribution members
    const {
      data: membersData,
      isLoading,
      error,
    } = useQuery({
      queryKey: ['contribution-members', searchQuery],
      queryFn: () => contributionsApi.getContributionMembers(searchQuery),
      placeholderData: (previousData) => previousData,
    });

    // Event handlers
    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(event.target.value);
      setPaginationModel((prev) => ({ ...prev, page: 0 })); // Reset to first page
    };

    const handleClearAllFilters = useCallback(() => {
      setSearchTerm('');
      setDebouncedSearchTerm('');
      setSelectedYear(currentYear);
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }, [currentYear]);

    // Check if there are active filters
    const hasActiveFilters = useMemo(
      () => debouncedSearchTerm !== '' || selectedYear !== currentYear,
      [debouncedSearchTerm, selectedYear, currentYear]
    );

    const handlePaginationModelChange = useCallback(
      (model: GridPaginationModel) => {
        setPaginationModel(model);
      },
      []
    );

    const handleSortModelChange = useCallback((model: GridSortModel) => {
      setSortModel(model);
    }, []);

    const handleActionMenuOpen = useCallback(
      (event: React.MouseEvent<HTMLElement>, member: ContributionMemberDto) => {
        event.stopPropagation();
        setActionMenuAnchorEl(event.currentTarget);
        setSelectedMember(member);
      },
      []
    );

    const handleActionMenuClose = useCallback(() => {
      setActionMenuAnchorEl(null);
      setSelectedMember(null);
    }, []);

    const handleViewContributions = useCallback(() => {
      if (selectedMember) {
        onViewContributions(selectedMember);
      }
      handleActionMenuClose();
    }, [selectedMember, onViewContributions, handleActionMenuClose]);

    // Format currency
    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    // Format address
    const formatAddress = (address?: AddressDto): string => {
      if (!address) return '';
      const parts = [
        address.nameNumber,
        address.addressLineOne,
        address.addressLineTwo,
        address.town,
        address.county,
        address.postcode,
      ].filter((part) => part && part.trim() !== '');
      return parts.join(', ');
    };

    // Define columns
    const columns: GridColDef<ContributionMemberDto>[] = useMemo(
      () => [
        {
          field: 'fullName',
          headerName: 'Name',
          flex: 2,
          minWidth: 180,
          sortable: true,
          valueGetter: (_value, row) =>
            row.fullName || `${row.firstName} ${row.lastName}`,
        },
        {
          field: 'address',
          headerName: 'Address',
          flex: 3,
          minWidth: 220,
          sortable: false,
          valueGetter: (_value, row) => formatAddress(row.address),
        },
        {
          field: 'envelopeNumber',
          headerName: 'Number',
          flex: 1,
          minWidth: 100,
          sortable: true,
          valueFormatter: (value) => value || 'N/A',
        },
        {
          field: 'bankReference',
          headerName: 'Bank Reference',
          flex: 1.5,
          minWidth: 140,
          sortable: true,
          valueFormatter: (value) => value || '',
        },
        {
          field: 'thisYearsContribution',
          headerName: `${selectedYear} Contribution`,
          flex: 1.5,
          minWidth: 150,
          sortable: true,
          valueFormatter: (value) => formatCurrency(value),
        },
        {
          field: 'lastContributionDate',
          headerName: 'Last Contribution',
          flex: 1.5,
          minWidth: 140,
          sortable: true,
          valueFormatter: (value: string) => {
            if (!value) return '';
            return new Date(value).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            });
          },
        },
        {
          field: 'giftAid',
          headerName: 'Gift Aid',
          flex: 1,
          minWidth: 90,
          sortable: true,
          valueFormatter: (value: boolean) => (value ? 'Yes' : 'No'),
        },
        {
          field: 'actions',
          type: 'actions',
          headerName: 'Actions',
          width: 80,
          getActions: (params) => [
            <GridActionsCellItem
              key="menu"
              icon={<MoreIcon />}
              label="Actions"
              onClick={(event: React.MouseEvent<HTMLButtonElement>) =>
                handleActionMenuOpen(event, params.row)
              }
            />,
          ],
        },
      ],
      [handleActionMenuOpen, selectedYear]
    );

    // Render loading state
    if (isLoading && !membersData) {
      return (
        <Box sx={{ width: '100%', mt: 2 }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
            Loading contribution data...
          </Typography>
        </Box>
      );
    }

    // Render error state
    if (error) {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          Error loading contribution data. Please try again.
        </Alert>
      );
    }

    return (
      <Box sx={{ width: '100%' }}>
        {/* Filters */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <TextField
            label="Search by name or member number"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ minWidth: 300, flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
              ),
            }}
          />

          {/* Year Filter */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="year-filter-label">Year</InputLabel>
            <Select
              labelId="year-filter-label"
              id="year-filter"
              value={selectedYear}
              label="Year"
              onChange={(e) => setSelectedYear(e.target.value as number)}
            >
              {years.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Clear All Button */}
          {hasActiveFilters && (
            <Button
              variant="outlined"
              onClick={handleClearAllFilters}
              startIcon={<ClearIcon />}
              sx={{ minWidth: 'fit-content', whiteSpace: 'nowrap' }}
            >
              Clear All
            </Button>
          )}
        </Stack>

        {/* Render empty state */}
        {(!membersData || membersData.items.length === 0) && !isLoading ? (
          <Paper sx={{ p: 4, mt: 2, textAlign: 'center' }}>
            <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No members found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search or filters
            </Typography>
          </Paper>
        ) : (
          /* DataGrid */
          <Paper>
            <DataGrid
              rows={membersData?.items || []}
              columns={columns}
              pageSizeOptions={[10, 20, 50, 100]}
              paginationModel={paginationModel}
              onPaginationModelChange={handlePaginationModelChange}
              sortModel={sortModel}
              onSortModelChange={handleSortModelChange}
              rowCount={membersData?.totalCount || 0}
              paginationMode="server"
              sortingMode="server"
              loading={isLoading}
              disableRowSelectionOnClick
              disableColumnMenu
              autoHeight
              sx={{
                '& .MuiDataGrid-cell:focus': {
                  outline: 'none',
                },
                '& .MuiDataGrid-row:hover': {
                  cursor: 'pointer',
                },
              }}
            />
          </Paper>
        )}

        {/* Action Menu */}
        <Menu
          anchorEl={actionMenuAnchorEl}
          open={Boolean(actionMenuAnchorEl)}
          onClose={handleActionMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={handleViewContributions}>
            <ListItemIcon>
              <ViewIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Contributions</ListItemText>
          </MenuItem>
        </Menu>
      </Box>
    );
  });

export default ContributionMemberGrid;
