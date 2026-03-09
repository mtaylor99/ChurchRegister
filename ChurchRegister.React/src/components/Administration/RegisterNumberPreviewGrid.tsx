import React from 'react';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { Box, Typography, Paper, Chip } from '@mui/material';
import type { RegisterNumberAssignment } from '../../services/registerNumberService';

export interface RegisterNumberPreviewGridProps {
  members: RegisterNumberAssignment[];
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
    width: 100,
    sortable: false,
    valueFormatter: (value) => {
      if (!value) return '—';
      return new Date(value).toLocaleDateString('en-GB');
    },
  },
  {
    field: 'currentNumber',
    headerName: 'Current',
    width: 90,
    sortable: false,
    renderCell: (params) => params.value || '—',
  },
  {
    field: 'registerNumber',
    headerName: 'New',
    width: 80,
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
  color: 'primary' | 'secondary';
  rows: RegisterNumberAssignment[];
  loading: boolean;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}
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
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.memberId}
          loading={loading}
          disableColumnMenu
          disableRowSelectionOnClick
          pageSizeOptions={[25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25, page: 0 } },
          }}
          sx={{
            border: 0,
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
> = ({ members, nonMembers, loading = false }) => {
  return (
    <Box sx={{ display: 'flex', gap: 2, height: 500, width: '100%' }}>
      <MiniGrid
        title="Members"
        color="primary"
        rows={members}
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
