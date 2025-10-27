'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Profile } from '@/lib/types/supabase';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  role: 'admin' | 'super_admin';
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

  const onSubmit = async (values: LoginFormValues) => {
    const { email, password } = values;

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      toast.error(signInError.message);
      return;
    }
    
    if (signInData.user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', signInData.user.id)
            .single();

        const userRole = profile?.role as Profile['role'];
        
        const expectedRole = role;
        const isSuperAdminLogin = expectedRole === 'super_admin';
        
        // super_admin can login as admin, but admin cannot login as super_admin
        const allowedRoles = isSuperAdminLogin ? ['super_admin'] : ['admin', 'super_admin'];

        if (!allowedRoles.includes(userRole)) {
            await supabase.auth.signOut();
            toast.error(`Access denied. You do not have the required permissions.`);
            return;
        }

        toast.success('Logged in successfully!');
        if (userRole === 'super_admin') {
            router.push('/super-admin/dashboard');
        } else if (userRole === 'admin') {
            router.push('/admin');
        } else {
            router.push('/');
        }
        router.refresh();
    }
  };

  const isSuperAdminForm = role === 'super_admin';

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">{isSuperAdminForm ? 'Super Admin' : 'Admin'} Login</CardTitle>
          <CardDescription>
            Access the {isSuperAdminForm ? 'system management' : 'hiring'} dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@company.com" {...field} />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 text-sm">
          <p>
            {isSuperAdminForm ? "Are you an Admin?" : "Not an Admin?"}{' '}
            <Link href={isSuperAdminForm ? "/login" : "/register"} className="font-semibold text-primary hover:underline">
               {isSuperAdminForm ? "Admin Login" : "Apply as a Candidate"}
            </Link>
          </p>
          <Link href="/" className="text-muted-foreground hover:text-primary">
            Back to Home
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
