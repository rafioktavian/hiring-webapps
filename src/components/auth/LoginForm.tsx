'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/lib/supabase/client';
import { loginWithEmail, sendMagicLink } from '@/lib/auth/service';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, Eye, EyeOff, Mail } from 'lucide-react';
import { useState } from 'react';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  role: 'admin' | 'super_admin' | 'candidate';
}

export default function LoginForm({ role }: LoginFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  });
  const { formState: { isSubmitting } } = form;
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isLinkLoading, setIsLinkLoading] = useState(false);

  const onSubmit = async (values: LoginFormValues) => {
    const result = await loginWithEmail({
      supabase,
      email: values.email,
      password: values.password,
      expectedRole: role,
    });

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success('Logged in successfully!');
    router.push(result.redirect);
    router.refresh();
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleMagicLink = async () => {
    router.push(`/login-link`);
    router.refresh();
  };

  const isSuperAdminForm = role === 'super_admin';
  const headingText = isSuperAdminForm ? 'Masuk sebagai Super Admin' : 'Masuk ke Rakamin';
  const subHeading = isSuperAdminForm
    ? 'Gunakan kredensial super admin Anda.'
    : (
        <>
          Belum punya akun?{' '}
          <Link href="/register" className="font-semibold text-[#01959F] hover:underline">
            Daftar menggunakan email
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

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-700">Kata sandi</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={isPasswordVisible ? 'text' : 'password'}
                          placeholder="••••••••"
                          className="h-12 rounded-lg border-2 border-slate-200 bg-transparent pr-12 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#01959F] focus:ring-0"
                          {...field}
                        />
                        <button
                          type="button"
                          aria-label={isPasswordVisible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                          className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-[#01959F]"
                          onClick={() => setIsPasswordVisible((prev) => !prev)}
                        >
                          {isPasswordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isSuperAdminForm && (
                <div className="flex justify-end">
                  <Link href="/forgot-password" className="text-xs font-semibold text-[#01959F] hover:underline">
                    Lupa kata sandi?
                  </Link>
                </div>
              )}

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
                  'Masuk'
                )}
              </Button>

              {!isSuperAdminForm && (
                <>
                  <div className="flex items-center gap-3">
                    <span className="h-px flex-1 bg-slate-200" />
                    <span className="text-xs uppercase tracking-wider text-slate-400">atau</span>
                    <span className="h-px flex-1 bg-slate-200" />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    onClick={handleMagicLink}
                  >
                    <Mail className="h-4 w-4" />
                    Kirim link login melalui email
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading}
                  >
                    {isGoogleLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Menghubungkan...
                      </>
                    ) : (
                      <>
                        <Image src="/images/google-icon.svg" alt="Google" width={20} height={20} />
                        Masuk dengan Google
                      </>
                    )}
                  </Button>
                </>
              )}
            </form>
          </Form>
        </div>

        <div className="text-center text-sm text-slate-500">
          {isSuperAdminForm ? (
            <>
              Login sebagai admin?{' '}
              <Link href="/login" className="font-semibold text-[#01959F] hover:underline">
                Masuk sebagai Admin
              </Link>
            </>
          ) : (
            <Link href="/" className="hover:text-[#01959F]">
              Kembali ke beranda
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
