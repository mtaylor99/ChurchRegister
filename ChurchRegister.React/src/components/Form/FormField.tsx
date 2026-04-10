import React from 'react';
import { Box, Typography, FormHelperText, styled } from '@mui/material';
import type { FieldError } from 'react-hook-form';

export interface FormFieldProps {
  children: React.ReactNode;
  label?: string;
  error?: FieldError | string;
  helperText?: string;
  required?: boolean;
  fullWidth?: boolean;
  margin?: 'none' | 'dense' | 'normal';
  className?: string;
}

const FormFieldContainer = styled(Box)<{
  margin?: 'none' | 'dense' | 'normal';
  fullWidth?: boolean;
}>(({ theme, margin = 'normal', fullWidth = true }) => ({
  display: 'flex',
  flexDirection: 'column',
  width: fullWidth ? '100%' : 'auto',
  marginBottom:
    margin === 'normal'
      ? theme.spacing(2)
      : margin === 'dense'
        ? theme.spacing(1)
        : 0,
}));

const StyledLabel = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(0.5),
  fontWeight: 500,
  color: theme.palette.text.primary,
  fontSize: '0.875rem',
  '&.required::after': {
    content: '" *"',
    color: theme.palette.error.main,
  },
}));

const ErrorText = styled(FormHelperText)(({ theme }) => ({
  color: theme.palette.error.main,
  marginTop: theme.spacing(0.5),
  fontSize: '0.75rem',
}));

const HelperTextStyled = styled(FormHelperText)(({ theme }) => ({
  color: theme.palette.text.secondary,
  marginTop: theme.spacing(0.5),
  fontSize: '0.75rem',
}));

export const FormField: React.FC<FormFieldProps> = ({
  children,
  label,
  error,
  helperText,
  required = false,
  fullWidth = true,
  margin = 'normal',
  className,
}) => {
  const errorMessage = typeof error === 'string' ? error : error?.message;
  const hasError = Boolean(errorMessage);

  return (
    <FormFieldContainer
      margin={margin}
      fullWidth={fullWidth}
      className={className}
    >
      {label && (
        <StyledLabel className={required ? 'required' : ''}>
          {label}
        </StyledLabel>
      )}

      {children}

      {hasError && <ErrorText role="alert">{errorMessage}</ErrorText>}

      {!hasError && helperText && (
        <HelperTextStyled>{helperText}</HelperTextStyled>
      )}
    </FormFieldContainer>
  );
};
