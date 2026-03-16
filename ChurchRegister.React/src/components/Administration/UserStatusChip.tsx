import React from 'react';
import { Chip } from '@mui/material';
import type { ChipProps } from '@mui/material';
import {
  CheckCircle as ActiveIcon,
  Pause as InactiveIcon,
  Lock as LockedIcon,
  Schedule as PendingIcon,
  Email as InvitedIcon,
} from '@mui/icons-material';
import { UserAccountStatus } from '../../types/administration';

export interface UserStatusChipProps {
  status: UserAccountStatus;
  size?: ChipProps['size'];
  variant?: ChipProps['variant'];
  className?: string;
}

const statusConfig = {
  [UserAccountStatus.Invited]: {
    label: 'Invited',
    color: '#3b82f6' as const,
    icon: <InvitedIcon />,
    bgColor: '#3b82f615',
  },
  [UserAccountStatus.Pending]: {
    label: 'Pending',
    color: '#f59e0b' as const,
    icon: <PendingIcon />,
    bgColor: '#f59e0b15',
  },
  [UserAccountStatus.Active]: {
    label: 'Active',
    color: '#10b981' as const,
    icon: <ActiveIcon />,
    bgColor: '#10b98115',
  },
  [UserAccountStatus.Locked]: {
    label: 'Locked',
    color: '#ef4444' as const,
    icon: <LockedIcon />,
    bgColor: '#ef444415',
  },
  [UserAccountStatus.Inactive]: {
    label: 'Inactive',
    color: '#6b7280' as const,
    icon: <InactiveIcon />,
    bgColor: '#6b728015',
  },
};

export const UserStatusChip: React.FC<UserStatusChipProps> = ({
  status,
  size = 'small',
  variant = 'filled',
  className,
}) => {
  const config = statusConfig[status];

  if (!config) {
    console.warn(`Unknown user status: ${status}`);
    return (
      <Chip
        label="Unknown"
        size={size}
        variant={variant}
        className={className}
        sx={{
          color: '#6b7280',
          backgroundColor: '#6b728015',
        }}
      />
    );
  }

  return (
    <Chip
      label={config.label}
      icon={config.icon}
      size={size}
      variant={variant}
      className={className}
      sx={{
        color: config.color,
        backgroundColor: config.bgColor,
        border:
          variant === 'outlined' ? `1px solid ${config.color}` : undefined,
        '& .MuiChip-icon': {
          color: config.color,
          fontSize: size === 'small' ? '16px' : '20px',
        },
        fontWeight: 500,
        textTransform: 'capitalize' as const,
      }}
    />
  );
};
