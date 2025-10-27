import AdminManager from "@/components/super-admin/AdminManager";

export default function SuperAdminDashboard() {
  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline">Super Admin Dashboard</h1>
        <p className="text-muted-foreground">Create and manage administrator accounts.</p>
      </div>
      <AdminManager />
    </div>
  );
}
