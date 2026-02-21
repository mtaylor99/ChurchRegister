import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  CardMedia,
  Typography,
  styled,
} from '@mui/material';

export interface BaseCardProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  actions?: React.ReactNode;
  media?: {
    image?: string;
    alt?: string;
    height?: number;
    component?: React.ElementType;
  };
  elevation?: number;
  variant?: 'elevation' | 'outlined';
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  loading?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  color?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'error'
    | 'info';
}

const StyledCard = styled(Card)<{
  hoverable?: boolean;
  clickable?: boolean;
  cardColor?: string;
  cardSize?: string;
}>(({ theme, hoverable, clickable, cardColor, cardSize }) => ({
  transition: theme.transitions.create(['transform', 'box-shadow'], {
    duration: theme.transitions.duration.short,
  }),
  ...(hoverable && {
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows[8],
    },
  }),
  ...(clickable && {
    cursor: 'pointer',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: theme.shadows[4],
    },
  }),
  ...(cardColor &&
    cardColor !== 'default' && {
      borderTop: `4px solid ${
        cardColor === 'primary'
          ? theme.palette.primary.main
          : cardColor === 'secondary'
            ? theme.palette.secondary.main
            : cardColor === 'success'
              ? theme.palette.success.main
              : cardColor === 'warning'
                ? theme.palette.warning.main
                : cardColor === 'error'
                  ? theme.palette.error.main
                  : cardColor === 'info'
                    ? theme.palette.info.main
                    : theme.palette.primary.main
      }`,
    }),
  ...(cardSize === 'small' && {
    '& .MuiCardHeader-root': {
      paddingBottom: theme.spacing(1),
    },
    '& .MuiCardContent-root': {
      paddingTop: theme.spacing(1),
      paddingBottom: theme.spacing(1),
      '&:last-child': {
        paddingBottom: theme.spacing(2),
      },
    },
  }),
  ...(cardSize === 'large' && {
    '& .MuiCardHeader-root': {
      paddingBottom: theme.spacing(2),
    },
    '& .MuiCardContent-root': {
      paddingTop: theme.spacing(2),
      paddingBottom: theme.spacing(2),
      '&:last-child': {
        paddingBottom: theme.spacing(3),
      },
    },
  }),
}));

const LoadingOverlay = styled('div')(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: theme.palette.background.paper,
  opacity: 0.8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1,
}));

export const BaseCard: React.FC<BaseCardProps> = ({
  children,
  title,
  subtitle,
  headerAction,
  actions,
  media,
  elevation = 1,
  variant = 'elevation',
  className,
  onClick,
  hoverable = false,
  loading = false,
  disabled = false,
  size = 'medium',
  color = 'default',
}) => {
  const isClickable = Boolean(onClick);
  const isInteractive = hoverable || isClickable;

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  return (
    <StyledCard
      elevation={variant === 'elevation' ? elevation : 0}
      variant={variant}
      className={className}
      onClick={handleClick}
      hoverable={isInteractive}
      clickable={isClickable}
      cardColor={color}
      cardSize={size}
      sx={{
        position: 'relative',
        opacity: disabled ? 0.6 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    >
      {loading && (
        <LoadingOverlay>
          <Typography variant="body2" color="text.secondary">
            Loading...
          </Typography>
        </LoadingOverlay>
      )}

      {media && (
        <CardMedia
          component={media.component || 'img'}
          height={media.height || 140}
          image={media.image}
          alt={media.alt || 'Card media'}
        />
      )}

      {(title || subtitle || headerAction) && (
        <CardHeader
          title={
            title && (
              <Typography
                variant={size === 'small' ? 'h6' : 'h5'}
                component="div"
              >
                {title}
              </Typography>
            )
          }
          subheader={
            subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )
          }
          action={headerAction}
        />
      )}

      {children && <CardContent>{children}</CardContent>}

      {actions && <CardActions>{actions}</CardActions>}
    </StyledCard>
  );
};
