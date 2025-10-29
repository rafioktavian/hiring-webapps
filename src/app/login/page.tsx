"use client";

import LoginForm from "@/components/auth/LoginForm";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<'candidate' | 'admin'>('candidate');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F6F8FA] px-4 py-12">
      <div className="flex space-x-4 mb-8">
        <Button
          variant={selectedRole === 'candidate' ? 'default' : 'outline'}
          onClick={() => setSelectedRole('candidate')}
        >
          Login as Candidate
        </Button>
        <Button
          variant={selectedRole === 'admin' ? 'default' : 'outline'}
          onClick={() => setSelectedRole('admin')}
        >
          Login as Admin
        </Button>
      </div>
      <LoginForm role={selectedRole} />
    </div>
  );
}

