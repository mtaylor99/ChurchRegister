import React from 'react';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { Box, Typography, Paper, Chip, Tooltip } from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import type { RegisterNumberAssignment } from '../../services/registerNumberService';

export interface RegisterNumberPreviewGridProps {
  members: RegisterNumberAssignment[];
  nonBaptisedMembers: RegisterNumberAssignment[];
  nonMembers: RegisterNumberAssignment[];
  loading?: boolean;
}

const columns: GridColDef[] = [
  {
    field: 'memberName',
    headerName: 'Name',
    flex: 1,
    minWidth: 150,
    sortable: false,
  },
  {
    field: 'memberSince',
    headerName: 'Since',
    width: 100, // Restore to original width for dd/MM/yyyy
    sortable: false,
    renderCell: (params) => {
      if (!params.value) {
        return (
          <Tooltip title="Missing Member Since date - please update member record">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                color: 'error.main',
              }}
            >
              <WarningIcon fontSize="small" color="error" />
              <Typography variant="body2" color="error">
                Missing
              </Typography>
            </Box>
          </Tooltip>
        );
      }
      return new Date(params.value).toLocaleDateString('en-GB');
    },
  },
  {
    field: 'currentNumber',
    headerName: 'Current',
    width: 66, // 5% reduction from 70
    sortable: false,
    renderCell: (params) => params.value || '—',
  },
  {
    field: 'registerNumber',
    headerName: 'New',
    width: 57, // 5% reduction from 60
    sortable: false,
  },
];

function MiniGrid({
  title,
  color,
  rows,
  loading,
}: {
  title: string;
  color: 'primary' | 'secondary' | 'info';
  rows: RegisterNumberAssignment[];
  loading: boolean;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden', // Prevent double scrollbars
        maxWidth: '100%',
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold">
          {title}
        </Typography>
        <Chip label={rows.length} size="small" color={color} />
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.memberId}
          loading={loading}
          disableColumnMenu
          disableRowSelectionOnClick
          pageSizeOptions={[25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 100, page: 0 } },
          }}
          sx={{
            border: 0,
            maxWidth: '100%',
            overflowX: 'auto',
            '& .MuiDataGrid-cell:focus': { outline: 'none' },
            '& .MuiDataGrid-row:hover': { backgroundColor: 'action.hover' },
          }}
        />
      </Box>
    </Paper>
  );
}

export const RegisterNumberPreviewGrid: React.FC<
  RegisterNumberPreviewGridProps
> = ({ members, nonBaptisedMembers, nonMembers, loading = false }) => {
  return (
    <Box sx={{ display: 'flex', gap: 2, height: 500, width: '100%' }}>
      <MiniGrid
        title="Members (Baptised)"
        color="primary"
        rows={members}
        loading={loading}
      />
      <MiniGrid
        title="Members (Non-Baptised)"
        color="info"
        rows={nonBaptisedMembers}
        loading={loading}
      />
      <MiniGrid
        title="Non-Members"
        color="secondary"
        rows={nonMembers}
        loading={loading}
      />
    </Box>
  );
};
