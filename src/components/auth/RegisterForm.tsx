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
import Image from 'next/image';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import Link from 'next/link';

const registerSchema = z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const router = useRouter();
  const supabase = createClient();
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    },
  });

  const { formState: { isSubmitting } } = form;

  const onEmailSubmit = async (values: RegisterFormValues) => {
    const { fullName, email, password } = values;

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            }
        }
    });

    if (signUpError) {
        toast.error(signUpError.message);
        return;
    }

    if (signUpData.user) {
        // The profile is now created by a trigger, but we can double-check
        // and insert if it somehow failed.
        const { data: profile, error: profileError } = await supabase.from('profiles').select().eq('id', signUpData.user.id).single();
        if (!profile) {
            const { error: insertError } = await supabase.from('profiles').insert({
                id: signUpData.user.id,
                full_name: fullName,
                email: email,
                role: 'candidate',
            });
            if (insertError) {
                toast.error(insertError.message);
                // Manually delete the user if profile creation fails
                await supabase.auth.admin.deleteUser(signUpData.user.id);
                return;
            }
        }

        toast.success('Registration successful! Please check your email to verify your account.');
        router.push('/login');
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${location.origin}/auth/callback`
        }
    });

    if (error) {
        toast.error(error.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">Find Your Next Role</CardTitle>
          <CardDescription>
            Create a candidate account to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
                <Image
                  src="/images/google-icon.svg"
                  alt="Google icon"
                  width={18}
                  height={18}
                  className="mr-2"
                />
                Continue with Google
            </Button>
            
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                    Or sign up with email
                </span>
                </div>
            </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEmailSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                                <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input type="email" placeholder="you@example.com" {...field} />
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
                {isSubmitting ? 'Signing up...' : 'Sign Up with Email'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 text-sm">
          <p>
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
               Login here
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
