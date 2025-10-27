// import Link from "next/link";
// import { Briefcase, UserCog, UserPlus } from 'lucide-react';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";

// export default function Home() {
//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40 p-4">
//         <div className="text-center mb-12">
//             <h1 className="text-5xl font-bold font-headline text-primary">
//                 HiringFlow
//             </h1>
//             <p className="mt-4 text-xl text-muted-foreground">
//                 Your gateway to the best talent.
//             </p>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl w-full">

//             {/* Admin Login Card */}
//             <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
//                 <CardHeader className="items-center text-center">
//                     <div className="p-3 bg-primary/10 rounded-full mb-2">
//                         <UserCog className="h-8 w-8 text-primary" />
//                     </div>
//                     <CardTitle>Admin Portal</CardTitle>
//                     <CardDescription>Manage jobs & candidates.</CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                     <Button asChild className="w-full">
//                         <Link href="/login">Admin Login</Link>
//                     </Button>
//                 </CardContent>
//             </Card>

//             {/* Super Admin Login Card */}
//             <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-primary/50 ring-2 ring-primary/20">
//                  <CardHeader className="items-center text-center">
//                     <div className="p-3 bg-sky-100 dark:bg-sky-900 rounded-full mb-2">
//                         <Briefcase className="h-8 w-8 text-sky-600 dark:text-sky-400" />
//                     </div>
//                     <CardTitle>Super Admin</CardTitle>
//                     <CardDescription>System-wide management.</CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                     <Button asChild variant="secondary" className="w-full bg-sky-500 hover:bg-sky-600 text-white">
//                         <Link href="/super-admin/login">Super Admin Login</Link>
//                     </Button>
//                 </CardContent>
//             </Card>

//             {/* Candidate Login/Register Card */}
//             <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
//                 <CardHeader className="items-center text-center">
//                     <div className="p-3 bg-teal-100 dark:bg-teal-900 rounded-full mb-2">
//                         <UserPlus className="h-8 w-8 text-teal-600 dark:text-teal-400" />
//                     </div>
//                     <CardTitle>For Candidates</CardTitle>
//                     <CardDescription>Find your dream job.</CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                     <Button asChild className="w-full bg-teal-500 hover:bg-teal-600 text-white">
//                         <Link href="/register">Apply Now</Link>
//                     </Button>
//                 </CardContent>
//             </Card>

//         </div>
//     </div>
//   );
// }
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/jobs');
}
