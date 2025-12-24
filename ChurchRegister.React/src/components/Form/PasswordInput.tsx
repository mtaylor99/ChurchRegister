import { useState, forwardRef, useMemo } from 'react';
import { Box, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { TextInput } from './TextInput';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { validatePassword } from '../../utils/passwordSecurity';
import type { TextInputProps } from './TextInput';
import type { PasswordValidationResult } from '../../utils/passwordSecurity';

export interface PasswordInputProps
  extends Omit<TextInputProps, 'type' | 'endAdornment'> {
  showToggle?: boolean;
  toggleAriaLabel?: string;
  showStrengthIndicator?: boolean;
  strengthIndicatorProps?: {
    showDetails?: boolean;
    allowToggle?: boolean;
    compact?: boolean;
    hideProgress?: boolean;
    hideLabel?: boolean;
  };
  userInfo?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    displayName?: string;
  };
  validationMode?: 'onChange' | 'onBlur' | 'none';
  onValidationChange?: (result: PasswordValidationResult) => void;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      showToggle = true,
      toggleAriaLabel = 'Toggle password visibility',
      showStrengthIndicator = false,
      strengthIndicatorProps = {},
      userInfo,
      validationMode = 'onChange',
      onValidationChange,
      value = '',
      onChange,
      onBlur,
      ...textInputProps
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [shouldShowStrength, setShouldShowStrength] = useState(false);

    // Memoized validation result
    const validationResult = useMemo(() => {
      if (!showStrengthIndicator || !value || typeof value !== 'string') {
        return null;
      }
      return validatePassword(value, userInfo);
    }, [showStrengthIndicator, value, userInfo]);

    // Handle validation change callback
    useMemo(() => {
      if (validationResult && onValidationChange) {
        onValidationChange(validationResult);
      }
    }, [validationResult, onValidationChange]);

    const handleTogglePassword = () => {
      setShowPassword(!showPassword);
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(event);
      }

      // Show strength indicator when user starts typing
      if (
        showStrengthIndicator &&
        event.target.value &&
        validationMode === 'onChange'
      ) {
        setShouldShowStrength(true);
      }
    };

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      if (onBlur) {
        onBlur(event);
      }

      // Show strength indicator on blur if configured
      if (
        showStrengthIndicator &&
        event.target.value &&
        validationMode === 'onBlur'
      ) {
        setShouldShowStrength(true);
      }
    };

    const endAdornment = showToggle ? (
      <IconButton
        onClick={handleTogglePassword}
        edge="end"
        aria-label={toggleAriaLabel}
        size="small"
      >
        {showPassword ? <VisibilityOff /> : <Visibility />}
      </IconButton>
    ) : undefined;

    const showStrengthNow =
      showStrengthIndicator &&
      shouldShowStrength &&
      validationResult &&
      typeof value === 'string' &&
      value.length > 0;

    return (
      <Box sx={{ width: '100%' }}>
        <TextInput
          {...textInputProps}
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          autoComplete={textInputProps.autoComplete || 'current-password'}
          endAdornment={endAdornment}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
        />

        {showStrengthNow && (
          <Box sx={{ mt: 1 }}>
            <PasswordStrengthIndicator
              validationResult={validationResult}
              {...strengthIndicatorProps}
            />
          </Box>
        )}
      </Box>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
