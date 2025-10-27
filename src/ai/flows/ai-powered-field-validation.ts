'use server';

/**
 * @fileOverview AI-powered field validation flow.
 *
 * This flow uses AI to validate and reformat input data, such as phone numbers, ensuring data consistency.
 * It exports:
 * - `validateAndReformatField` - The main function to validate and reformat a field.
 * - `AiPoweredFieldValidationInput` - The input type for the validateAndReformatField function.
 * - `AiPoweredFieldValidationOutput` - The output type for the validateAndReformatField function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiPoweredFieldValidationInputSchema = z.object({
  fieldKey: z.string().describe('The key of the field to validate and reformat.'),
  fieldValue: z.string().describe('The value of the field to validate and reformat.'),
});
export type AiPoweredFieldValidationInput = z.infer<typeof AiPoweredFieldValidationInputSchema>;

const AiPoweredFieldValidationOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the field value is valid.'),
  reformattedValue: z.string().describe('The reformatted value of the field, if applicable.'),
  errorMessage: z.string().optional().describe('An error message if the field value is invalid.'),
});
export type AiPoweredFieldValidationOutput = z.infer<typeof AiPoweredFieldValidationOutputSchema>;

export async function validateAndReformatField(
  input: AiPoweredFieldValidationInput
): Promise<AiPoweredFieldValidationOutput> {
  return aiPoweredFieldValidationFlow(input);
}

const aiPoweredFieldValidationPrompt = ai.definePrompt({
  name: 'aiPoweredFieldValidationPrompt',
  input: {schema: AiPoweredFieldValidationInputSchema},
  output: {schema: AiPoweredFieldValidationOutputSchema},
  prompt: `You are an AI assistant that validates and reformats user input for application forms.

  Your task is to determine if the provided field value is valid and, if possible, reformat it to a standard format.
  If the field value is invalid, provide an error message.

  Here are the details of the field:
  - Field Key: {{{fieldKey}}}
  - Field Value: {{{fieldValue}}}

  Consider these examples:

  For Field Key \"phone_number\":
  - Valid Input: \"(123) 456-7890\", Reformatted Value: \"+11234567890\"
  - Valid Input: \"1234567890\", Reformatted Value: \"+11234567890\"
  - Invalid Input: \"abc\", Error Message: \"Invalid phone number format.\"

  For Field Key \"email\":
  - Valid Input: \"test@example.com\", Reformatted Value: \"test@example.com\"
  - Invalid Input: \"test\", Error Message: \"Invalid email format.\"

  Provide your response in the following JSON format:
  {
    \"isValid\": boolean,
    \"reformattedValue\": string (if applicable),
    \"errorMessage\": string (if not valid)
  }`,
});

const aiPoweredFieldValidationFlow = ai.defineFlow(
  {
    name: 'aiPoweredFieldValidationFlow',
    inputSchema: AiPoweredFieldValidationInputSchema,
    outputSchema: AiPoweredFieldValidationOutputSchema,
  },
  async input => {
    const {output} = await aiPoweredFieldValidationPrompt(input);
    return output!;
  }
);

