import { useState, useEffect, useRef } from 'react';

export interface ValidationRule {
  field: string;
  label: string;
  required?: boolean;
  validator?: (value: any) => string | null;
}

export function useFormValidation<T extends Record<string, any>>(
  initialData: T,
  rules: ValidationRule[]
) {
  const [formData, setFormData] = useState<T>(initialData);
  const [hasChanges, setHasChanges] = useState(false);
  const fieldRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({});

  useEffect(() => {
    const changed = JSON.stringify(formData) !== JSON.stringify(initialData);
    setHasChanges(changed);
  }, [formData, initialData]);

  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    let firstInvalidField: string | null = null;

    for (const rule of rules) {
      const value = formData[rule.field];
      
      if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
        errors.push(rule.label);
        if (!firstInvalidField) firstInvalidField = rule.field;
      } else if (rule.validator && value) {
        const error = rule.validator(value);
        if (error) {
          errors.push(`${rule.label}: ${error}`);
          if (!firstInvalidField) firstInvalidField = rule.field;
        }
      }
    }

    // Focus on first invalid field
    if (firstInvalidField && fieldRefs.current[firstInvalidField]) {
      fieldRefs.current[firstInvalidField]?.focus();
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const registerField = (fieldName: string) => (el: HTMLInputElement | HTMLTextAreaElement | null) => {
    fieldRefs.current[fieldName] = el;
  };

  const resetForm = () => {
    setFormData(initialData);
    setHasChanges(false);
  };

  const updateField = (field: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return {
    formData,
    setFormData,
    hasChanges,
    validateForm,
    registerField,
    resetForm,
    updateField
  };
}
