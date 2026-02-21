import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  Chip,
  Stack,
} from '@mui/material';
import { useRBAC } from '../../hooks/useRBAC';

export interface AttendancePermissionsProps {
  /**
   * Whether to show detailed permission breakdown
   */
  showDetails?: boolean;
  /**
   * Custom styling props
   */
  sx?: object;
}

/**
 * Component to display user's attendance-related permissions
 * Shows what attendance actions the current user can perform
 */
export const AttendancePermissions: React.FC<AttendancePermissionsProps> = ({
  showDetails = false,
  sx = {},
}) => {
  const {
    canViewAttendance,
    canRecordAttendance,
    canViewAnalytics,
    canManageEvents,
    user,
  } = useRBAC();

  if (!user) {
    return null;
  }

  const permissions = [
    {
      key: 'view',
      label: 'View Attendance',
      description: 'Can view attendance records',
      hasPermission: canViewAttendance,
      color: 'primary' as const,
    },
    {
      key: 'record',
      label: 'Record Attendance',
      description: 'Can create and update attendance records',
      hasPermission: canRecordAttendance,
      color: 'success' as const,
    },
    {
      key: 'analytics',
      label: 'View Analytics',
      description: 'Can access attendance analytics and reports',
      hasPermission: canViewAnalytics,
      color: 'info' as const,
    },
    {
      key: 'events',
      label: 'Manage Events',
      description: 'Can create, edit, and manage events',
      hasPermission: canManageEvents,
      color: 'warning' as const,
    },
  ];

  const grantedPermissions = permissions.filter((p) => p.hasPermission);
  const deniedPermissions = permissions.filter((p) => !p.hasPermission);

  return (
    <Card sx={sx}>
      <CardHeader
        title="Attendance Permissions"
        subheader={`${grantedPermissions.length} of ${permissions.length} permissions granted`}
      />
      <CardContent>
        {/* Granted Permissions */}
        {grantedPermissions.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom color="success.main">
              Granted Permissions
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {grantedPermissions.map((permission) => (
                <Chip
                  key={permission.key}
                  label={permission.label}
                  color={permission.color}
                  size="small"
                  title={
                    showDetails ? permission.description : permission.label
                  }
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Denied Permissions - only show in details mode */}
        {showDetails && deniedPermissions.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Restricted Permissions
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {deniedPermissions.map((permission) => (
                <Chip
                  key={permission.key}
                  label={permission.label}
                  variant="outlined"
                  size="small"
                  disabled
                  title={permission.description}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* No permissions message */}
        {grantedPermissions.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No attendance permissions granted.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default AttendancePermissions;
