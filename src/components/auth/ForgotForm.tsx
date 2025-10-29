'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/lib/supabase/client';
import { loginWithEmail } from '@/lib/auth/service';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

const ForgotSchema = z.object({
  email: z.string().email(),
});

type ForgotFormValues = z.infer<typeof ForgotSchema>;

interface ForgotFormProps {
  role: 'admin' | 'super_admin';
}

export default function ForgotForm({ role }: ForgotFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const form = useForm<ForgotFormValues>({
    resolver: zodResolver(ForgotSchema),
    defaultValues: {
      email: '',
    }
  });
  const { formState: { isSubmitting } } = form;

  const onSubmit = async (values: ForgotFormValues) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${location.origin}/auth/callback`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Link reset password telah dikirim ke email Anda.');
      router.push(`/success-sent?email=${encodeURIComponent(values.email)}&type=password-reset`);
    } catch (error) {
      toast.error('Terjadi kesalahan saat mengirim link reset password.');
    }
  };


  const isSuperAdminForm = role === 'super_admin';
  const headingText = isSuperAdminForm ? 'Reset Password Super Admin' : 'Lupa Password';
  const subHeading = isSuperAdminForm
    ? 'Masukkan email super admin untuk reset password.'
    : (
        <>
          Masukkan email Anda untuk menerima link reset password.{' '}
          <Link href="/login" className="font-semibold text-[#01959F] hover:underline">
            Kembali ke login
          </Link>
        </>
      );

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F8FA] px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex">
          <Image 
            src="/images/rakamin-logo.png" 
            alt="Rakamin" 
            width={120} 
            height={40}
            className="h-10 w-auto"
          />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_-30px_rgba(1,149,159,0.35)]">
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-slate-900">{headingText}</h1>
            <p className="text-sm text-slate-600">{subHeading}</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-700">Alamat email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="nama@email.com"
                        className="h-12 rounded-lg border-2 border-slate-200 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#01959F] focus:ring-0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="h-12 w-full rounded-lg bg-[#F7B500] text-base font-semibold text-[#404040] transition hover:bg-[#e6a300]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Kirim link'
                )}
              </Button>

            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
