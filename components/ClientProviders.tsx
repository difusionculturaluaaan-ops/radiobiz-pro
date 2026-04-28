'use client';

// This is a Client Component — dynamic with ssr:false is ALLOWED here
// (it's only forbidden in Server Components)
import dynamic from 'next/dynamic';

// AuthProvider imports Firebase, which must NEVER run during SSR.
// dynamic + ssr:false guarantees it's only loaded in the browser.
const AuthProvider = dynamic(
  () => import('@/lib/auth-context').then((m) => m.AuthProvider),
  { ssr: false, loading: () => null }
);

export default function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
