import React, { forwardRef } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  styled,
} from '@mui/material';
import type { FieldError, UseFormRegisterReturn } from 'react-hook-form';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectInputProps {
  name: string;
  label?: string;
  options: SelectOption[];
  required?: boolean;
  disabled?: boolean;
  error?: FieldError | string;
  helperText?: string;
  fullWidth?: boolean;
  margin?: 'none' | 'dense' | 'normal';
  variant?: 'outlined' | 'filled' | 'standard';
  size?: 'small' | 'medium';
  placeholder?: string;
  multiple?: boolean;
  register?: UseFormRegisterReturn;
  onChange?: (event: { target: { value: unknown } }) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  value?: string | number | string[] | number[];
  defaultValue?: string | number | string[] | number[];
  className?: string;
}

const StyledFormControl = styled(FormControl)(({ theme }) => ({
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

export const SelectInput = forwardRef<HTMLInputElement, SelectInputProps>(
  (
    {
      name,
      label,
      options,
      required = false,
      disabled = false,
      error,
      helperText,
      fullWidth = true,
      margin = 'normal',
      variant = 'outlined',
      size = 'medium',
      placeholder,
      multiple = false,
      register,
      onChange,
      onBlur,
      value,
      defaultValue,
      className,
    },
    _ref
  ) => {
    const errorMessage = typeof error === 'string' ? error : error?.message;
    const hasError = Boolean(errorMessage);
    const labelId = `${name}-label`;

    return (
      <StyledFormControl
        fullWidth={fullWidth}
        margin={margin}
        variant={variant}
        error={hasError}
        disabled={disabled}
        required={required}
        size={size}
        className={className}
      >
        {label && <InputLabel id={labelId}>{label}</InputLabel>}

        <Select
          labelId={labelId}
          name={name}
          label={label}
          multiple={multiple}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          onBlur={onBlur}
          displayEmpty={Boolean(placeholder)}
          renderValue={placeholder && !value ? () => placeholder : undefined}
          ref={_ref}
          {...register}
        >
          {placeholder && !multiple && (
            <MenuItem value="" disabled>
              <em>{placeholder}</em>
            </MenuItem>
          )}

          {options.map((option) => (
            <MenuItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </MenuItem>
          ))}
        </Select>

        {(hasError || helperText) && (
          <FormHelperText>{errorMessage || helperText}</FormHelperText>
        )}
      </StyledFormControl>
    );
  }
);
