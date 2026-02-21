import React, { useState } from 'react';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Button,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { districtsApi } from '../../services/api';
import { AssignDeaconDialog } from './AssignDeaconDialog';
import { AssignDistrictOfficerDialog } from './AssignDistrictOfficerDialog';
import type { District } from '../../types';
import { notificationManager } from '../../utils';

interface ActionMenuState {
  anchorEl: HTMLElement | null;
  district: District | null;
}

export const DistrictsGrid: React.FC = () => {
  const [actionMenu, setActionMenu] = useState<ActionMenuState>({
    anchorEl: null,
    district: null,
  });

  const [deaconDialogOpen, setDeaconDialogOpen] = useState(false);
  const [officerDialogOpen, setOfficerDialogOpen] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(
    null
  );

  // Fetch districts
  const {
    data: districts = [],
    isLoading,
  } = useQuery<District[]>({
    queryKey: ['districts'],
    queryFn: () => districtsApi.getDistricts(),
  });

  const handleOpenActionMenu = (
    event: React.MouseEvent<HTMLElement>,
    district: District
  ) => {
    setActionMenu({
      anchorEl: event.currentTarget,
      district,
    });
  };

  const handleCloseActionMenu = () => {
    setActionMenu({
      anchorEl: null,
      district: null,
    });
  };

  const handleAssignDeacon = () => {
    if (actionMenu.district) {
      setSelectedDistrict(actionMenu.district);
      setDeaconDialogOpen(true);
      handleCloseActionMenu();
    }
  };

  const handleAssignOfficer = () => {
    if (actionMenu.district) {
      setSelectedDistrict(actionMenu.district);
      setOfficerDialogOpen(true);
      handleCloseActionMenu();
    }
  };

  const handleExportDistricts = async () => {
    try {
      const blob = await districtsApi.exportDistricts();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Districts-Report-${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      notificationManager.showSuccess('Districts report exported successfully');
    } catch (error) {
      notificationManager.showError('Failed to export districts report');
    }
  };

  const columns: GridColDef<District>[] = [
    {
      field: 'name',
      headerName: 'District',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Typography variant="body2" fontWeight="medium">
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'deaconName',
      headerName: 'Deacon',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          {params.value ? (
            <Typography variant="body2">{params.value}</Typography>
          ) : (
            <Typography variant="body2" color="text.secondary" fontStyle="italic">
              Not assigned
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'districtOfficerName',
      headerName: 'District Officer',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          {params.value ? (
            <Typography variant="body2">{params.value}</Typography>
          ) : (
            <Typography variant="body2" color="text.secondary" fontStyle="italic">
              Not assigned
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'memberCount',
      headerName: 'Members',
      width: 120,
      type: 'number',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', height: '100%', width: '100%' }}>
          <Chip
            label={params.value}
            size="small"
            color={params.value > 0 ? 'primary' : 'default'}
            variant="outlined"
          />
        </Box>
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 80,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<MoreIcon />}
          label="More actions"
          onClick={(e) => handleOpenActionMenu(e as any, params.row)}
        />,
      ],
    },
  ];

  return (
    <Box>
      <Paper elevation={0} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              District Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage deacon and district officer assignments for each district
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportDistricts}
            sx={{ flexShrink: 0 }}
          >
            Export Districts
          </Button>
        </Box>

        <DataGrid
          rows={districts}
          columns={columns}
          loading={isLoading}
          autoHeight
          disableRowSelectionOnClick
          initialState={{
            pagination: {
              paginationModel: { pageSize: 12, page: 0 },
            },
          }}
          pageSizeOptions={[12]}
          sx={{
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        />
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenu.anchorEl}
        open={Boolean(actionMenu.anchorEl)}
        onClose={handleCloseActionMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleAssignDeacon}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Assign Deacon</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleAssignOfficer}>
          <ListItemIcon>
            <BadgeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Assign District Officer</ListItemText>
        </MenuItem>
      </Menu>

      {/* Dialogs */}
      <AssignDeaconDialog
        open={deaconDialogOpen}
        onClose={() => setDeaconDialogOpen(false)}
        district={selectedDistrict}
      />

      <AssignDistrictOfficerDialog
        open={officerDialogOpen}
        onClose={() => setOfficerDialogOpen(false)}
        district={selectedDistrict}
      />
    </Box>
  );
};
