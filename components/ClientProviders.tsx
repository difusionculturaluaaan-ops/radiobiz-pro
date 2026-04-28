'use client';

import { AuthProvider } from '@/lib/auth-context';

// Client-side wrapper for AuthProvider
// This component is a Client Component, so Firebase initialization
// happens only in the browser — never during SSR/build.
export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
