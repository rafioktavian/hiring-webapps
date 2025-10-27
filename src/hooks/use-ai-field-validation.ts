'use client';

import { useState, useEffect, useCallback } from 'react';
import { validateAndReformatField } from '@/ai/flows/ai-powered-field-validation';

interface UseAiFieldValidationProps {
  fieldKey: string;
  initialValue: string;
  onValidated: (reformattedValue: string) => void;
  debounceMs?: number;
}

export function useAiFieldValidation({
  fieldKey,
  initialValue,
  onValidated,
  debounceMs = 1000,
}: UseAiFieldValidationProps) {
  const [inputValue, setInputValue] = useState(initialValue);
  const [isValidating, setIsValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const triggerValidation = useCallback(
    async (value: string) => {
      if (!fieldKey || !value) {
        setValidationMessage(null);
        return;
      }
      setIsValidating(true);
      setValidationMessage(null);
      try {
        const result = await validateAndReformatField({ fieldKey, fieldValue: value });
        if (result.isValid) {
          onValidated(result.reformattedValue);
          setValidationMessage(null);
        } else {
          setValidationMessage(result.errorMessage || 'Invalid input.');
        }
      } catch (error) {
        console.error('AI validation failed:', error);
        // Don't show error to user for now, just fail silently on the UI
      } finally {
        setIsValidating(false);
      }
    },
    [fieldKey, onValidated]
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      if (inputValue !== initialValue) {
        triggerValidation(inputValue);
      }
    }, debounceMs);

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue, initialValue, debounceMs, triggerValidation]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
  };

  return {
    isValidating,
    validationMessage,
    handleInputChange,
  };
}
