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
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import type { UserProfileDto } from '../../types/administration';

export interface UserDrawerProps {
  open: boolean;
  onClose: () => void;
  mode: 'add' | 'edit' | 'view';
  user?: UserProfileDto | null;
  loading?: boolean;
  children: React.ReactNode;
}

const drawerWidth = 600;
const mobileDrawerWidth = '100vw';

export const UserDrawer: React.FC<UserDrawerProps> = ({
  open,
  onClose,
  mode,
  user,
  loading = false,
  children,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const getTitle = (): string => {
    switch (mode) {
      case 'add':
        return 'Add New User';
      case 'edit':
        return `Edit User: ${user?.fullName || 'Unknown'}`;
      case 'view':
        return `User Details: ${user?.fullName || 'Unknown'}`;
      default:
        return 'User';
    }
  };

  const getIcon = () => {
    switch (mode) {
      case 'add':
        return <PersonAddIcon />;
      case 'edit':
        return <EditIcon />;
      case 'view':
        return <EditIcon />; // You could add a ViewIcon if desired
      default:
        return <EditIcon />;
    }
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
            {mode === 'edit' && user && (
              <Typography variant="body2" color="text.secondary">
                {user.email}
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
