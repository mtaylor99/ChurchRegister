import { forwardRef } from 'react';
import {
  FormControl,
  FormControlLabel,
  Checkbox,
  FormHelperText,
  styled,
} from '@mui/material';
import type { FieldError, UseFormRegisterReturn } from 'react-hook-form';

export interface CheckboxInputProps {
  name: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  error?: FieldError | string;
  helperText?: string;
  color?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning';
  size?: 'small' | 'medium';
  register?: UseFormRegisterReturn;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLButtonElement>) => void;
  checked?: boolean;
  defaultChecked?: boolean;
  value?: string;
  className?: string;
  labelPlacement?: 'end' | 'start' | 'top' | 'bottom';
}

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  '& .MuiFormControlLabel-label': {
    color: theme.palette.text.primary,
    '&.Mui-disabled': {
      color: theme.palette.text.disabled,
    },
  },
  '& .MuiCheckbox-root': {
    '&.Mui-checked': {
      color: theme.palette.primary.main,
    },
    '&.Mui-disabled': {
      color: theme.palette.action.disabled,
    },
  },
  '& .MuiFormHelperText-root': {
    marginLeft: 0,
    '&.Mui-error': {
      color: theme.palette.error.main,
    },
  },
}));

export const CheckboxInput = forwardRef<HTMLInputElement, CheckboxInputProps>(
  (
    {
      name,
      label,
      required = false,
      disabled = false,
      error,
      helperText,
      color = 'primary',
      size = 'medium',
      register,
      onChange,
      onBlur,
      checked,
      defaultChecked,
      value,
      className,
      labelPlacement = 'end',
    },
    ref
  ) => {
    const errorMessage = typeof error === 'string' ? error : error?.message;
    const hasError = Boolean(errorMessage);

    const checkbox = (
      <Checkbox
        inputRef={ref}
        name={name}
        color={color}
        size={size}
        disabled={disabled}
        required={required}
        onChange={onChange}
        onBlur={onBlur}
        checked={checked}
        defaultChecked={defaultChecked}
        value={value}
        {...register}
      />
    );

    return (
      <StyledFormControl
        error={hasError}
        disabled={disabled}
        className={className}
      >
        {label ? (
          <FormControlLabel
            control={checkbox}
            label={label}
            labelPlacement={labelPlacement}
            disabled={disabled}
          />
        ) : (
          checkbox
        )}

        {(hasError || helperText) && (
          <FormHelperText>{errorMessage || helperText}</FormHelperText>
        )}
      </StyledFormControl>
    );
  }
);
