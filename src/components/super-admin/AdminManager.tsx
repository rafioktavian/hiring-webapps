'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types/supabase';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Loader2, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';

const createAdminSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type CreateAdminFormValues = z.infer<typeof createAdminSchema>;

export default function AdminManager() {
  const supabase = createClient();
  const [admins, setAdmins] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<CreateAdminFormValues>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    },
  });

  const { formState: { isSubmitting }, handleSubmit, reset } = form;

  const fetchAdmins = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['admin', 'super_admin'])
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(error.message);
    } else {
      setAdmins(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreateAdmin = async (values: CreateAdminFormValues) => {
    const { fullName, email, password } = values;

    const response = await fetch('/api/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password }),
    });
    
    const result = await response.json();

    if (response.ok) {
        toast.success('Admin created successfully!');
        reset();
        fetchAdmins();
    } else {
        toast.error(result.error || 'Failed to create admin');
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (confirm('Are you sure you want to delete this admin?')) {
        const response = await fetch('/api/delete-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: adminId }),
        });

        const result = await response.json();

        if (response.ok) {
            toast.success('Admin deleted successfully');
            fetchAdmins();
        } else {
            toast.error(result.error || 'Failed to delete admin');
        }
    }
  };


  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Create New Admin</CardTitle>
            <CardDescription>Add a new administrator to the system.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={handleSubmit(handleCreateAdmin)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
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
                      <FormControl><Input type="email" {...field} /></FormControl>
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
                      <FormControl><Input type="password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Admin'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-2">
        <Card>
            <CardHeader>
                <CardTitle>Manage Admins</CardTitle>
                <CardDescription>View and remove existing admin accounts.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                <p>Loading admins...</p>
                ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {admins.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">
                                    No admins found.
                                </TableCell>
                            </TableRow>
                        )}
                        {admins.map((admin) => (
                            <TableRow key={admin.id}>
                                <TableCell className="font-medium">{admin.full_name}</TableCell>
                                <TableCell>{admin.email}</TableCell>
                                <TableCell className="capitalize">{admin.role.replace('_', ' ')}</TableCell>
                                <TableCell className="text-right">
                                    {admin.role !== 'super_admin' ? (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanently delete the admin account for <strong>{admin.full_name}</strong>. This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteAdmin(admin.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    ) : (
                                        <Button variant="ghost" size="icon" disabled>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
