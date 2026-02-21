import { useState, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import {
  Box,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  Menu,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Stack,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Close as CloseIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import type {
  RiskAssessmentCategory,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../../types/riskAssessments';
import {
  useRiskAssessmentCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../../hooks/useRiskAssessments';
import { useForm, Controller } from 'react-hook-form';

interface CategoryFormData {
  name: string;
  description: string;
}

export interface CategoryManagementGridRef {
  addCategory: () => void;
}

export const CategoryManagementGrid = forwardRef<CategoryManagementGridRef>((_props, ref) => {
  // Action menu state
  const [actionMenuAnchorEl, setActionMenuAnchorEl] =
    useState<null | HTMLElement>(null);
  const [selectedCategoryForMenu, setSelectedCategoryForMenu] =
    useState<RiskAssessmentCategory | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [selectedCategory, setSelectedCategory] =
    useState<RiskAssessmentCategory | null>(null);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] =
    useState<RiskAssessmentCategory | null>(null);

  // Fetch categories
  const {
    data: categories = [],
    isLoading,
    error,
    refetch,
  } = useRiskAssessmentCategories();

  // Mutations
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  // Form
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // Handlers
  const handleAddCategory = () => {
    reset({ name: '', description: '' });
    setSelectedCategory(null);
    setDialogMode('add');
    setDialogOpen(true);
  };

  // Expose the add category method to parent via ref
  useImperativeHandle(ref, () => ({
    addCategory: handleAddCategory,
  }));

  const handleEditCategory = (category: RiskAssessmentCategory) => {
    reset({
      name: category.name,
      description: category.description,
    });
    setSelectedCategory(category);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedCategory(null);
    reset({ name: '', description: '' });
  };

  const handleFormSubmit = async (data: CategoryFormData) => {
    if (dialogMode === 'add') {
      await createMutation.mutateAsync({
        name: data.name,
        description: data.description,
      } as CreateCategoryRequest);
    } else if (selectedCategory) {
      await updateMutation.mutateAsync({
        id: selectedCategory.id,
        request: {
          name: data.name,
          description: data.description,
        } as UpdateCategoryRequest,
      });
    }
    handleDialogClose();
    refetch();
  };

  // Action menu handlers
  const handleActionMenuOpen = useCallback(
    (event: React.MouseEvent<HTMLElement>, category: RiskAssessmentCategory) => {
      setActionMenuAnchorEl(event.currentTarget);
      setSelectedCategoryForMenu(category);
    },
    []
  );

  const handleActionMenuClose = useCallback(() => {
    setActionMenuAnchorEl(null);
    setSelectedCategoryForMenu(null);
  }, []);

  const handleEditFromMenu = useCallback(
    (category: RiskAssessmentCategory) => {
      handleActionMenuClose();
      handleEditCategory(category);
    },
    [handleActionMenuClose]
  );

  const handleDeleteFromMenu = useCallback(
    (category: RiskAssessmentCategory) => {
      handleActionMenuClose();
      setCategoryToDelete(category);
      setDeleteDialogOpen(true);
    },
    [handleActionMenuClose]
  );

  const handleDeleteConfirm = async () => {
    if (categoryToDelete) {
      await deleteMutation.mutateAsync(categoryToDelete.id);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      refetch();
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setCategoryToDelete(null);
  };

  // Column definitions
  const columns: GridColDef<RiskAssessmentCategory>[] = useMemo(
    () => [
      {
        field: 'name',
        headerName: 'Category Name',
        flex: 1,
        minWidth: 200,
      },
      {
        field: 'description',
        headerName: 'Description',
        flex: 2,
        minWidth: 300,
        wrapText: true,
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Actions',
        width: 80,
        getActions: (params) => [
          <GridActionsCellItem
            key="more"
            icon={<MoreIcon />}
            label="More actions"
            onClick={(event) => handleActionMenuOpen(event, params.row)}
            showInMenu={false}
          />,
        ],
      },
    ],
    [handleActionMenuOpen]
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
    <Box sx={{ height: '100%', width: '100%' }}>
      {/* Grid */}
      <Paper sx={{ height: 600 }}>
        <DataGrid
          rows={categories}
          columns={columns}
          pageSizeOptions={[10, 20, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 20 } },
            sorting: {
              sortModel: [{ field: 'name', sort: 'asc' }],
            },
          }}
          disableRowSelectionOnClick
          getRowHeight={() => 'auto'}
          sx={{
            '& .MuiDataGrid-row': {
              cursor: 'pointer',
            },
            '& .MuiDataGrid-cell': {
              py: 1.5,
            },
          }}
        />
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchorEl}
        open={Boolean(actionMenuAnchorEl)}
        onClose={handleActionMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem
          onClick={() =>
            selectedCategoryForMenu &&
            handleEditFromMenu(selectedCategoryForMenu)
          }
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Category</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() =>
            selectedCategoryForMenu &&
            handleDeleteFromMenu(selectedCategoryForMenu)
          }
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Category</ListItemText>
        </MenuItem>
      </Menu>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            {dialogMode === 'add'
              ? 'Add New Category'
              : 'Edit Category'}
            <IconButton onClick={handleDialogClose} edge="end">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Controller
                name="name"
                control={control}
                rules={{
                  required: 'Name is required',
                  maxLength: {
                    value: 100,
                    message: 'Name must not exceed 100 characters',
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Category Name"
                    fullWidth
                    required
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />
              <Controller
                name="description"
                control={control}
                rules={{
                  required: 'Description is required',
                  maxLength: {
                    value: 500,
                    message: 'Description must not exceed 500 characters',
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description"
                    fullWidth
                    required
                    multiline
                    rows={4}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleDialogClose}>Cancel</Button>
            <LoadingButton
              type="submit"
              variant="contained"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {dialogMode === 'add' ? 'Create' : 'Save'}
            </LoadingButton>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Category</DialogTitle>
        <DialogContent>
          <Box>
            Are you sure you want to delete the category{' '}
            <strong>{categoryToDelete?.name}</strong>?
            <br />
            <br />
            This action cannot be undone. Categories with associated risk
            assessments cannot be deleted.
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <LoadingButton
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            loading={deleteMutation.isPending}
          >
            Delete
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
});
