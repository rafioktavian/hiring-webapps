'use client';

import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WebcamCapture } from './WebcamCapture';
import { useAiFieldValidation } from '@/hooks/use-ai-field-validation';
import { FormField, FormControl, FormItem, FormMessage } from '../ui/form';

interface DynamicFormPreviewProps {
  fields: { key: string; label: string; required: boolean }[];
  onPhotoCapture: (url: string) => void;
}

export function DynamicFormPreview({ fields, onPhotoCapture }: DynamicFormPreviewProps) {
  const { control, setValue } = useFormContext();

  return (
    <div className="space-y-4">
      {fields.map((field) => {
        if (field.key === 'photo_profile') {
          return (
            <FormField
              key={field.key}
              control={control}
              name={field.key}
              render={() => (
                <FormItem>
                  <Label>
                    {field.label} {field.required && <span className="text-destructive">*</span>}
                  </Label>
                  <FormControl>
                    <WebcamCapture onCapture={(url) => {
                      onPhotoCapture(url);
                      setValue(field.key, url, { shouldValidate: true });
                    }} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          );
        }

        const isPhoneNumber = field.key === 'phone_number';

        return (
          <FormField
            key={field.key}
            control={control}
            name={field.key}
            render={({ field: controllerField, fieldState: { error } }) => {
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const { validationMessage, handleInputChange, isValidating } = useAiFieldValidation({
                fieldKey: isPhoneNumber ? 'phone_number' : '',
                initialValue: controllerField.value || '',
                onValidated: (reformattedValue) => {
                  if (isPhoneNumber) {
                    setValue(field.key, reformattedValue, { shouldValidate: true });
                  }
                },
              });

              const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                controllerField.onChange(e);
                if (isPhoneNumber) {
                  handleInputChange(e.target.value);
                }
              };

              return (
                <FormItem>
                  <Label htmlFor={field.key}>
                    {field.label} {field.required && <span className="text-destructive">*</span>}
                  </Label>
                  <FormControl>
                    <Input
                      id={field.key}
                      {...controllerField}
                      value={controllerField.value ?? ""}
                      onChange={handleChange}
                      placeholder={`Enter your ${field.label.toLowerCase()}`}
                    />
                  </FormControl>
                  {isValidating && isPhoneNumber && (
                    <p className="text-sm text-muted-foreground">Validating phone number...</p>
                  )}
                  {validationMessage && !error && <p className="text-sm text-destructive">{validationMessage}</p>}
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        );
      })}
    </div>
  );
}
