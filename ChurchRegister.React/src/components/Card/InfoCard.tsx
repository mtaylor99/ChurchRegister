import React from 'react';
import { Box, Typography, styled } from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';
import { BaseCard } from './BaseCard';
import type { BaseCardProps } from './BaseCard';

export interface InfoCardProps extends Omit<BaseCardProps, 'children'> {
  icon?: SvgIconComponent;
  iconColor?:
    | 'inherit'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'error'
    | 'info';
  description?: string;
  value?: string | number;
  label?: string;
  layout?: 'horizontal' | 'vertical';
}

const IconContainer = styled(Box)<{ iconColor?: string }>(({
  theme,
  iconColor,
}) => {
  const getColor = (color?: string) => {
    switch (color) {
      case 'primary':
        return theme.palette.primary.main;
      case 'secondary':
        return theme.palette.secondary.main;
      case 'success':
        return theme.palette.success.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'error':
        return theme.palette.error.main;
      case 'info':
        return theme.palette.info.main;
      default:
        return theme.palette.primary.main;
    }
  };

  const mainColor =
    iconColor && iconColor !== 'inherit'
      ? getColor(iconColor)
      : theme.palette.text.primary;

  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: theme.shape.borderRadius,
    backgroundColor:
      iconColor && iconColor !== 'inherit'
        ? `${mainColor}15`
        : theme.palette.grey[100],
    color: mainColor,
  };
});

const ContentContainer = styled(Box)<{ layout?: string }>(({ layout }) => ({
  display: 'flex',
  flexDirection: layout === 'horizontal' ? 'row' : 'column',
  alignItems: layout === 'horizontal' ? 'center' : 'flex-start',
  gap: layout === 'horizontal' ? 16 : 8,
  width: '100%',
}));

const TextContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
}));

export const InfoCard: React.FC<InfoCardProps> = ({
  icon: Icon,
  iconColor = 'primary',
  description,
  value,
  label,
  layout = 'horizontal',
  title,
  subtitle,
  ...cardProps
}) => {
  return (
    <BaseCard title={title} subtitle={subtitle} {...cardProps}>
      <ContentContainer layout={layout}>
        {Icon && (
          <IconContainer iconColor={iconColor}>
            <Icon fontSize="large" />
          </IconContainer>
        )}

        <TextContainer>
          {value && (
            <Typography
              variant="h4"
              component="div"
              fontWeight="bold"
              color="primary"
            >
              {value}
            </Typography>
          )}

          {label && (
            <Typography variant="subtitle1" component="div" fontWeight={500}>
              {label}
            </Typography>
          )}

          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {description}
            </Typography>
          )}
        </TextContainer>
      </ContentContainer>
    </BaseCard>
  );
};
