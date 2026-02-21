/**
 * Unit tests for TextInput component
 */

import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextInput } from './TextInput';
import type { UseFormRegisterReturn } from 'react-hook-form';

describe('TextInput', () => {
  describe('rendering', () => {
    test('should render with basic props', () => {
      render(<TextInput name="test" label="Test Field" />);

      expect(screen.getByLabelText('Test Field')).toBeInTheDocument();
    });

    test('should render with placeholder', () => {
      render(
        <TextInput name="test" label="Test" placeholder="Enter text here" />
      );

      expect(
        screen.getByPlaceholderText('Enter text here')
      ).toBeInTheDocument();
    });

    test('should render with different types', () => {
      const { rerender } = render(
        <TextInput name="email" label="Email" type="email" />
      );
      expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');

      rerender(<TextInput name="password" label="Password" type="password" />);
      expect(screen.getByLabelText('Password')).toHaveAttribute(
        'type',
        'password'
      );

      rerender(<TextInput name="tel" label="Phone" type="tel" />);
      expect(screen.getByLabelText('Phone')).toHaveAttribute('type', 'tel');
    });

    test('should render as multiline textarea', () => {
      render(
        <TextInput name="description" label="Description" multiline rows={4} />
      );

      const textarea = screen.getByLabelText('Description');
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    test('should render with start adornment', () => {
      render(
        <TextInput name="price" label="Price" startAdornment={<span>$</span>} />
      );

      expect(screen.getByText('$')).toBeInTheDocument();
    });

    test('should render with end adornment', () => {
      render(
        <TextInput
          name="weight"
          label="Weight"
          endAdornment={<span>kg</span>}
        />
      );

      expect(screen.getByText('kg')).toBeInTheDocument();
    });
  });

  describe('states', () => {
    test('should be disabled when disabled prop is true', () => {
      render(<TextInput name="test" label="Test" disabled />);

      expect(screen.getByLabelText('Test')).toBeDisabled();
    });

    test('should be readonly when readOnly prop is true', () => {
      render(<TextInput name="test" label="Test" readOnly />);

      const input = screen.getByLabelText('Test') as HTMLInputElement;
      expect(input.readOnly).toBe(true);
    });

    test('should be required when required prop is true', () => {
      render(<TextInput name="test" label="Test" required />);

      expect(screen.getByLabelText(/Test/)).toBeRequired();
    });

    test('should autofocus when autoFocus is true', () => {
      render(<TextInput name="test" label="Test" autoFocus />);

      expect(screen.getByLabelText('Test')).toHaveFocus();
    });
  });

  describe('validation and errors', () => {
    test('should display error message from string', () => {
      render(
        <TextInput name="test" label="Test" error="This field is required" />
      );

      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    test('should display error message from FieldError object', () => {
      const fieldError = {
        type: 'required',
        message: 'Email is required',
      };

      render(<TextInput name="email" label="Email" error={fieldError} />);

      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    test('should display helperText when no error', () => {
      render(
        <TextInput name="test" label="Test" helperText="Enter your full name" />
      );

      expect(screen.getByText('Enter your full name')).toBeInTheDocument();
    });

    test('should prioritize error message over helperText', () => {
      render(
        <TextInput
          name="test"
          label="Test"
          error="Error message"
          helperText="Helper text"
        />
      );

      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    });

    test('should support maxLength constraint', () => {
      render(<TextInput name="test" label="Test" maxLength={10} />);

      const input = screen.getByLabelText('Test') as HTMLInputElement;
      expect(input.maxLength).toBe(10);
    });

    test('should support minLength constraint', () => {
      render(<TextInput name="test" label="Test" minLength={5} />);

      const input = screen.getByLabelText('Test') as HTMLInputElement;
      expect(input.minLength).toBe(5);
    });

    test('should support pattern constraint', () => {
      const pattern = '[0-9]{3}-[0-9]{3}-[0-9]{4}';
      render(<TextInput name="phone" label="Phone" pattern={pattern} />);

      const input = screen.getByLabelText('Phone') as HTMLInputElement;
      expect(input.pattern).toBe(pattern);
    });
  });

  describe('user interaction', () => {
    test('should call onChange when input value changes', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(<TextInput name="test" label="Test" onChange={handleChange} />);

      const input = screen.getByLabelText('Test');
      await user.type(input, 'Hello');

      expect(handleChange).toHaveBeenCalled();
      expect(handleChange).toHaveBeenCalledTimes(5); // Once per character
    });

    test('should call onBlur when input loses focus', async () => {
      const user = userEvent.setup();
      const handleBlur = vi.fn();

      render(<TextInput name="test" label="Test" onBlur={handleBlur} />);

      const input = screen.getByLabelText('Test');
      await user.click(input);
      await user.tab(); // Move focus away

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    test('should update value with controlled component', async () => {
      const { rerender } = render(
        <TextInput name="test" label="Test" value="" onChange={vi.fn()} />
      );

      const input = screen.getByLabelText('Test') as HTMLInputElement;
      expect(input.value).toBe('');

      rerender(
        <TextInput
          name="test"
          label="Test"
          value="New Value"
          onChange={vi.fn()}
        />
      );

      expect(input.value).toBe('New Value');
    });

    test('should use defaultValue for uncontrolled component', () => {
      render(
        <TextInput name="test" label="Test" defaultValue="Initial value" />
      );

      const input = screen.getByLabelText('Test') as HTMLInputElement;
      expect(input.value).toBe('Initial value');
    });
  });

  describe('react-hook-form integration', () => {
    test('should integrate with react-hook-form register', () => {
      const mockRegister: UseFormRegisterReturn = {
        name: 'testField',
        onChange: vi.fn(),
        onBlur: vi.fn(),
        ref: vi.fn(),
      };

      render(<TextInput name="test" label="Test" register={mockRegister} />);

      const input = screen.getByLabelText('Test');
      expect(input).toHaveAttribute('name', 'testField');
    });

    test('should spread register props correctly', () => {
      const onChange = vi.fn();
      const onBlur = vi.fn();
      const mockRegister: UseFormRegisterReturn = {
        name: 'email',
        onChange,
        onBlur,
        ref: vi.fn(),
      };

      render(<TextInput name="email" label="Email" register={mockRegister} />);

      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('name', 'email');
    });
  });

  describe('styling props', () => {
    test('should support different variants', () => {
      const { rerender } = render(
        <TextInput name="test" label="Test" variant="outlined" />
      );
      expect(screen.getByLabelText('Test')).toBeInTheDocument();

      rerender(<TextInput name="test" label="Test" variant="filled" />);
      expect(screen.getByLabelText('Test')).toBeInTheDocument();

      rerender(<TextInput name="test" label="Test" variant="standard" />);
      expect(screen.getByLabelText('Test')).toBeInTheDocument();
    });

    test('should support different sizes', () => {
      const { rerender } = render(
        <TextInput name="test" label="Test" size="small" />
      );
      expect(screen.getByLabelText('Test')).toBeInTheDocument();

      rerender(<TextInput name="test" label="Test" size="medium" />);
      expect(screen.getByLabelText('Test')).toBeInTheDocument();
    });

    test('should support different margins', () => {
      const { rerender } = render(
        <TextInput name="test" label="Test" margin="none" />
      );
      expect(screen.getByLabelText('Test')).toBeInTheDocument();

      rerender(<TextInput name="test" label="Test" margin="dense" />);
      expect(screen.getByLabelText('Test')).toBeInTheDocument();

      rerender(<TextInput name="test" label="Test" margin="normal" />);
      expect(screen.getByLabelText('Test')).toBeInTheDocument();
    });

    test('should support fullWidth prop', () => {
      render(<TextInput name="test" label="Test" fullWidth />);
      expect(screen.getByLabelText('Test')).toBeInTheDocument();
    });

    test('should support custom className', () => {
      render(<TextInput name="test" label="Test" className="custom-class" />);

      const container = screen.getByLabelText('Test').closest('.custom-class');
      expect(container).not.toBeNull();
    });
  });

  describe('accessibility', () => {
    test('should have proper ARIA attributes for errors', () => {
      render(<TextInput name="test" label="Test" error="Error message" />);

      const input = screen.getByLabelText('Test');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    test('should associate label with input', () => {
      render(<TextInput name="test" label="Test Label" />);

      const input = screen.getByLabelText('Test Label');
      expect(input).toBeInTheDocument();
    });

    test('should support autoComplete attribute', () => {
      render(<TextInput name="email" label="Email" autoComplete="email" />);

      const input = screen.getByLabelText('Email') as HTMLInputElement;
      expect(input.autocomplete).toBe('email');
    });
  });

  describe('forwarded ref', () => {
    test('should forward ref to input element', () => {
      const ref = vi.fn();

      render(<TextInput name="test" label="Test" ref={ref} />);

      expect(ref).toHaveBeenCalled();
    });
  });
});
