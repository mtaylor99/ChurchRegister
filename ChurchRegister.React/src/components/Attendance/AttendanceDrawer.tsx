import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  Paper,
  Slide,
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import type { AttendanceRecord } from '../../types/attendance';

export interface AttendanceDrawerProps {
  /** Whether the drawer is open */
  open: boolean;
  /** Callback when drawer should close */
  onClose: () => void;
  /** Drawer mode */
  mode: 'add' | 'edit' | 'view';
  /** Attendance record for edit/view modes */
  record?: AttendanceRecord | null;
  /** Whether drawer is in loading state */
  loading?: boolean;
  /** Drawer content (usually AttendanceRecordForm) */
  children: React.ReactNode;
}

const drawerWidth = 600;
const mobileDrawerWidth = '100vw';

/**
 * Slide-out drawer for attendance record add/edit/view operations
 * Provides consistent UI matching the user management drawer
 */
export const AttendanceDrawer: React.FC<AttendanceDrawerProps> = ({
  open,
  onClose,
  mode,
  record,
  loading = false,
  children,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const getTitle = (): string => {
    switch (mode) {
      case 'add':
        return 'Add Attendance Record';
      case 'edit':
        return `Edit Attendance: ${record?.eventName || 'Unknown Event'}`;
      case 'view':
        return `Attendance Details: ${record?.eventName || 'Unknown Event'}`;
      default:
        return 'Attendance Record';
    }
  };

  const getIcon = () => {
    switch (mode) {
      case 'add':
        return <AddIcon />;
      case 'edit':
        return <EditIcon />;
      case 'view':
        return <ViewIcon />;
      default:
        return <EditIcon />;
    }
  };

  const getSubtitle = (): string | null => {
    if (mode === 'view' && record) {
      return `Recorded on ${new Date(record.date).toLocaleDateString()}`;
    }
    if (mode === 'edit' && record) {
      return `Date: ${new Date(record.date).toLocaleDateString()} • Count: ${record.attendance}`;
    }
    return null;
  };

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 3,
          pb: 2,
          borderBottom: '1px solid',
          borderBottomColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 1,
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
            }}
          >
            {getIcon()}
          </Box>
          <Box>
            <Typography variant="h5" component="h2" fontWeight={600}>
              {getTitle()}
            </Typography>
            {getSubtitle() && (
              <Typography variant="body2" color="text.secondary">
                {getSubtitle()}
              </Typography>
            )}
          </Box>
        </Box>

        <IconButton
          onClick={onClose}
          disabled={loading}
          sx={{
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
          aria-label="Close drawer"
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Content */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 3,
          backgroundColor: 'grey.50',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {children}
        </Paper>
      </Box>
    </Box>
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={loading ? undefined : onClose}
      variant="temporary"
      ModalProps={{
        keepMounted: false, // Better mobile performance
        disableEscapeKeyDown: loading,
        sx: {
          zIndex: theme.zIndex.drawer + 1,
        },
      }}
      PaperProps={{
        sx: {
          width: isMobile ? mobileDrawerWidth : drawerWidth,
          maxWidth: '100vw',
          height: '100vh',
          borderRadius: 0,
          boxShadow: theme.shadows[16],
        },
      }}
      SlideProps={{
        direction: 'left',
        timeout: {
          enter: theme.transitions.duration.enteringScreen,
          exit: theme.transitions.duration.leavingScreen,
        },
      }}
      transitionDuration={{
        enter: theme.transitions.duration.enteringScreen,
        exit: theme.transitions.duration.leavingScreen,
      }}
    >
      <Slide
        direction="left"
        in={open}
        timeout={{
          enter: theme.transitions.duration.enteringScreen,
          exit: theme.transitions.duration.leavingScreen,
        }}
      >
        <Box sx={{ height: '100%' }}>{drawerContent}</Box>
      </Slide>
    </Drawer>
  );
};

export default AttendanceDrawer;
