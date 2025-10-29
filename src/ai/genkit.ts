import { z } from 'genkit';

type PromptConfig<Input, Output> = {
  name: string;
  input: { schema: z.ZodType<Input> };
  output: { schema: z.ZodType<Output> };
  prompt: string;
};

type FlowHandler<Input, Output> = (input: Input) => Promise<Output>;

type FlowConfig<Input, Output> = {
  name: string;
  inputSchema: z.ZodType<Input>;
  outputSchema: z.ZodType<Output>;
};

// Lightweight fallback implementation for Genkit prompts/flows.
// Provides basic validation for phone numbers and emails so the app works
// without the external @google/generative-ai dependency.

function validateAndReformat(fieldKey: string, fieldValue: string) {
  const trimmedValue = fieldValue.trim();

  if (fieldKey === 'phone_number') {
    const digits = trimmedValue.replace(/[^0-9+]/g, '');
    if (digits.length < 8) {
      return {
        isValid: false,
        reformattedValue: trimmedValue,
        errorMessage: 'Invalid phone number format.',
      };
    }
    const normalized = digits.startsWith('+') ? digits : `+${digits}`;
    return {
      isValid: true,
      reformattedValue: normalized,
      errorMessage: undefined,
    };
  }

  if (fieldKey === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(trimmedValue.toLowerCase());
    return {
      isValid,
      reformattedValue: trimmedValue.toLowerCase(),
      errorMessage: isValid ? undefined : 'Invalid email format.',
    };
  }

  return {
    isValid: true,
    reformattedValue: trimmedValue,
    errorMessage: undefined,
  };
}

export const ai = {
  definePrompt<Input, Output>(config: PromptConfig<Input, Output>) {
    return async (input: Input) => {
      // Attempt to use the schema's parse method if available.
      const safeInput =
        'schema' in config.input && config.input.schema
          ? config.input.schema.parse(input)
          : input;

      const { fieldKey, fieldValue } = safeInput as unknown as {
        fieldKey: string;
        fieldValue: string;
      };

      const result = validateAndReformat(fieldKey, fieldValue);

      const parsedOutput =
        'schema' in config.output && config.output.schema
          ? config.output.schema.parse(result)
          : (result as Output);

      return { output: parsedOutput };
    };
  },

  defineFlow<Input, Output>(
    _config: FlowConfig<Input, Output>,
    handler: FlowHandler<Input, Output>
  ) {
    return handler;
  },
};
