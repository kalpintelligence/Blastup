import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login — WA Platform',
  description: 'Sign in to your WhatsApp Automation Dashboard',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
