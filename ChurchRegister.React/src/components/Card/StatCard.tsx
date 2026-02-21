import React from 'react';
import { Box, Typography, Chip, LinearProgress, styled } from '@mui/material';
import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material';
import type { SvgIconComponent } from '@mui/icons-material';
import { BaseCard } from './BaseCard';
import type { BaseCardProps } from './BaseCard';

export interface StatCardProps extends Omit<BaseCardProps, 'children'> {
  value: string | number;
  label: string;
  icon?: SvgIconComponent;
  trend?: {
    direction: 'up' | 'down' | 'flat';
    value: string | number;
    label?: string;
  };
  progress?: {
    value: number; // 0-100
    label?: string;
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  };
  badge?: {
    label: string;
    color?:
      | 'default'
      | 'primary'
      | 'secondary'
      | 'success'
      | 'warning'
      | 'error'
      | 'info';
  };
  compact?: boolean;
}

const StatContainer = styled(Box)<{ compact?: boolean }>(({ compact }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: compact ? 8 : 16,
  padding: compact ? 8 : 16,
}));

const ValueContainer = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}));

const TrendContainer = styled(Box)<{ direction: string }>(
  ({ theme, direction }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    color:
      direction === 'up'
        ? theme.palette.success.main
        : direction === 'down'
          ? theme.palette.error.main
          : theme.palette.text.secondary,
  })
);

const ProgressContainer = styled(Box)(() => ({
  width: '100%',
  marginTop: 8,
}));

export const StatCard: React.FC<StatCardProps> = ({
  value,
  label,
  icon: Icon,
  trend,
  progress,
  badge,
  compact = false,
  ...cardProps
}) => {
  const getTrendIcon = (direction: 'up' | 'down' | 'flat') => {
    switch (direction) {
      case 'up':
        return TrendingUp;
      case 'down':
        return TrendingDown;
      case 'flat':
        return TrendingFlat;
    }
  };

  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <BaseCard
      {...cardProps}
      size={compact ? 'small' : 'medium'}
      headerAction={
        badge && (
          <Chip
            label={badge.label}
            size="small"
            color={badge.color || 'default'}
          />
        )
      }
    >
      <StatContainer compact={compact}>
        <ValueContainer>
          {Icon && (
            <Icon fontSize={compact ? 'medium' : 'large'} color="primary" />
          )}
          <Typography
            variant={compact ? 'h5' : 'h3'}
            component="div"
            fontWeight="bold"
            color="primary"
          >
            {formatValue(value)}
          </Typography>
        </ValueContainer>

        <Typography
          variant={compact ? 'body2' : 'subtitle1'}
          color="text.secondary"
          component="div"
        >
          {label}
        </Typography>

        {trend && (
          <TrendContainer direction={trend.direction}>
            {React.createElement(getTrendIcon(trend.direction), {
              fontSize: 'small',
            })}
            <Typography variant="body2" component="span">
              {formatValue(trend.value)}
              {trend.label && ` ${trend.label}`}
            </Typography>
          </TrendContainer>
        )}

        {progress && (
          <ProgressContainer>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={0.5}
            >
              {progress.label && (
                <Typography variant="caption" color="text.secondary">
                  {progress.label}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                {progress.value}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress.value}
              color={progress.color || 'primary'}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </ProgressContainer>
        )}
      </StatContainer>
    </BaseCard>
  );
};
