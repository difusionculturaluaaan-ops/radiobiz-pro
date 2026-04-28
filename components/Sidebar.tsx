'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

interface NavItem {
  href: string;
  icon: string;
  label: string;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',          icon: '🏠', label: 'Inicio' },
  { href: '/dashboard/clientes', icon: '🏢', label: 'Clientes' },
  { href: '/dashboard/pagos',    icon: '💰', label: 'Pagos' },
  { href: '/dashboard/control',  icon: '🎛️', label: 'Control remoto' },
];

interface SidebarProps {
  onLogout: () => void;
  userEmail: string;
}

export default function Sidebar({ onLogout, userEmail }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={`${styles.sidebar} glass-panel`}>
      {/* Brand */}
      <div className={styles.brand}>
        <span className={styles.brandIcon}>📻</span>
        <div>
          <div className={styles.brandTitle}>Radio<em>Biz</em> <span className={styles.brandBadge}>Pro</span></div>
          <div className={styles.brandSub}>Next.js Edition</div>
        </div>
      </div>

      {/* Nav */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className={styles.bottom}>
        {/* Firebase status */}
        <div className={styles.status}>
          <div className="fb-dot"></div>
          <span>Firebase conectado</span>
        </div>
        {/* User email */}
        <p className={styles.email}>{userEmail}</p>
        {/* Logout */}
        <button className={styles.logoutBtn} onClick={onLogout}>
          🔒 Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
