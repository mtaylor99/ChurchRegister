import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  styled,
} from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';

export interface NavigationLinkProps {
  to: string;
  icon?: SvgIconComponent;
  children: React.ReactNode;
  exact?: boolean;
  className?: string;
  onClick?: () => void;
  variant?: 'list' | 'inline' | 'pill';
}

const StyledListItem = styled(ListItem)(({ theme }) => ({
  padding: 0,
  '&.active .MuiListItemButton-root': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
}));

const StyledInlineLink = styled(Link)(({ theme }) => ({
  color: theme.palette.text.primary,
  textDecoration: 'none',
  padding: theme.spacing(1, 2),
  borderRadius: theme.shape.borderRadius,
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  transition: theme.transitions.create(['background-color', 'color']),
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  '&.active': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
}));

const StyledPillLink = styled(Link)(({ theme }) => ({
  color: theme.palette.text.primary,
  textDecoration: 'none',
  padding: theme.spacing(0.75, 1.5),
  borderRadius: theme.spacing(3), // More rounded for pill style
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  transition: theme.transitions.create(['background-color', 'color']),
  border: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    borderColor: theme.palette.primary.main,
  },
  '&.active': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    borderColor: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
}));

export const NavigationLink: React.FC<NavigationLinkProps> = ({
  to,
  icon: Icon,
  children,
  exact = false,
  className = '',
  onClick,
  variant = 'list',
}) => {
  const location = useLocation();

  const isActive = exact
    ? location.pathname === to
    : location.pathname === to ||
      (to !== '/' && location.pathname.startsWith(to));

  const activeClass = isActive ? 'active' : '';

  if (variant === 'inline') {
    return (
      <StyledInlineLink
        to={to}
        className={`${activeClass} ${className}`}
        onClick={onClick}
      >
        {Icon && <Icon fontSize="small" />}
        {children}
      </StyledInlineLink>
    );
  }

  if (variant === 'pill') {
    return (
      <StyledPillLink
        to={to}
        className={`${activeClass} ${className}`}
        onClick={onClick}
      >
        {Icon && <Icon fontSize="small" />}
        {children}
      </StyledPillLink>
    );
  }

  return (
    <StyledListItem className={`${activeClass} ${className}`}>
      <ListItemButton component={Link} to={to} onClick={onClick}>
        {Icon && (
          <ListItemIcon>
            <Icon />
          </ListItemIcon>
        )}
        <ListItemText primary={children} />
      </ListItemButton>
    </StyledListItem>
  );
};
