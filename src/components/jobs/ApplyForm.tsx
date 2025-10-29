'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { Job } from '@/types/supabase';
import { DynamicFormPreview } from './DynamicFormPreview';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info, Loader2 } from 'lucide-react';
import { applyForJob } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useMemo, useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';

interface ApplyFormProps {
  job: Job;
}

export function ApplyForm({ job }: ApplyFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const rawFields = ((job.application_form as any)?.fields || []) as Array<{ key: string; label: string; status?: string; required?: boolean }>;
  
  // Ensure date_of_birth and gender fields are always included
  const defaultFields = [
    { key: 'date_of_birth', label: 'Date of birth', status: 'mandatory', required: true },
    { key: 'gender', label: 'Pronoun (gender)', status: 'mandatory', required: true }
  ];
  
  // Merge default fields with job-specific fields, avoiding duplicates
  const allFields = [...defaultFields];
  rawFields.forEach(field => {
    if (!allFields.some(f => f.key === field.key)) {
      allFields.push({
        key: field.key,
        label: field.label,
        status: field.status || (field.required ? 'mandatory' : 'optional'),
        required: field.required || false
      });
    }
  });
  
  // Define fields that should be hidden for all jobs (you can modify this list)
  const hiddenFields: string[] = []; // Empty array - no fields are hidden
  
  const formFields = allFields
    .filter((field) => (field.status ?? (field.required ? 'mandatory' : 'optional')) !== 'off')
    .filter((field) => !hiddenFields.includes(field.key)) // Hide specified fields
    .map((field) => ({
      key: field.key,
      label: field.label,
      required: Boolean(field.status ? field.status === 'mandatory' : field.required),
    }));

  // Enforce desired display order
  const desiredOrder = [
    'photo_profile',
    'full_name',
    'date_of_birth',
    'gender',
    'domicile',
    'phone_number',
    'email',
    'linkedin_link',
  ];

  const sortIndex = (key: string) => {
    const idx = desiredOrder.indexOf(key);
    return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
  };

  const sortedFormFields = [...formFields].sort((a, b) => sortIndex(a.key) - sortIndex(b.key));

  const validationSchema = z.object(
    sortedFormFields.reduce((acc: any, field: any) => {
      if (field.required) {
        let validator;
        switch (field.key) {
          case 'email':
            validator = z.string().email({ message: 'Invalid email address' });
            break;
          case 'linkedin_link':
            validator = z.string().url({ message: 'Invalid URL' });
            break;
          case 'date_of_birth':
            validator = z.string().min(1, `${field.label} is required`);
            break;
          case 'gender':
            validator = z.string().min(1, `${field.label} is required`);
            break;
          default:
            validator = z.string().min(1, `${field.label} is required`);
        }
        acc[field.key] = validator;
      } else {
        acc[field.key] = z.string().optional();
      }
      return acc;
    }, {})
  );

  const defaultValues = useMemo(() => {
    return sortedFormFields.reduce<Record<string, string>>((acc, field) => {
      acc[field.key] = '';
      return acc;
    }, {});
  }, [sortedFormFields]);

  const methods = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues,
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('job_id', job.id);
      for (const key in data) {
        if (data[key]) {
          formData.append(key, data[key]);
        }
      }
      
      if (photoUrl) {
        formData.append('photo_profile_url', photoUrl);
      }

      const result = await applyForJob(formData);

      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Application Failed',
          description: result.error.message,
        });
      } else {
        toast({
          title: 'Application Submitted!',
          description: "We've received your application and will be in touch soon.",
        });
        methods.reset();
        setPhotoUrl(null);
        router.push(`/jobs/${job.id}/success-apply`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const handleBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  const jobSubtitle = job.department ? ` at ${job.department}` : '';

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <div className="space-y-8 px-8 pb-10">
          <p className="text-sm font-semibold text-destructive">* Required</p>
          <DynamicFormPreview fields={sortedFormFields} onPhotoCapture={setPhotoUrl} />
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-8 py-6">
          <Button
            type="submit"
            className="w-full bg-[#01959F] font-semibold text-white hover:bg-[#017f86]"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit'
            )}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
