import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Box,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Skeleton,
  Alert,
} from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
import { visuallyHidden } from '@mui/utils';
import type { SxProps, Theme } from '@mui/material/styles';

export interface Column<T = Record<string, unknown>> {
  id: keyof T;
  label: string;
  minWidth?: number;
  maxWidth?: number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  format?: (value: T[keyof T], row: T) => React.ReactNode;
  renderCell?: (value: T[keyof T], row: T) => React.ReactNode;
}

export interface DataTableProps<T = Record<string, unknown>> {
  /** Table data */
  data: T[];
  /** Column definitions */
  columns: Column<T>[];
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string;
  /** Enable search functionality */
  searchable?: boolean;
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Enable pagination */
  paginated?: boolean;
  /** Rows per page options */
  rowsPerPageOptions?: number[];
  /** Default rows per page */
  defaultRowsPerPage?: number;
  /** Enable sorting */
  sortable?: boolean;
  /** Default sort column */
  defaultSortBy?: keyof T;
  /** Default sort direction */
  defaultSortDirection?: 'asc' | 'desc';
  /** Enable row selection */
  selectable?: boolean;
  /** Selected rows */
  selectedRows?: T[];
  /** Row selection callback */
  onRowSelect?: (rows: T[]) => void;
  /** Row click handler */
  onRowClick?: (row: T, index: number) => void;
  /** Custom row key function */
  getRowId?: (row: T, index: number) => string | number;
  /** Dense table */
  dense?: boolean;
  /** Custom styling */
  sx?: SxProps<Theme>;
  /** Table title */
  title?: string;
  /** Custom empty state */
  emptyMessage?: string;
}

type Order = 'asc' | 'desc';

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  const aVal = a[orderBy];
  const bVal = b[orderBy];

  if (bVal < aVal) {
    return -1;
  }
  if (bVal > aVal) {
    return 1;
  }
  return 0;
}

function getComparator<T>(order: Order, orderBy: keyof T) {
  return order === 'desc'
    ? (a: T, b: T) => descendingComparator(a, b, orderBy)
    : (a: T, b: T) => -descendingComparator(a, b, orderBy);
}

function DataTable<T = Record<string, unknown>>({
  data,
  columns,
  loading = false,
  error,
  searchable = true,
  searchPlaceholder = 'Search...',
  paginated = true,
  rowsPerPageOptions = [5, 10, 25, 50],
  defaultRowsPerPage = 10,
  sortable = true,
  defaultSortBy,
  defaultSortDirection = 'asc',
  onRowClick,
  getRowId = (_row, index) => index,
  dense = false,
  sx,
  title,
  emptyMessage = 'No data available',
}: DataTableProps<T>) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [order, setOrder] = useState<Order>(defaultSortDirection);
  const [orderBy, setOrderBy] = useState<keyof T>(
    defaultSortBy || columns[0]?.id
  );
  const [searchTerm, setSearchTerm] = useState('');

  const handleRequestSort = (property: keyof T) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setPage(0);
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;

    return data.filter((row) =>
      columns.some((column) => {
        if (!column.filterable && column.filterable !== undefined) return false;

        const value = row[column.id];
        if (value == null) return false;

        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [data, searchTerm, columns]);

  const sortedData = useMemo(() => {
    if (!sortable) return filteredData;

    return [...filteredData].sort(getComparator(order, orderBy));
  }, [filteredData, order, orderBy, sortable]);

  const paginatedData = useMemo(() => {
    if (!paginated) return sortedData;

    return sortedData.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [sortedData, page, rowsPerPage, paginated]);

  const createSortHandler = (property: keyof T) => () => {
    handleRequestSort(property);
  };

  if (error) {
    return (
      <Paper sx={sx}>
        <Box p={2}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', ...sx }}>
      {/* Header */}
      {(title || searchable) && (
        <Box p={2} borderBottom={1} borderColor="divider">
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            gap={2}
          >
            {title && (
              <Typography variant="h6" component="h2">
                {title}
              </Typography>
            )}

            {searchable && (
              <TextField
                size="small"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={clearSearch}>
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: 200, maxWidth: 300 }}
              />
            )}
          </Box>

          {searchTerm && (
            <Box mt={1}>
              <Chip
                label={`Searching: "${searchTerm}" (${filteredData.length} results)`}
                size="small"
                onDelete={clearSearch}
                color="primary"
                variant="outlined"
              />
            </Box>
          )}
        </Box>
      )}

      {/* Table */}
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader size={dense ? 'small' : 'medium'}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={String(column.id)}
                  align={column.align || 'left'}
                  style={{
                    minWidth: column.minWidth,
                    maxWidth: column.maxWidth,
                  }}
                  sortDirection={
                    sortable && orderBy === column.id ? order : false
                  }
                >
                  {sortable && column.sortable !== false ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={createSortHandler(column.id)}
                    >
                      {column.label}
                      {orderBy === column.id ? (
                        <Box component="span" sx={visuallyHidden}>
                          {order === 'desc'
                            ? 'sorted descending'
                            : 'sorted ascending'}
                        </Box>
                      ) : null}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              // Loading skeleton
              Array.from({ length: rowsPerPage }).map((_, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={String(column.id)}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginatedData.length === 0 ? (
              // Empty state
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  <Box py={4}>
                    <Typography variant="body1" color="text.secondary">
                      {emptyMessage}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              // Data rows
              paginatedData.map((row, index) => {
                const rowId = getRowId(row, index);

                return (
                  <TableRow
                    hover
                    key={rowId}
                    onClick={
                      onRowClick ? () => onRowClick(row, index) : undefined
                    }
                    sx={{
                      cursor: onRowClick ? 'pointer' : 'default',
                      '&:nth-of-type(odd)': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    {columns.map((column) => {
                      const value = row[column.id];
                      const displayValue = column.format
                        ? column.format(value, row)
                        : column.renderCell
                          ? column.renderCell(value, row)
                          : value;

                      return (
                        <TableCell
                          key={String(column.id)}
                          align={column.align || 'left'}
                          style={{
                            minWidth: column.minWidth,
                            maxWidth: column.maxWidth,
                          }}
                        >
                          {displayValue as React.ReactNode}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {paginated && !loading && (
        <TablePagination
          rowsPerPageOptions={rowsPerPageOptions}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}
    </Paper>
  );
}

export default DataTable;
