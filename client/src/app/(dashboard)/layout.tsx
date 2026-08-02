import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';

export const metadata: Metadata = {
  title: {
    template: '%s — Blastup',
    default: 'Dashboard — Blastup',
  },
};

async function verifyAuth(): Promise<boolean> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('wa_token')?.value;
    if (!token) return false;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const res = await fetch(`${apiUrl}/api/auth/me`, {
      headers: { Cookie: `wa_token=${token}` },
      cache: 'no-store',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const isAuthenticated = await verifyAuth();

  if (!isAuthenticated) {
    redirect('/login');
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-wrapper">
        {children}
      </main>
    </div>
  );
}
