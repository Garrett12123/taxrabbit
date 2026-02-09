'use client';

import { useState, useCallback, useRef } from 'react';
import type { ZodType } from 'zod';

type ZodIssue = {
  path: (string | number)[];
  message: string;
};

type FieldState = {
  error?: string;
  valid?: boolean;
  touched?: boolean;
};

type FieldStates = Record<string, FieldState>;

/**
 * Hook for real-time field-level validation on blur.
 * Validates individual fields when focus leaves, showing errors
 * early but politely. Green flash on valid, shake on invalid.
 * 
 * Usage:
 *   const { getFieldProps, fieldStates, validateAll, clearField } = useFieldValidation(schema);
 *   <Input {...getFieldProps('email', email)} />
 *   {fieldStates.email?.error && <FieldError>{fieldStates.email.error}</FieldError>}
 */
export function useFieldValidation<T extends Record<string, unknown>>(
  schema: ZodType<T>,
) {
  const [fieldStates, setFieldStates] = useState<FieldStates>({});
  const validTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const validateField = useCallback(
    (fieldName: string, formData: T) => {
      // Clear previous valid timer
      if (validTimers.current[fieldName]) {
        clearTimeout(validTimers.current[fieldName]);
      }

      const result = schema.safeParse(formData);

      if (result.success) {
        // Full form valid — mark this field as valid
        setFieldStates((prev) => ({
          ...prev,
          [fieldName]: { valid: true, touched: true },
        }));

        // Reset valid indicator after brief flash
        validTimers.current[fieldName] = setTimeout(() => {
          setFieldStates((prev) => ({
            ...prev,
            [fieldName]: { ...prev[fieldName], valid: false },
          }));
        }, 1500);
      } else {
        const issues = (result.error as { issues: ZodIssue[] }).issues ?? [];
        const fieldIssue = issues.find(
          (issue: ZodIssue) => issue.path[0] === fieldName || issue.path.join('.') === fieldName
        );

        if (fieldIssue) {
          setFieldStates((prev) => ({
            ...prev,
            [fieldName]: {
              error: fieldIssue.message,
              valid: false,
              touched: true,
            },
          }));
        } else {
          // This field is fine, even if others aren't
          setFieldStates((prev) => ({
            ...prev,
            [fieldName]: { valid: true, touched: true },
          }));

          validTimers.current[fieldName] = setTimeout(() => {
            setFieldStates((prev) => ({
              ...prev,
              [fieldName]: { ...prev[fieldName], valid: false },
            }));
          }, 1500);
        }
      }
    },
    [schema]
  );

  const clearField = useCallback((fieldName: string) => {
    setFieldStates((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setFieldStates({});
  }, []);

  const validateAll = useCallback(
    (formData: T): boolean => {
      const result = schema.safeParse(formData);

      if (result.success) {
        clearAll();
        return true;
      }

      const issues = (result.error as { issues: ZodIssue[] }).issues ?? [];
      const newStates: FieldStates = {};
      for (const issue of issues) {
        const key = issue.path[0]?.toString() ?? '';
        if (!newStates[key]) {
          newStates[key] = {
            error: issue.message,
            valid: false,
            touched: true,
          };
        }
      }
      setFieldStates(newStates);
      return false;
    },
    [schema, clearAll]
  );

  const getFieldProps = useCallback(
    (fieldName: string, value: unknown, formData: T) => {
      const state = fieldStates[fieldName];
      return {
        'aria-invalid': !!state?.error || undefined,
        'data-valid': state?.valid || undefined,
        onBlur: () => {
          // Only validate if the field has a value (don't nag empty optional fields)
          if (value !== '' && value !== undefined && value !== null) {
            validateField(fieldName, formData);
          }
        },
        onFocus: () => {
          // Clear error when user focuses to fix it
          if (state?.error) {
            clearField(fieldName);
          }
        },
      };
    },
    [fieldStates, validateField, clearField]
  );

  return {
    fieldStates,
    getFieldProps,
    validateField,
    validateAll,
    clearField,
    clearAll,
  };
}
