'use client';

import { useFormContext, ControllerRenderProps } from 'react-hook-form';
import { useState, ChangeEvent } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Camera } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WebcamCapture } from './WebcamCapture';
import { useAiFieldValidation } from '@/hooks/use-ai-field-validation';
import { FormField, FormControl, FormItem, FormMessage } from '../ui/form';
import { PhoneNumberInput } from '@/components/ui/phone-number-input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import citiesData from '../../../cities.json';

// Load react-date-picker only on the client to avoid SSR issues
const DatePicker = dynamic(() => import('react-date-picker'), { ssr: false });

function formatDateToISO(date: Date | null): string {
  if (!date) return '';
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface DynamicFormPreviewProps {
  fields: { key: string; label: string; required: boolean }[];
  onPhotoCapture: (url: string) => void;
}

export function DynamicFormPreview({ fields, onPhotoCapture }: DynamicFormPreviewProps) {
  const { control, setValue } = useFormContext();
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [citySearch, setCitySearch] = useState('');

  const photoFieldConfig = fields.find((field) => field.key === 'photo_profile');
  const otherFields = fields.filter((field) => field.key !== 'photo_profile');

  const renderInputField = (
    fieldKey: string,
    controllerField: ControllerRenderProps,
    handleChange: (e: ChangeEvent<HTMLInputElement>) => void,
    isPhoneNumber: boolean
  ) => {
    switch (fieldKey) {
      case 'phone_number':
        return (
          <PhoneNumberInput
            value={controllerField.value || ''}
            onChange={controllerField.onChange}
            placeholder="81XXXXXXXXXX"
            className="w-full"
          />
        );
      case 'date_of_birth':
        return (
          <div className="relative flex h-12 w-full items-center rounded-lg border-2 border-slate-200 px-3 pr-10 focus-within:ring-2 focus-within:ring-[#01959F]">
            <Calendar className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <DatePicker
              onChange={(val: any) => {
                const chosen = Array.isArray(val) ? (val[0] as Date | undefined) ?? null : (val as Date | null);
                controllerField.onChange(formatDateToISO(chosen));
              }}
              value={controllerField.value ? new Date(controllerField.value as string) : null}
              calendarIcon={null}
              clearIcon={null}
              format="yyyy-M-dd"
              dayPlaceholder="dd"
              monthPlaceholder="mm"
              yearPlaceholder="yyyy"
              className="w-full border-none ml-4"
            />
          </div>
        );
      case 'gender':
        return (
          <RadioGroup
            value={controllerField.value || ''}
            onValueChange={controllerField.onChange}
            className="flex gap-6"
          >
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <RadioGroupItem value="female" className="border-[#01959F] focus:ring-[#01959F]" />
              She/her (Female)
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <RadioGroupItem value="male" className="border-[#01959F] focus:ring-[#01959F]" />
              He/him (Male)
            </label>
          </RadioGroup>
        );
      case 'job_type':
        return (
          <Input
            {...controllerField}
            placeholder={`Choose ${fieldKey.replace('_', ' ')}`}
            className="rounded-lg border-slate-200 text-sm focus:ring-2 focus:ring-[#01959F]"
          />
        );
      case 'domicile': {
        const cities = (citiesData as Array<{ id: string; name: string }>).map((c) => ({ value: c.name, label: c.name }))
        const filtered = citySearch
          ? cities.filter((c) => c.label.toLowerCase().includes(citySearch.toLowerCase()))
          : cities
        return (
          <Select value={controllerField.value || ''} onValueChange={controllerField.onChange}>
            <SelectTrigger className="h-12 rounded-lg border-2 border-slate-200 text-sm focus:ring-2 focus:ring-[#01959F]">
              <SelectValue placeholder={`Choose ${fieldKey.replace('_', ' ')}`} />
            </SelectTrigger>
            <SelectContent>
              <div className="p-1 sticky top-0 z-10 bg-popover">
                <Input
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  placeholder="Search city..."
                  className="h-9 rounded-md border-slate-200 text-sm"
                />
              </div>
              {filtered.map((city) => (
                <SelectItem key={city.value} value={city.value}>
                  {city.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }
      case 'job_description':
        return (
          <Textarea
            {...controllerField}
            placeholder="Describe your experience"
            className="rounded-lg border-slate-200 text-sm focus:ring-2 focus:ring-[#01959F]"
          />
        );
      default:
        return (
          <Input
            {...controllerField}
            value={controllerField.value ?? ''}
            onChange={isPhoneNumber ? handleChange : controllerField.onChange}
            className="rounded-lg border-slate-200 text-sm focus:ring-2 focus:ring-[#01959F]"
            placeholder={`Enter your ${fieldKey.replace('_', ' ')}`}
          />
        );
    }
  };

  const renderPhotoField = (field: { key: string; label: string; required: boolean }) => (
    <FormField
      key={field.key}
      control={control}
      name={field.key}
      render={({ field: controllerField }) => {
        const photoUrl = controllerField.value as string | undefined;

        return (
          <FormItem className="max-w-sm space-y-5">
            <div className="flex items-center justify-between gap-4">
              <Label className="text-sm font-semibold text-slate-800">
                {field.label}
              </Label>
              {field.required && (
                <span className="text-xs font-semibold text-destructive">* Required</span>
              )}
            </div>
            <div className="flex flex-col gap-4">
              <div className="relative h-28 w-28 overflow-hidden rounded-md border bg-white">
                <Image
                  src={photoUrl || '/images/avatar-placeholder.svg'}
                  alt={photoUrl ? 'Captured profile photo' : 'Photo placeholder'}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="rounded-md border-slate-200 bg-white text-[#01959F] hover:bg-[#01959F]/10 w-[144px]"
                onClick={() => setIsCaptureModalOpen(true)}
              >
                <Camera className="mr-2 h-4 w-4" />
                {photoUrl ? 'Retake Picture' : 'Take a Picture'}
              </Button>
            </div>
            <FormMessage />

            <Dialog open={isCaptureModalOpen} onOpenChange={setIsCaptureModalOpen}>
              <DialogContent className="max-w-3xl border border-slate-200 p-0 overflow-y-auto max-h-[90vh]">
                <DialogHeader className="border-b border-slate-200 px-6 py-4">
                  <DialogTitle className="text-lg font-semibold text-slate-800">
                    Raise Your Hand to Capture
                  </DialogTitle>
                  <DialogDescription className="text-sm text-slate-500">
                    We&apos;ll take the photo once your hand pose is detected.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 px-6 pb-6 pt-4">
                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <WebcamCapture
                      onCapture={(url) => {
                        onPhotoCapture(url);
                        setValue(field.key, url, { shouldValidate: true });
                        setIsCaptureModalOpen(false);
                      }}
                    />
                  </div>
                  <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
                    To take a picture, follow the hand poses in the order shown below. The system will
                    automatically capture once the final pose is detected.
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    {['/images/pose-1.svg', '/images/pose-2.svg', '/images/pose-3.svg'].map((src, index) => (
                      <div key={src} className="flex items-center gap-3">
                        <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-slate-200 bg-white">
                          <Image src={src} alt={`Hand pose ${index + 1}`} width={40} height={40} />
                        </div>
                        {index < 2 && <span className="text-slate-400">&gt;</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </FormItem>
        );
      }}
    />
  );

  const renderStandardField = (field: { key: string; label: string; required: boolean }) => {
    const isPhoneNumber = field.key === 'phone_number';
    
    // Debug logging
    console.log('Rendering field:', field);

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
            <FormItem className="space-y-2">
              <Label htmlFor={field.key} className="text-sm font-semibold text-gray-700">
                {field.key === 'gender' ? 'Pronoun (gender)' : field.key === 'date_of_birth' ? 'Date of birth' : field.label || field.key} {field.required && <span className="text-red-500">*</span>}
              </Label>
              <FormControl>
                {renderInputField(field.key, controllerField, handleChange, isPhoneNumber)}
              </FormControl>
              {isValidating && isPhoneNumber && (
                <p className="text-xs text-muted-foreground">Validating phone number...</p>
              )}
              {validationMessage && !error && <p className="text-xs text-destructive">{validationMessage}</p>}
              <FormMessage />
            </FormItem>
          );
        }}
      />
    );
  };

  return (
    <div className="space-y-6 p-6 rounded-lg">
      {photoFieldConfig && renderPhotoField(photoFieldConfig)}
      {otherFields.map((field) => renderStandardField(field))}
    </div>
  );
}
