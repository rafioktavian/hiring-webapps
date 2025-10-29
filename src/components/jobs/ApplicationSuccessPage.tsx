'use client';

import Image from 'next/image';
import Link from 'next/link';

interface ApplicationSuccessPageProps {
  jobId: string;
}

export default function ApplicationSuccessPage({ jobId }: ApplicationSuccessPageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-lg text-center space-y-6">
        <div className="flex justify-center">
          <Image
            src="/images/application-success-illustration.svg"
            alt="Application Success"
            width={300}
            height={200}
          />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">
          🎉 Your application was sent!
        </h1>
        <p className="text-gray-600 leading-relaxed">
          Congratulations! You've taken the first step towards a rewarding career at Rakamin.
          We look forward to learning more about you during the application process.
        </p>
        <div className="space-y-3">
          <Link
            href="/jobs"
            className="inline-block w-full text-sm font-semibold text-gray-500 transition hover:text-gray-700"
          >
            Browse more jobs
          </Link>
        </div>
      </div>
    </div>
  );
}
