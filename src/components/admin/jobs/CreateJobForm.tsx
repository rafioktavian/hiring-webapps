'use client';

import { useForm } from 'react-hook-form';
import { useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DynamicFormBuilder } from './DynamicFormBuilder';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { createJob, updateJob } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';
import type { Job } from '@/types/supabase';
import {
  createDefaultFormBuilderFields,
  setFormBuilderFields,
  resetFormBuilder,
  type FieldStatus,
} from '@/lib/redux/features/formBuilder/formBuilderSlice';

type CreateJobFormProps = {
  onSuccess?: () => Promise<void> | void;
  mode?: 'create' | 'edit';
  initialJob?: Job | null;
};

const JOB_TYPE_VALUES = ['full_time', 'contract', 'part_time', 'internship', 'freelance'] as const;

const JOB_TYPES = [
  { value: JOB_TYPE_VALUES[0], label: 'Full-time' },
  { value: JOB_TYPE_VALUES[1], label: 'Contract' },
  { value: JOB_TYPE_VALUES[2], label: 'Part-time' },
  { value: JOB_TYPE_VALUES[3], label: 'Internship' },
  { value: JOB_TYPE_VALUES[4], label: 'Freelance' },
] as const;

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const formatCurrency = (value: number | undefined) => {
  if (!value || value <= 0) return '';
  return currencyFormatter.format(value);
};

const parseCurrency = (raw: string) => {
  const numeric = raw.replace(/[^0-9]/g, '');
  return numeric ? Number.parseInt(numeric, 10) : 0;
};

const formSchema = z.object({
  title: z.string().min(2, {
    message: 'Title must be at least 2 characters.',
  }),
  department: z.string().min(2, {
    message: 'Department must be at least 2 characters.',
  }),
  jobType: z.enum(JOB_TYPE_VALUES),
  jobDescription: z
    .string()
    .min(10, { message: 'Job description must be at least 10 characters.' }),
  candidatesNeeded: z.coerce.number().int().min(1, { message: 'Must be at least 1 candidate.' }),
  salary_min: z.coerce.number().positive(),
  salary_max: z.coerce.number().positive(),
  status: z.enum(['active', 'inactive', 'draft']),
});

const mapJobFieldsToBuilder = (job?: Job | null) => {
  const defaults = createDefaultFormBuilderFields();
  const fieldsFromJob = (job?.application_form as any)?.fields;
  if (!Array.isArray(fieldsFromJob)) {
    return defaults;
  }

  return defaults.map((field) => {
    const matched = fieldsFromJob.find((item: any) => item.key === field.key);
    if (!matched) return field;
    const status =
      (matched.status as FieldStatus | undefined) ??
      (matched.required ? 'mandatory' : 'optional');
    return { ...field, status };
  });
};

const getMetaFromJob = (job?: Job | null) => {
  const meta = (job?.application_form as any)?.meta ?? {};
  return {
    jobType: meta.jobType ?? 'full_time',
    jobDescription: meta.jobDescription ?? '',
    candidatesNeeded: meta.candidatesNeeded ?? 1,
    salary_min: job?.salary_min ?? 7000000,
    salary_max: job?.salary_max ?? 8000000,
    status: job?.status ?? 'draft',
    department: job?.department ?? '',
    title: job?.title ?? '',
  };
};

export function CreateJobForm({
  onSuccess,
  mode = 'create',
  initialJob = null,
}: CreateJobFormProps = {}) {
  const router = useRouter();
  const { toast } = useToast();
  const formFields = useAppSelector((state) => state.formBuilder);
  const dispatch = useAppDispatch();
  const isEditMode = mode === 'edit' && !!initialJob;
  const initialMeta = useMemo(() => getMetaFromJob(initialJob), [initialJob]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialMeta.title || '',
      department: initialMeta.department || '',
      jobType: initialMeta.jobType,
      jobDescription: initialMeta.jobDescription,
      candidatesNeeded: initialMeta.candidatesNeeded,
      salary_min: initialMeta.salary_min,
      salary_max: initialMeta.salary_max,
      status: initialMeta.status as 'active' | 'inactive' | 'draft',
    },
  });

  useEffect(() => {
    if (isEditMode) {
      dispatch(setFormBuilderFields(mapJobFieldsToBuilder(initialJob)));
      form.reset({
        title: initialMeta.title || '',
        department: initialMeta.department || '',
        jobType: initialMeta.jobType,
        jobDescription: initialMeta.jobDescription,
        candidatesNeeded: initialMeta.candidatesNeeded,
        salary_min: initialMeta.salary_min,
        salary_max: initialMeta.salary_max,
        status: initialMeta.status as 'active' | 'inactive' | 'draft',
      });
    } else {
      dispatch(resetFormBuilder());
      form.reset({
        title: '',
        department: '',
        jobType: 'full_time',
        jobDescription: '',
        candidatesNeeded: 1,
        salary_min: 7000000,
        salary_max: 8000000,
        status: 'draft',
      });
    }
  }, [isEditMode, initialMeta, initialJob, dispatch, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const applicationForm = {
      meta: {
        jobType: values.jobType,
        jobTypeLabel: JOB_TYPES.find((type) => type.value === values.jobType)?.label ?? values.jobType,
        jobDescription: values.jobDescription,
        candidatesNeeded: values.candidatesNeeded,
        salaryRange: {
          min: values.salary_min,
          max: values.salary_max,
        },
      },
      fields: formFields.map((field) => ({
        key: field.key,
        label: field.label,
        status: field.status,
        required: field.status === 'mandatory',
      })),
    };

    const formData = new FormData();
    formData.append('title', values.title);
    formData.append('department', values.department);
    formData.append('salary_min', String(values.salary_min));
    formData.append('salary_max', String(values.salary_max));
    formData.append('status', values.status);
    formData.append('application_form', JSON.stringify(applicationForm));

    const result = isEditMode && initialJob
      ? await updateJob(initialJob.id, formData)
      : await createJob(formData);

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Failed to create job',
        description: result.error.message,
      });
    } else {
      toast({
        title: 'Job Created!',
        description: 'The new job posting has been successfully created.',
      });
      if (!isEditMode) {
        form.reset();
      }
      if (onSuccess) {
        await onSuccess();
      } else if (!isEditMode) {
        router.push('/admin');
        router.refresh();
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card className="border border-slate-200 shadow-none">
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Senior Frontend Engineer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Engineering" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="jobType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select job type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {JOB_TYPES.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="jobDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Description</FormLabel>
                  <FormDescription className="text-xs text-muted-foreground">
                    Outline responsibilities, expectations, and success measures for this role.
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder="Provide a concise overview of the role, expectations, and key responsibilities."
                      className="min-h-[120px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="candidatesNeeded"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Candidates Needed</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      inputMode="numeric"
                      value={field.value}
                      onChange={(event) => {
                        const nextValue = Number(event.target.value);
                        field.onChange(Number.isNaN(nextValue) ? 0 : nextValue);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="border-t border-dashed border-slate-200 pt-4" />
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700">Job Salary</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="salary_min"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Estimated Salary</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="Rp 0"
                          value={formatCurrency(field.value)}
                          onChange={(event) => {
                            const parsed = parseCurrency(event.target.value);
                            field.onChange(parsed);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="salary_max"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Estimated Salary</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="Rp 0"
                          value={formatCurrency(field.value)}
                          onChange={(event) => {
                            const parsed = parseCurrency(event.target.value);
                            field.onChange(parsed);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-none">
          <CardHeader>
            <CardTitle>Application Form Builder</CardTitle>
            <FormDescription>
              Configure the fields that candidates will see on the application form.
            </FormDescription>
          </CardHeader>
          <CardContent>
            <DynamicFormBuilder />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? isEditMode ? 'Saving...' : 'Publishing...'
              : isEditMode ? 'Save Changes' : 'Publish Job'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
