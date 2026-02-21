import React from 'react';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { Box, Typography, Paper } from '@mui/material';
import type { RegisterNumberAssignment } from '../../services/registerNumberService';

export interface RegisterNumberPreviewGridProps {
  assignments: RegisterNumberAssignment[];
  year: number;
  currentYear: number;
  loading?: boolean;
}

export const RegisterNumberPreviewGrid: React.FC<
  RegisterNumberPreviewGridProps
> = ({
  assignments,
  year: _year,
  currentYear: _currentYear,
  loading = false,
}) => {
  const columns: GridColDef[] = [
    {
      field: 'memberName',
      headerName: 'Member Name',
      width: 200,
      sortable: false,
    },
    {
      field: 'currentNumber',
      headerName: 'Current Number',
      width: 150,
      sortable: false,
      renderCell: (params) => params.value || '—',
    },
    {
      field: 'registerNumber',
      headerName: 'New Number',
      width: 180,
      sortable: false,
    },
    {
      field: 'memberSince',
      headerName: 'Member Since',
      width: 150,
      sortable: false,
      valueFormatter: (value) => {
        if (!value) return '—';
        return new Date(value).toLocaleDateString('en-GB');
      },
    },
  ];

  return (
    <Paper elevation={0} sx={{ width: '100%', height: 500 }}>
      <Box sx={{ mb: 2, p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" component="div">
          Preview: {assignments.length} Active Members
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Members are sorted by Member Since date (oldest first), then by
          surname
        </Typography>
      </Box>

      <DataGrid
        rows={assignments}
        columns={columns}
        getRowId={(row) => row.memberId}
        loading={loading}
        disableColumnMenu
        disableRowSelectionOnClick
        pageSizeOptions={[25, 50, 100]}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 25, page: 0 },
          },
        }}
        sx={{
          border: 0,
          '& .MuiDataGrid-cell:focus': {
            outline: 'none',
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      />
    </Paper>
  );
};
