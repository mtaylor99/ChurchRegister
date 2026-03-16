import React from 'react';
import { Avatar, Tooltip } from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';

export interface UserAvatarProps {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  size?: 'small' | 'medium' | 'large';
  showTooltip?: boolean;
  className?: string;
}

const sizeMap = {
  small: { width: 32, height: 32, fontSize: '0.875rem' },
  medium: { width: 40, height: 40, fontSize: '1rem' },
  large: { width: 56, height: 56, fontSize: '1.25rem' },
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  firstName = '',
  lastName = '',
  avatarUrl,
  size = 'medium',
  showTooltip = true,
  className,
}) => {
  // Generate initials from first and last name
  const generateInitials = (first: string, last: string): string => {
    const firstInitial = first?.charAt(0)?.toUpperCase() || '';
    const lastInitial = last?.charAt(0)?.toUpperCase() || '';
    return firstInitial + lastInitial;
  };

  const initials = generateInitials(firstName, lastName);
  const fullName = `${firstName} ${lastName}`.trim();
  const dimensions = sizeMap[size];

  // Generate consistent background color based on initials
  const getBackgroundColor = (initials: string): string => {
    if (!initials) return '#9e9e9e'; // Default gray for empty initials

    const colors = [
      '#f44336',
      '#e91e63',
      '#9c27b0',
      '#673ab7',
      '#3f51b5',
      '#2196f3',
      '#03a9f4',
      '#00bcd4',
      '#009688',
      '#4caf50',
      '#8bc34a',
      '#cddc39',
      '#ffeb3b',
      '#ffc107',
      '#ff9800',
      '#ff5722',
    ];

    const charCode = initials.charCodeAt(0) + (initials.charCodeAt(1) || 0);
    return colors[charCode % colors.length];
  };

  const avatarElement = (
    <Avatar
      src={avatarUrl}
      className={className}
      sx={{
        ...dimensions,
        backgroundColor: !avatarUrl ? getBackgroundColor(initials) : undefined,
        color: '#ffffff',
        fontWeight: 600,
        fontSize: dimensions.fontSize,
      }}
    >
      {!avatarUrl &&
        (initials || <PersonIcon sx={{ fontSize: dimensions.fontSize }} />)}
    </Avatar>
  );

  if (showTooltip && fullName) {
    return (
      <Tooltip title={fullName} arrow>
        {avatarElement}
      </Tooltip>
    );
  }

  return avatarElement;
};
