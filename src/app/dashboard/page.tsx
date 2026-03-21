'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to reddit-finder (main feature)
    router.replace('/dashboard/reddit-finder');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
