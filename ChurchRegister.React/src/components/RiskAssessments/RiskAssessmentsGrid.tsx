import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Chip,
  Tooltip,
  Typography,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  Menu,
  Paper,
  TextField,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type {
  GridColDef,
  GridRowParams,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ClearIcon from '@mui/icons-material/Clear';
import type { RiskAssessment } from '../../types/riskAssessments';
import { format } from 'date-fns';

interface RiskAssessmentsGridProps {
  riskAssessments: RiskAssessment[];
  loading: boolean;
  categories: any[];
  categoryId: number | null;
  status: string;
  overdueOnly: boolean;
  title: string;
  onViewClick: (assessment: RiskAssessment) => void;
  onEditClick: (assessment: RiskAssessment) => void;
  onStartReview: (assessment: RiskAssessment) => void;
  onApprove: (assessment: RiskAssessment) => void;
  onViewHistory: (assessment: RiskAssessment) => void;
  onFilterChange: (categoryId: number | null, status: string, overdueOnly: boolean, title: string) => void;
}

export function RiskAssessmentsGrid({
  riskAssessments,
  loading,
  categories,
  categoryId,
  status,
  overdueOnly,
  title,
  onViewClick,
  onEditClick,
  onStartReview,
  onApprove,
  onViewHistory,
  onFilterChange,
}: RiskAssessmentsGridProps) {

  // Action menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<RiskAssessment | null>(null);

  // Start review confirmation dialog
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Local state for title input (debounced)
  const [localTitle, setLocalTitle] = useState(title);
  
  // Track if we're updating from user input to prevent sync loops
  const isUserInputRef = useRef(false);

  // Debounce title filter changes
  useEffect(() => {
    if (!isUserInputRef.current) {
      // This change came from props, not user input - skip debouncing
      return;
    }

    const timer = setTimeout(() => {
      // Call onFilterChange directly to update parent
      onFilterChange(categoryId, status, overdueOnly, localTitle);
      isUserInputRef.current = false;
    }, 500); // 500ms debounce delay

    return () => clearTimeout(timer);
  }, [localTitle, categoryId, status, overdueOnly, onFilterChange]);

  // Update local title when prop changes (e.g., from Clear All or initial load)
  useEffect(() => {
    if (title !== localTitle && !isUserInputRef.current) {
      setLocalTitle(title);
    }
  }, [title]);

  const handleFilterChange = (
    newCategoryId: number | null,
    newStatus: string,
    newOverdueOnly: boolean,
    newTitle: string
  ) => {
    onFilterChange(newCategoryId, newStatus, newOverdueOnly, newTitle);
  };

  const handleClearFilters = () => {
    onFilterChange(null, '', false, '');
  };

  const hasActiveFilters = categoryId !== null || status !== '' || overdueOnly || title !== '';

  const handleActionClick = (event: React.MouseEvent<HTMLElement>, assessment: RiskAssessment) => {
    setAnchorEl(event.currentTarget);
    setSelectedAssessment(assessment);
  };

  const handleActionClose = () => {
    setAnchorEl(null);
    setSelectedAssessment(null);
  };

  const handleStartReviewClick = () => {
    setConfirmDialogOpen(true);
    setAnchorEl(null);
  };

  const handleConfirmStartReview = () => {
    if (selectedAssessment) {
      onStartReview(selectedAssessment);
      setSelectedAssessment(null);
    }
    setConfirmDialogOpen(false);
  };

  const columns: GridColDef[] = [
    {
      field: 'title',
      headerName: 'Title',
      flex: 2,
      minWidth: 250,
    },
    {
      field: 'category',
      headerName: 'Category',
      flex: 1,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.row.categoryName}
          size="small"
          sx={{
            backgroundColor: '#757575',
            color: '#fff',
            fontWeight: 500,
          }}
        />
      ),
    },
    {
      field: 'lastReviewDate',
      headerName: 'Last Review',
      width: 130,
      valueFormatter: (value) => {
        return value ? format(new Date(value), 'dd MMM yyyy') : '';
      },
    },
    {
      field: 'approvals',
      headerName: 'Approvals',
      width: 120,
      align: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const { approvalCount, minimumApprovalsRequired } = params.row;
        const isMet = approvalCount >= minimumApprovalsRequired;
        return (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography variant="body2">
              {approvalCount} of {minimumApprovalsRequired}
            </Typography>
            {isMet && <CheckCircleIcon sx={{ fontSize: 16, color: '#4caf50' }} />}
          </Stack>
        );
      },
    },
    {
      field: 'nextReviewDate',
      headerName: 'Next Review',
      width: 130,
      renderCell: (params: GridRenderCellParams) => {
        const date = format(new Date(params.row.nextReviewDate), 'dd MMM yyyy');
        const alertStatus = params.row.alertStatus;
        const color =
          alertStatus === 'red'
            ? '#f44336'
            : alertStatus === 'amber'
            ? '#ff9800'
            : '#4caf50';
        
        return (
          <Typography sx={{ color, fontWeight: 500 }}>
            {date}
          </Typography>
        );
      },
    },
    {
      field: 'alert',
      headerName: 'Alert',
      width: 80,
      align: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const alertStatus = params.row.alertStatus;
        if (alertStatus === 'red') {
          return (
            <Tooltip title="Overdue">
              <ErrorIcon sx={{ color: '#f44336' }} />
            </Tooltip>
          );
        } else if (alertStatus === 'amber') {
          return (
            <Tooltip title="Due within 30 days">
              <WarningIcon sx={{ color: '#ff9800' }} />
            </Tooltip>
          );
        } else {
          return (
            <Tooltip title="On track">
              <CheckCircleIcon sx={{ color: '#4caf50' }} />
            </Tooltip>
          );
        }
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params: GridRenderCellParams) => {
        const isApproved = params.row.status === 'Approved';
        return (
          <Chip
            label={params.row.status}
            size="small"
            sx={{
              backgroundColor: isApproved ? '#4caf50' : '#2196f3',
              color: '#fff',
              fontWeight: 500,
            }}
          />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 80,
      align: 'center',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <IconButton
          size="small"
          onClick={(e) => handleActionClick(e, params.row)}
          aria-label="Actions"
        >
          <MoreVertIcon />
        </IconButton>
      ),
    },
  ];

  const getDetailPanelContent = (params: GridRowParams) => {
    return (
      <Paper
        elevation={0}
        sx={{
          backgroundColor: '#f5f5f5',
          p: 2,
          m: 1,
          ml: 6,
          borderLeft: '4px solid #2196f3',
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Consolidated Items:
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
          {params.row.categoryDescription}
        </Typography>
      </Paper>
    );
  };

  return (
    <Box>
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" flexWrap="wrap">
          <TextField
            size="small"
            label="Title"
            value={localTitle}
            onChange={(e) => {
              isUserInputRef.current = true;
              setLocalTitle(e.target.value);
            }}
            sx={{ minWidth: 200 }}
            placeholder="Filter by title..."
          />

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryId || ''}
              label="Category"
              onChange={(e) =>
                handleFilterChange(
                  e.target.value ? Number(e.target.value) : null,
                  status,
                  overdueOnly,
                  title
                )
              }
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              {categories?.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={status}
              label="Status"
              onChange={(e) => handleFilterChange(categoryId, e.target.value, overdueOnly, title)}
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              <MenuItem value="Under Review">Under Review</MenuItem>
              <MenuItem value="Approved">Approved</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Checkbox
                checked={overdueOnly}
                onChange={(e) => handleFilterChange(categoryId, status, e.target.checked, title)}
              />
            }
            label="Show Overdue Only"
          />

          {hasActiveFilters && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              sx={{ minWidth: 'fit-content', whiteSpace: 'nowrap' }}
            >
              Clear All
            </Button>
          )}
        </Stack>
      </Paper>

      {/* Grid */}
      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={riskAssessments || []}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
            sorting: {
              sortModel: [{ field: 'nextReviewDate', sort: 'asc' }],
            },
          }}
          getRowHeight={() => 'auto'}
          sx={{
            '& .MuiDataGrid-row': {
              cursor: 'pointer',
            },
            '& .MuiDataGrid-cell': {
              py: 1.5,
            },
          }}
          slots={{
            noRowsOverlay: () => (
              <Stack height="100%" alignItems="center" justifyContent="center">
                <Typography>No risk assessments found</Typography>
              </Stack>
            ),
          }}
          getDetailPanelContent={getDetailPanelContent}
        />
      </Box>

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleActionClose}>
        <MenuItem
          onClick={() => {
            if (selectedAssessment) onViewClick(selectedAssessment);
            handleActionClose();
          }}
        >
          View Details
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedAssessment) onViewHistory(selectedAssessment);
            handleActionClose();
          }}
        >
          View History
        </MenuItem>
        {selectedAssessment?.status === 'Approved' && (
          <MenuItem onClick={handleStartReviewClick}>Start Review</MenuItem>
        )}
        {selectedAssessment?.status === 'Under Review' && (
          <MenuItem
            onClick={() => {
              if (selectedAssessment) onApprove(selectedAssessment);
              handleActionClose();
            }}
          >
            Approve
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            if (selectedAssessment) onEditClick(selectedAssessment);
            handleActionClose();
          }}
        >
          Edit Details
        </MenuItem>
      </Menu>

      {/* Start Review Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Start New Review Cycle?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will clear all approvals and set the status to "Under Review". Are you sure you
            want to continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmStartReview} variant="contained" color="primary">
            Start Review
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
