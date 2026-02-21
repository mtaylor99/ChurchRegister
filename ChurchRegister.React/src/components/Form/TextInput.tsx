import React, { forwardRef } from 'react';
import { TextField, InputAdornment, styled } from '@mui/material';
import type { FieldError, UseFormRegisterReturn } from 'react-hook-form';

export interface TextInputProps {
  name: string;
  label?: string;
  type?: 'text' | 'email' | 'tel' | 'url' | 'search' | 'password';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  error?: FieldError | string;
  helperText?: string;
  fullWidth?: boolean;
  margin?: 'none' | 'dense' | 'normal';
  variant?: 'outlined' | 'filled' | 'standard';
  size?: 'small' | 'medium';
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  multiline?: boolean;
  rows?: number;
  maxRows?: number;
  autoComplete?: string;
  autoFocus?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  register?: UseFormRegisterReturn;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  value?: string;
  defaultValue?: string;
  className?: string;
}

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: theme.palette.background.paper,
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.primary.main,
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.primary.main,
      borderWidth: 2,
    },
    '&.Mui-error .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.error.main,
    },
  },
  '& .MuiInputLabel-root': {
    color: theme.palette.text.secondary,
    '&.Mui-focused': {
      color: theme.palette.primary.main,
    },
    '&.Mui-error': {
      color: theme.palette.error.main,
    },
  },
  '& .MuiFormHelperText-root': {
    marginLeft: 0,
    '&.Mui-error': {
      color: theme.palette.error.main,
    },
  },
}));

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      name,
      label,
      type = 'text',
      placeholder,
      required = false,
      disabled = false,
      readOnly = false,
      error,
      helperText,
      fullWidth = true,
      margin = 'normal',
      variant = 'outlined',
      size = 'medium',
      startAdornment,
      endAdornment,
      multiline = false,
      rows,
      maxRows,
      autoComplete,
      autoFocus = false,
      maxLength,
      minLength,
      pattern,
      register,
      onChange,
      onBlur,
      value,
      defaultValue,
      className,
    },
    ref
  ) => {
    const errorMessage = typeof error === 'string' ? error : error?.message;
    const hasError = Boolean(errorMessage);

    const inputProps = {
      maxLength,
      minLength,
      pattern,
      readOnly,
    };

    const InputProps = {
      startAdornment: startAdornment ? (
        <InputAdornment position="start">{startAdornment}</InputAdornment>
      ) : undefined,
      endAdornment: endAdornment ? (
        <InputAdornment position="end">{endAdornment}</InputAdornment>
      ) : undefined,
    };

    return (
      <StyledTextField
        inputRef={ref}
        name={name}
        label={label}
        type={type}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        error={hasError}
        helperText={errorMessage || helperText}
        fullWidth={fullWidth}
        margin={margin}
        variant={variant}
        size={size}
        multiline={multiline}
        rows={rows}
        maxRows={maxRows}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        inputProps={inputProps}
        InputProps={InputProps}
        onChange={onChange}
        onBlur={onBlur}
        value={value}
        defaultValue={defaultValue}
        className={className}
        {...register}
      />
    );
  }
);
