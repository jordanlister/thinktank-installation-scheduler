/**
 * Input Components
 * Accessible form input components with validation and various input types
 * Based on Think Tank Technologies Landing Page Design System
 */

import React, { forwardRef, useState, useId } from 'react';
import { cn, generateId } from '../../lib/utils';
import type { InputProps, BaseComponentProps, SelectOption, SelectProps } from '../../lib/types';

/**
 * Base Input component with glassmorphism styling and accessibility features
 * 
 * @example
 * ```tsx
 * // Basic input
 * <Input placeholder="Enter your email" />
 * 
 * // With label and validation
 * <Input
 *   label="Email Address"
 *   type="email"
 *   required
 *   error={!!errors.email}
 *   errorMessage={errors.email}
 *   helperText="We'll never share your email"
 * />
 * 
 * // With icons
 * <Input
 *   leftIcon={<Search />}
 *   rightIcon={<Eye />}
 *   placeholder="Search..."
 * />
 * ```
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      size = 'md',
      error = false,
      errorMessage,
      helperText,
      label,
      leftIcon,
      rightIcon,
      required = false,
      disabled = false,
      id,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const inputId = id || generateId('input');
    const errorId = generateId('input-error');
    const helperId = generateId('input-helper');
    
    // Size classes
    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-5 py-4 text-lg',
    };

    // Icon size classes
    const iconSizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium text-text-primary mb-2',
              { 'after:content-["*"] after:text-error after:ml-1': required }
            )}
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none',
              iconSizeClasses[size]
            )}>
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={cn(
              'ttt-input',
              sizeClasses[size],
              {
                'pl-10': leftIcon && size === 'sm',
                'pl-11': leftIcon && size === 'md',
                'pl-12': leftIcon && size === 'lg',
                'pr-10': rightIcon && size === 'sm',
                'pr-11': rightIcon && size === 'md',
                'pr-12': rightIcon && size === 'lg',
                'border-error focus:ring-error': error,
                'cursor-not-allowed opacity-50': disabled,
              },
              className
            )}
            disabled={disabled}
            required={required}
            aria-invalid={error}
            aria-describedby={cn({
              [errorId]: error && errorMessage,
              [helperId]: helperText,
            })}
            data-testid={testId}
            {...props}
          />
          
          {rightIcon && (
            <div className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2 text-text-muted',
              iconSizeClasses[size],
              { 'cursor-pointer': !disabled }
            )}>
              {rightIcon}
            </div>
          )}
        </div>
        
        {(error && errorMessage) && (
          <p id={errorId} className="mt-2 text-sm text-error" role="alert">
            {errorMessage}
          </p>
        )}
        
        {helperText && !error && (
          <p id={helperId} className="mt-2 text-sm text-text-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

/**
 * Textarea component for multi-line text input
 */
export interface TextareaProps extends Omit<InputProps, 'type' | 'leftIcon' | 'rightIcon'> {
  rows?: number;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      size = 'md',
      error = false,
      errorMessage,
      helperText,
      label,
      required = false,
      disabled = false,
      rows = 4,
      resize = 'vertical',
      id,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const textareaId = id || generateId('textarea');
    const errorId = generateId('textarea-error');
    const helperId = generateId('textarea-helper');
    
    // Size classes
    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-5 py-4 text-lg',
    };

    const resizeClasses = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className={cn(
              'block text-sm font-medium text-text-primary mb-2',
              { 'after:content-["*"] after:text-error after:ml-1': required }
            )}
          >
            {label}
          </label>
        )}
        
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={cn(
            'ttt-input',
            sizeClasses[size],
            resizeClasses[resize],
            {
              'border-error focus:ring-error': error,
              'cursor-not-allowed opacity-50': disabled,
            },
            className
          )}
          disabled={disabled}
          required={required}
          aria-invalid={error}
          aria-describedby={cn({
            [errorId]: error && errorMessage,
            [helperId]: helperText,
          })}
          data-testid={testId}
          {...props}
        />
        
        {(error && errorMessage) && (
          <p id={errorId} className="mt-2 text-sm text-error" role="alert">
            {errorMessage}
          </p>
        )}
        
        {helperText && !error && (
          <p id={helperId} className="mt-2 text-sm text-text-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

/**
 * Select component for dropdown selections
 */
const Select = forwardRef<HTMLSelectElement, SelectProps & { options: SelectOption[] }>(
  (
    {
      className,
      options,
      value,
      onChange,
      placeholder,
      error = false,
      size = 'md',
      disabled = false,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const selectId = generateId('select');
    
    // Size classes
    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-5 py-4 text-lg',
    };

    return (
      <select
        ref={ref}
        id={selectId}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(
          'form-select',
          sizeClasses[size],
          'appearance-none bg-no-repeat bg-right bg-[length:16px_16px] pr-10',
          'bg-dot-pattern',
          {
            'border-error focus:ring-error': error,
            'cursor-not-allowed opacity-50': disabled,
          },
          className
        )}
        disabled={disabled}
        data-testid={testId}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    );
  }
);

Select.displayName = 'Select';

/**
 * Checkbox component
 */
export interface CheckboxProps extends Omit<BaseComponentProps, 'children'> {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  errorMessage?: string;
  id?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      checked = false,
      onChange,
      label,
      description,
      disabled = false,
      required = false,
      error = false,
      errorMessage,
      id,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const checkboxId = id || generateId('checkbox');
    const errorId = generateId('checkbox-error');

    return (
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange?.(e.target.checked)}
            disabled={disabled}
            required={required}
            aria-invalid={error}
            aria-describedby={error && errorMessage ? errorId : undefined}
            className={cn(
              'form-checkbox h-4 w-4 rounded focus:ring-2 focus:ring-brand-primary',
              {
                'border-error': error,
                'cursor-not-allowed opacity-50': disabled,
              },
              className
            )}
            data-testid={testId}
            {...props}
          />
        </div>
        
        {(label || description) && (
          <div className="ml-3">
            {label && (
              <label
                htmlFor={checkboxId}
                className={cn(
                  'text-sm font-medium text-text-primary cursor-pointer',
                  { 'cursor-not-allowed opacity-50': disabled }
                )}
              >
                {label}
                {required && <span className="text-error ml-1">*</span>}
              </label>
            )}
            {description && (
              <p className="text-sm text-text-muted mt-1">{description}</p>
            )}
            {error && errorMessage && (
              <p id={errorId} className="text-sm text-error mt-1" role="alert">
                {errorMessage}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

/**
 * Radio component
 */
export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps extends BaseComponentProps {
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  name: string;
  label?: string;
  required?: boolean;
  error?: boolean;
  errorMessage?: string;
  orientation?: 'vertical' | 'horizontal';
}

const RadioGroup = forwardRef<HTMLFieldSetElement, RadioGroupProps>(
  (
    {
      className,
      options,
      value,
      onChange,
      name,
      label,
      required = false,
      error = false,
      errorMessage,
      orientation = 'vertical',
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const errorId = generateId('radio-error');

    return (
      <fieldset
        ref={ref}
        className={cn('w-full', className)}
        data-testid={testId}
        {...props}
      >
        {label && (
          <legend className={cn(
            'block text-sm font-medium text-text-primary mb-3',
            { 'after:content-["*"] after:text-error after:ml-1': required }
          )}>
            {label}
          </legend>
        )}
        
        <div className={cn(
          'space-y-3',
          { 'flex space-y-0 space-x-6': orientation === 'horizontal' }
        )}>
          {options.map((option) => {
            const radioId = generateId('radio');
            
            return (
              <div key={option.value} className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id={radioId}
                    name={name}
                    type="radio"
                    value={option.value}
                    checked={value === option.value}
                    onChange={(e) => onChange?.(e.target.value)}
                    disabled={option.disabled}
                    required={required}
                    aria-invalid={error}
                    aria-describedby={error && errorMessage ? errorId : undefined}
                    className={cn(
                      'h-4 w-4 border-border-light text-brand-primary focus:ring-2 focus:ring-brand-primary',
                      {
                        'border-error': error,
                        'cursor-not-allowed opacity-50': option.disabled,
                      }
                    )}
                  />
                </div>
                
                <div className="ml-3">
                  <label
                    htmlFor={radioId}
                    className={cn(
                      'text-sm font-medium text-text-primary cursor-pointer',
                      { 'cursor-not-allowed opacity-50': option.disabled }
                    )}
                  >
                    {option.label}
                  </label>
                  {option.description && (
                    <p className="text-sm text-text-muted mt-1">
                      {option.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {error && errorMessage && (
          <p id={errorId} className="mt-3 text-sm text-error" role="alert">
            {errorMessage}
          </p>
        )}
      </fieldset>
    );
  }
);

RadioGroup.displayName = 'RadioGroup';

/**
 * Form Group component for consistent form field spacing
 */
export interface FormGroupProps extends BaseComponentProps {
  children: React.ReactNode;
  spacing?: 'sm' | 'md' | 'lg';
}

const FormGroup = forwardRef<HTMLDivElement, FormGroupProps>(
  ({ className, children, spacing = 'md', 'data-testid': testId, ...props }, ref) => {
    const spacingClasses = {
      sm: 'space-y-3',
      md: 'space-y-4',
      lg: 'space-y-6',
    };

    return (
      <div
        ref={ref}
        className={cn(spacingClasses[spacing], className)}
        data-testid={testId}
        {...props}
      >
        {children}
      </div>
    );
  }
);

FormGroup.displayName = 'FormGroup';

// Export all components
export { Input as default };
export { Textarea };  
export { Select };
export { Checkbox };
export { RadioGroup };
export { FormGroup };