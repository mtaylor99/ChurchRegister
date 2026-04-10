import React from 'react';
import { Box, Button, IconButton, styled } from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';
import { BaseCard } from './BaseCard';
import type { BaseCardProps } from './BaseCard';

export interface ActionCardProps extends Omit<BaseCardProps, 'actions'> {
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: SvgIconComponent;
    variant?: 'contained' | 'outlined' | 'text';
    color?:
      | 'inherit'
      | 'primary'
      | 'secondary'
      | 'success'
      | 'error'
      | 'info'
      | 'warning';
    disabled?: boolean;
    loading?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: SvgIconComponent;
    variant?: 'contained' | 'outlined' | 'text';
    color?:
      | 'inherit'
      | 'primary'
      | 'secondary'
      | 'success'
      | 'error'
      | 'info'
      | 'warning';
    disabled?: boolean;
    loading?: boolean;
  };
  iconActions?: Array<{
    icon: SvgIconComponent;
    onClick: () => void;
    tooltip?: string;
    disabled?: boolean;
    color?:
      | 'inherit'
      | 'default'
      | 'primary'
      | 'secondary'
      | 'error'
      | 'info'
      | 'success'
      | 'warning';
  }>;
  actionLayout?: 'horizontal' | 'vertical' | 'space-between';
  children?: React.ReactNode;
}

const ActionsContainer = styled(Box)<{ layout?: string }>(({ layout }) => ({
  display: 'flex',
  flexDirection: layout === 'vertical' ? 'column' : 'row',
  justifyContent: layout === 'space-between' ? 'space-between' : 'flex-start',
  alignItems: layout === 'vertical' ? 'stretch' : 'center',
  gap: 8,
  width: '100%',
}));

const IconActionsContainer = styled(Box)(() => ({
  display: 'flex',
  gap: 4,
}));

export const ActionCard: React.FC<ActionCardProps> = ({
  primaryAction,
  secondaryAction,
  iconActions,
  actionLayout = 'horizontal',
  children,
  ...cardProps
}) => {
  const renderActions = () => {
    const mainActions = [];

    if (secondaryAction) {
      const SecondaryIcon = secondaryAction.icon;
      mainActions.push(
        <Button
          key="secondary"
          variant={secondaryAction.variant || 'outlined'}
          color={secondaryAction.color || 'primary'}
          onClick={secondaryAction.onClick}
          disabled={secondaryAction.disabled || secondaryAction.loading}
          startIcon={SecondaryIcon ? <SecondaryIcon /> : undefined}
          size="medium"
        >
          {secondaryAction.label}
        </Button>
      );
    }

    if (primaryAction) {
      const PrimaryIcon = primaryAction.icon;
      mainActions.push(
        <Button
          key="primary"
          variant={primaryAction.variant || 'contained'}
          color={primaryAction.color || 'primary'}
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled || primaryAction.loading}
          startIcon={PrimaryIcon ? <PrimaryIcon /> : undefined}
          size="medium"
        >
          {primaryAction.label}
        </Button>
      );
    }

    const iconActionsElement = iconActions && iconActions.length > 0 && (
      <IconActionsContainer key="icon-actions">
        {iconActions.map((action, index) => {
          const ActionIcon = action.icon;
          return (
            <IconButton
              key={index}
              onClick={action.onClick}
              disabled={action.disabled}
              color={action.color || 'default'}
              title={action.tooltip}
              size="small"
            >
              <ActionIcon />
            </IconButton>
          );
        })}
      </IconActionsContainer>
    );

    const allActions = [...mainActions];
    if (iconActionsElement) {
      if (actionLayout === 'space-between') {
        allActions.unshift(iconActionsElement);
      } else {
        allActions.push(iconActionsElement);
      }
    }

    return (
      <ActionsContainer layout={actionLayout}>{allActions}</ActionsContainer>
    );
  };

  return (
    <BaseCard {...cardProps} actions={renderActions()}>
      {children}
    </BaseCard>
  );
};
