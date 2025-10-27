'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { Job } from '@/types/supabase';
import { DynamicFormPreview } from './DynamicFormPreview';
import { Button } from '@/components/ui/button';
import { applyForJob } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useMemo, useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface ApplyFormProps {
  job: Job;
}

export function ApplyForm({ job }: ApplyFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rawFields = ((job.application_form as any)?.fields || []) as Array<{ key: string; label: string; status?: string; required?: boolean }>;
  const formFields = rawFields
    .filter((field) => (field.status ?? (field.required ? 'mandatory' : 'optional')) !== 'off')
    .map((field) => ({
      key: field.key,
      label: field.label,
      required:
        (field.status ? field.status === 'mandatory' : field.required),
    }));

  const validationSchema = z.object(
    formFields.reduce((acc: any, field: any) => {
      if (field.required) {
        let validator;
        switch (field.key) {
          case 'email':
            validator = z.string().email({ message: 'Invalid email address' });
            break;
          case 'linkedin_link':
            validator = z.string().url({ message: 'Invalid URL' });
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
    return formFields.reduce<Record<string, string>>((acc, field) => {
      acc[field.key] = '';
      return acc;
    }, {});
  }, [formFields]);

  const methods = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues,
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('job_id', job.id);
    for (const key in data) {
      if (data[key]) {
        formData.append(key, data[key]);
      }
    }
    
    // Add photo url if present
    if (photoUrl) {
        formData.append('photo_profile_url', photoUrl);
    }

    const result = await applyForJob(formData);
    setIsSubmitting(false);

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
    }
  };
  
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        <DynamicFormPreview fields={formFields} onPhotoCapture={setPhotoUrl} />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
        </Button>
      </form>
    </FormProvider>
  );
}
