'use client';

import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import {
  setFieldStatus,
  type FieldStatus,
} from '@/lib/redux/features/formBuilder/formBuilderSlice';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS: { label: string; value: FieldStatus }[] = [
  { label: 'Mandatory', value: 'mandatory' },
  { label: 'Optional', value: 'optional' },
  { label: 'Off', value: 'off' },
];

const activeStyles: Record<FieldStatus, string> = {
  mandatory: 'border-primary bg-primary/10 text-primary',
  optional: 'border-primary bg-primary/10 text-primary',
  off: 'border-primary bg-primary/10 text-primary',
};

export function DynamicFormBuilder() {
  const fields = useAppSelector((state) => state.formBuilder);
  const dispatch = useAppDispatch();

  const handleStatusChange = (key: string, status: FieldStatus) => {
    dispatch(setFieldStatus({ key, status }));
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-6 py-4">
        <h3 className="text-sm font-semibold text-slate-700">
          Minimum Profile Information Required
        </h3>
      </div>
      <div className="divide-y divide-slate-200">
        {fields.map((field) => {
          const isFixedMandatory = ['full_name', 'email', 'photo_profile', 'gender'].includes(field.key);
          return (
          <div
            key={field.key}
            className="flex flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between"
          >
            <span className="text-sm font-medium text-slate-700">{field.label}</span>
            <RadioGroup
              value={field.status}
              onValueChange={(value: FieldStatus) => handleStatusChange(field.key, value)}
              className="flex items-center gap-2"
            >
              {STATUS_OPTIONS.map((option) => {
                const optionId = `${field.key}-${option.value}`;
                const isActive = field.status === option.value;
                const isDisabledOption = isFixedMandatory && option.value !== 'mandatory';

                return (
                  <label
                    key={option.value}
                    htmlFor={optionId}
                    className={cn(
                      'rounded-full border px-4 py-1 text-xs font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40',
                      isDisabledOption
                        ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300'
                        : 'cursor-pointer',
                      !isDisabledOption &&
                        (isActive
                          ? activeStyles[option.value]
                          : 'border-transparent bg-slate-100 text-slate-500 hover:border-slate-300')
                    )}
                  >
                    <RadioGroupItem
                      value={option.value}
                      id={optionId}
                      disabled={isDisabledOption}
                      className="sr-only"
                    />
                    {option.label}
                  </label>
                );
              })}
            </RadioGroup>
          </div>
        );
        })}
      </div>
    </div>
  );
}
