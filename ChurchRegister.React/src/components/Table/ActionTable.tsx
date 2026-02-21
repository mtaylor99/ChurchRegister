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
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';
import { useState } from 'react';
import type { SxProps, Theme } from '@mui/material/styles';
import type { Column } from './DataTable';

export interface ActionMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  color?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'error'
    | 'warning'
    | 'info'
    | 'success';
  disabled?: boolean;
  divider?: boolean;
}

export interface ActionTableProps<T = Record<string, unknown>> {
  /** Table columns (excluding actions column) */
  columns: Column<T>[];
  /** Table data */
  data: T[];
  /** Action menu items */
  actions?: ActionMenuItem[];
  /** Action handler */
  onAction?: (actionId: string, row: T, index: number) => void;
  /** Table title */
  title?: string;
  /** Dense table */
  dense?: boolean;
  /** Custom styling */
  sx?: SxProps<Theme>;
  /** Empty state message */
  emptyMessage?: string;
  /** Row click handler (excluding action column) */
  onRowClick?: (row: T, index: number) => void;
  /** Custom row key function */
  getRowId?: (row: T, index: number) => string | number;
}

const ActionTable = forwardRef<HTMLDivElement, ActionTableProps>(
  (
    {
      columns,
      data,
      actions = [],
      onAction,
      title,
      dense = false,
      sx,
      emptyMessage = 'No data available',
      onRowClick,
      getRowId = (_row, index) => index,
    },
    ref
  ) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedRowIndex, setSelectedRowIndex] = useState<number>(-1);

    const handleActionClick = (
      event: React.MouseEvent<HTMLElement>,
      rowIndex: number
    ) => {
      event.stopPropagation();
      setAnchorEl(event.currentTarget);
      setSelectedRowIndex(rowIndex);
    };

    const handleActionClose = () => {
      setAnchorEl(null);
      setSelectedRowIndex(-1);
    };

    const handleActionSelect = (actionId: string) => {
      if (onAction && selectedRowIndex >= 0) {
        onAction(actionId, data[selectedRowIndex], selectedRowIndex);
      }
      handleActionClose();
    };

    const hasActions = actions.length > 0;

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
          <Table size={dense ? 'small' : 'medium'}>
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
                    sx={{ fontWeight: 600 }}
                  >
                    {column.label}
                  </TableCell>
                ))}
                {hasActions && (
                  <TableCell align="center" sx={{ width: 60, fontWeight: 600 }}>
                    Actions
                  </TableCell>
                )}
              </TableRow>
            </TableHead>

            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (hasActions ? 1 : 0)}
                    align="center"
                  >
                    <Box py={4}>
                      <Typography variant="body1" color="text.secondary">
                        {emptyMessage}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, index) => {
                  const rowId = getRowId(row, index);

                  return (
                    <TableRow
                      key={rowId}
                      hover
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

                      {hasActions && (
                        <TableCell align="center" sx={{ width: 60 }}>
                          <Tooltip title="More actions">
                            <IconButton
                              size="small"
                              onClick={(event) =>
                                handleActionClick(event, index)
                              }
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleActionClose}
          PaperProps={{
            sx: { minWidth: 150 },
          }}
        >
          {actions.map((action, index) => (
            <div key={action.id}>
              <MenuItem
                onClick={() => handleActionSelect(action.id)}
                disabled={action.disabled}
                sx={{
                  color:
                    action.color && action.color !== 'default'
                      ? `${action.color}.main`
                      : 'text.primary',
                }}
              >
                {action.icon && (
                  <ListItemIcon sx={{ color: 'inherit' }}>
                    {action.icon}
                  </ListItemIcon>
                )}
                <ListItemText>{action.label}</ListItemText>
              </MenuItem>
              {action.divider && index < actions.length - 1 && (
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mx: 1 }} />
              )}
            </div>
          ))}
        </Menu>
      </Paper>
    );
  }
);

ActionTable.displayName = 'ActionTable';

export default ActionTable;
