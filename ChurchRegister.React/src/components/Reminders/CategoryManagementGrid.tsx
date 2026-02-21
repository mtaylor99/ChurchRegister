import React, { useState, useMemo, useCallback } from 'react';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import {
  Box,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Typography,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import {
  useReminderCategories,
  useDeleteCategory,
} from '../../hooks/useReminderCategories';
import type { ReminderCategory } from '../../types/reminderCategories';

export interface CategoryManagementGridProps {
  onEdit: (category: ReminderCategory) => void;
}

export const CategoryManagementGrid: React.FC<
  CategoryManagementGridProps
> = React.memo(({ onEdit }) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] =
    useState<ReminderCategory | null>(null);

  // Fetch categories
  const { data: categories = [], isLoading, error } = useReminderCategories();

  // Delete mutation
  const deleteMutation = useDeleteCategory();

  const handleDeleteClick = useCallback((category: ReminderCategory) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setCategoryToDelete(null);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (categoryToDelete) {
      deleteMutation.mutate(categoryToDelete.id, {
        onSuccess: () => {
          handleDeleteCancel();
        },
      });
    }
  }, [categoryToDelete, deleteMutation, handleDeleteCancel]);

  // Column definitions
  const columns: GridColDef<ReminderCategory>[] = useMemo(
    () => [
      {
        field: 'name',
        headerName: 'Name',
        flex: 1,
        minWidth: 200,
        renderCell: (params) => (
          <Box>
            {params.value}
            {params.row.isSystemCategory && (
              <Chip
                label="System"
                size="small"
                color="default"
                sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
              />
            )}
          </Box>
        ),
      },
      {
        field: 'colorHex',
        headerName: 'Color',
        width: 120,
        renderCell: (params) => (
          <Chip
            label="    "
            size="small"
            sx={{
              backgroundColor: params.value || '#9e9e9e',
              color: 'white',
              minWidth: 50,
            }}
          />
        ),
      },
      {
        field: 'reminderCount',
        headerName: 'Reminders',
        width: 120,
        type: 'number',
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Actions',
        width: 80,
        getActions: (params) => {
          const canDelete =
            !params.row.isSystemCategory && params.row.reminderCount === 0;
          const deleteTooltip = params.row.isSystemCategory
            ? 'System categories cannot be deleted'
            : params.row.reminderCount > 0
            ? `Category has ${params.row.reminderCount} associated reminder(s)`
            : 'Delete category';

          const actions = [
            <GridActionsCellItem
              key="edit"
              icon={<EditIcon />}
              label="Edit"
              onClick={() => onEdit(params.row)}
              showInMenu
            />,
          ];

          if (canDelete) {
            actions.push(
              <GridActionsCellItem
                key="delete"
                icon={<DeleteIcon />}
                label="Delete"
                onClick={() => handleDeleteClick(params.row)}
                showInMenu
              />
            );
          } else {
            actions.push(
              <Tooltip title={deleteTooltip} key="delete">
                <span>
                  <GridActionsCellItem
                    icon={<DeleteIcon />}
                    label="Delete"
                    onClick={() => {}}
                    disabled
                    showInMenu
                  />
                </span>
              </Tooltip>
            );
          }

          return actions;
        },
      },
    ],
    [onEdit, handleDeleteClick]
  );

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load categories. Please try again later.
      </Alert>
    );
  }

  return (
    <>
      <Box sx={{ height: 500, width: '100%' }}>
        <DataGrid
          rows={categories}
          columns={columns}
          disableRowSelectionOnClick
          disableColumnFilter
          disableColumnMenu
          initialState={{
            sorting: {
              sortModel: [{ field: 'name', sort: 'asc' }],
            },
          }}
          slots={{
            noRowsOverlay: () => (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No categories found
                </Typography>
              </Box>
            ),
          }}
        />
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Category</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete category "
            {categoryToDelete?.name}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});

CategoryManagementGrid.displayName = 'CategoryManagementGrid';
