import { forwardRef } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
} from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

export interface SimpleColumn {
  id: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  minWidth?: number;
  maxWidth?: number;
}

export interface SimpleTableProps {
  /** Table columns */
  columns: SimpleColumn[];
  /** Table data */
  rows: Record<string, React.ReactNode>[];
  /** Table title */
  title?: string;
  /** Dense table */
  dense?: boolean;
  /** Sticky header */
  stickyHeader?: boolean;
  /** Custom styling */
  sx?: SxProps<Theme>;
  /** Custom row styling */
  rowSx?: SxProps<Theme>;
  /** Custom header styling */
  headerSx?: SxProps<Theme>;
  /** Empty state message */
  emptyMessage?: string;
  /** Row hover effect */
  hover?: boolean;
  /** Row click handler */
  onRowClick?: (row: Record<string, React.ReactNode>, index: number) => void;
}

const SimpleTable = forwardRef<HTMLDivElement, SimpleTableProps>(
  (
    {
      columns,
      rows,
      title,
      dense = false,
      stickyHeader = false,
      sx,
      rowSx,
      headerSx,
      emptyMessage = 'No data available',
      hover = false,
      onRowClick,
    },
    ref
  ) => {
    return (
      <Paper ref={ref} sx={{ width: '100%', overflow: 'hidden', ...sx }}>
        {title && (
          <Box p={2} borderBottom={1} borderColor="divider">
            <Typography variant="h6" component="h2">
              {title}
            </Typography>
          </Box>
        )}

        <TableContainer>
          <Table stickyHeader={stickyHeader} size={dense ? 'small' : 'medium'}>
            <TableHead>
              <TableRow sx={headerSx}>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align || 'left'}
                    style={{
                      minWidth: column.minWidth,
                      maxWidth: column.maxWidth,
                    }}
                    sx={{ fontWeight: 600 }}
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.length === 0 ? (
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
                rows.map((row, index) => (
                  <TableRow
                    key={index}
                    hover={hover}
                    onClick={
                      onRowClick ? () => onRowClick(row, index) : undefined
                    }
                    sx={{
                      cursor: onRowClick ? 'pointer' : 'default',
                      '&:nth-of-type(odd)': {
                        backgroundColor: 'action.hover',
                      },
                      ...rowSx,
                    }}
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={column.id}
                        align={column.align || 'left'}
                        style={{
                          minWidth: column.minWidth,
                          maxWidth: column.maxWidth,
                        }}
                      >
                        {row[column.id]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  }
);

SimpleTable.displayName = 'SimpleTable';

export default SimpleTable;
