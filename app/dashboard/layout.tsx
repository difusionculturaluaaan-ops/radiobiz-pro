'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import Sidebar from '@/components/Sidebar';
import styles from './dashboard.module.css';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner}></div>
        <p>Cargando RadioBiz Pro…</p>
      </div>
    );
  }

  if (!user) return null;

  async function handleLogout() {
    await signOut(auth);
    router.push('/login');
  }

  return (
    <div className={styles.shell}>
      <Sidebar onLogout={handleLogout} userEmail={user.email ?? ''} />
      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
}
