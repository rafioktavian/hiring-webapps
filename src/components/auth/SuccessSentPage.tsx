'use client';

import Link from 'next/link';
import Image from 'next/image';

interface SuccessSentPageProps {
  email?: string;
  type?: 'password-reset' | 'magic-link';
}

export default function SuccessSentPage({ email, type = 'password-reset' }: SuccessSentPageProps) {
  const isPasswordReset = type === 'password-reset';
  const title = isPasswordReset ? 'Periksa Email Anda' : 'Periksa Email Anda';
  const message = isPasswordReset 
    ? `Kami sudah mengirimkan link reset password ke <b>${email || 'email Anda'}</b> yang berlaku dalam <b>30 menit</b>`
    : `Kami sudah mengirimkan link login ke <b>${email || 'email Anda'}</b> yang berlaku dalam <b>30 menit</b>`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-md text-center">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">{title}</h1>
          <p className="text-md" dangerouslySetInnerHTML={{ __html: message }}>
          </p>
        </div>

        {/* Illustration */}
        <div className="relative mb-8 flex justify-center">
          <Image 
            src="/images/success-sent-illustration.svg" 
            alt="Email sent illustration" 
            width={400} 
            height={300}
            className="w-full max-w-sm h-auto"
          />
        </div>
      </div>
    </div>
  );
}
