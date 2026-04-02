// src/app/dashboard/layout.tsx
// Dashboard shell with sidebar navigation and top navbar
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Pipeline' },
  { href: '/dashboard/analytics', label: 'Analytics' },
  { href: '/dashboard/briefs', label: 'All Briefs' },
];

type UserRole = 'ADMIN' | 'REVIEWER';

interface UserSession {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
}

// SVG Icon components with explicit fixed sizing
function KanbanIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <circle cx="4.5" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9,22 9,12 15,12 15,22" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16,17 21,12 16,7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <polyline points="15,3 21,3 21,9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" style={{ display: 'block' }}>
      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
    </svg>
  );
}

const icons: Record<string, () => JSX.Element> = {
  '/dashboard': KanbanIcon,
  '/dashboard/analytics': ChartIcon,
  '/dashboard/briefs': ListIcon,
};

// Styles
const styles = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    background: '#f9fafb',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  } as React.CSSProperties,
  sidebar: {
    display: 'none',
    width: '260px',
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    background: '#111827',
    boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
    zIndex: 40,
  } as React.CSSProperties,
  sidebarInner: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
  } as React.CSSProperties,
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '16px 18px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  } as React.CSSProperties,
  brandIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  } as React.CSSProperties,
  brandText: {
    lineHeight: 1.2,
  } as React.CSSProperties,
  brandName: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#fff',
    display: 'block',
  } as React.CSSProperties,
  brandSub: {
    fontSize: '10px',
    color: '#9ca3af',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  } as React.CSSProperties,
  userCard: {
    padding: '14px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  } as React.CSSProperties,
  userAvatar: {
    width: '34px',
    height: '34px',
    borderRadius: '9999px',
    background: 'linear-gradient(135deg, rgba(168,85,247,0.35), rgba(59,130,246,0.35))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#d1d5db',
    flexShrink: 0,
  } as React.CSSProperties,
  userName: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#fff',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  } as React.CSSProperties,
  roleBadge: {
    display: 'inline-block',
    fontSize: '9px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    padding: '1px 6px',
    borderRadius: '3px',
    letterSpacing: '0.05em',
  } as React.CSSProperties,
  navSection: {
    padding: '14px 12px 8px',
    flex: 1,
  } as React.CSSProperties,
  navLabel: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    padding: '0 10px',
    marginBottom: '6px',
    display: 'block',
  } as React.CSSProperties,
  navLink: (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '9px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
    color: isActive ? '#fff' : '#9ca3af',
    background: isActive ? 'linear-gradient(135deg, #2563eb, #4f46e5)' : 'transparent',
    textDecoration: 'none',
    transition: 'all 0.15s ease',
    marginBottom: '2px',
    cursor: 'pointer',
  }),
  navIcon: (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: isActive ? '#fff' : '#6b7280',
    flexShrink: 0,
  }),
  navDot: {
    width: '5px',
    height: '5px',
    borderRadius: '9999px',
    background: 'rgba(255,255,255,0.5)',
    flexShrink: 0,
  } as React.CSSProperties,
  bottomNav: {
    padding: '8px 12px 14px',
  } as React.CSSProperties,
  bottomLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '9px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#9ca3af',
    textDecoration: 'none',
    marginBottom: '2px',
    cursor: 'pointer',
  } as React.CSSProperties,
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '9px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#9ca3af',
    background: 'none',
    border: 'none',
    width: '100%',
    cursor: 'pointer',
  } as React.CSSProperties,
  mainArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    minWidth: 0,
  } as React.CSSProperties,
  header: {
    position: 'sticky' as const,
    top: 0,
    zIndex: 30,
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid #e5e7eb',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  } as React.CSSProperties,
  headerInner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
  } as React.CSSProperties,
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  } as React.CSSProperties,
  menuBtn: {
    display: 'none',
    padding: '6px',
    borderRadius: '6px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: '#6b7280',
  } as React.CSSProperties,
  breadcrumb: {} as React.CSSProperties,
  breadcrumbText: {
    fontSize: '13px',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  } as React.CSSProperties,
  pageTitle: {
    fontSize: '11px',
    color: '#9ca3af',
    marginTop: '2px',
  } as React.CSSProperties,
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  } as React.CSSProperties,
  headerLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '5px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500,
    color: '#4b5563',
    textDecoration: 'none',
    cursor: 'pointer',
  } as React.CSSProperties,
  bellBtn: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '34px',
    height: '34px',
    borderRadius: '6px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: '#9ca3af',
  } as React.CSSProperties,
  liveBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '3px 8px',
    borderRadius: '9999px',
    background: '#ecfdf5',
  } as React.CSSProperties,
  liveDot: {
    width: '7px',
    height: '7px',
    borderRadius: '9999px',
    background: '#10b981',
  } as React.CSSProperties,
  liveText: {
    fontSize: '11px',
    fontWeight: 500,
    color: '#065f46',
  } as React.CSSProperties,
  profileBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 8px 4px 4px',
    borderRadius: '6px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
  } as React.CSSProperties,
  profileAvatar: {
    width: '30px',
    height: '30px',
    borderRadius: '9999px',
    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '11px',
    fontWeight: 700,
  } as React.CSSProperties,
  profileName: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#374151',
    maxWidth: '100px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } as React.CSSProperties,
  dropdown: {
    position: 'absolute' as const,
    top: '100%',
    right: 0,
    marginTop: '6px',
    width: '200px',
    background: '#fff',
    borderRadius: '10px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
    border: '1px solid #e5e7eb',
    padding: '6px 0',
    zIndex: 50,
  } as React.CSSProperties,
  dropdownHeader: {
    padding: '10px 14px',
    borderBottom: '1px solid #f3f4f6',
  } as React.CSSProperties,
  dropdownName: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#111827',
  } as React.CSSProperties,
  dropdownEmail: {
    fontSize: '11px',
    color: '#6b7280',
    marginTop: '1px',
  } as React.CSSProperties,
  dropdownRole: (role: UserRole): React.CSSProperties => ({
    display: 'inline-block',
    fontSize: '9px',
    fontWeight: 600,
    textTransform: 'uppercase',
    padding: '1px 5px',
    borderRadius: '3px',
    marginTop: '4px',
    background: role === 'ADMIN' ? '#f5f3ff' : '#ecfdf5',
    color: role === 'ADMIN' ? '#7c3aed' : '#059669',
  }),
  dropdownLogout: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    fontSize: '12px',
    fontWeight: 500,
    color: '#dc2626',
    background: 'none',
    border: 'none',
    width: '100%',
    cursor: 'pointer',
  } as React.CSSProperties,
  content: {
    flex: 1,
    overflow: 'auto',
  } as React.CSSProperties,
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 35,
  } as React.CSSProperties,
  mobileSidebar: {
    position: 'fixed' as const,
    top: 0,
    bottom: 0,
    left: 0,
    width: '260px',
    background: '#111827',
    zIndex: 40,
    boxShadow: '4px 0 24px rgba(0,0,0,0.3)',
  } as React.CSSProperties,
  loading: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#030712',
  } as React.CSSProperties,
  loadingInner: {
    textAlign: 'center',
  } as React.CSSProperties,
  loadingIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
  } as React.CSSProperties,
  loadingText: {
    marginTop: '16px',
    fontSize: '13px',
    color: '#9ca3af',
  } as React.CSSProperties,
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    async function loadSession() {
      try {
        const stored = sessionStorage.getItem('user');
        if (stored) setUser(JSON.parse(stored));
        else router.push('/login');
      } catch {
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    }
    loadSession();
  }, [router]);

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      sessionStorage.removeItem('user');
      router.push('/login');
    } catch {
      router.push('/login');
    }
  }, [router]);

  const getPageTitle = () => {
    if (pathname === '/dashboard') return { title: 'Pipeline Kanban', subtitle: 'Drag and drop briefs between stages' };
    if (pathname === '/dashboard/analytics') return { title: 'Analytics Dashboard', subtitle: 'Pipeline metrics and performance insights' };
    if (pathname === '/dashboard/briefs') return { title: 'All Briefs', subtitle: 'Search and manage project submissions' };
    if (pathname?.startsWith('/dashboard/briefs/')) return { title: 'Brief Details', subtitle: 'View and manage submission details' };
    return { title: 'Dashboard', subtitle: '' };
  };

  const { title, subtitle } = getPageTitle();

  // Desktop sidebar always visible
  const showDesktopSidebar = true;

  const sidebarContent = (mobile = false) => (
    <div style={styles.sidebarInner}>
      {/* Brand */}
      <div style={styles.brand}>
        <div style={styles.brandIcon}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        <div style={styles.brandText}>
          <span style={styles.brandName}>Veloce</span>
          <span style={styles.brandSub}>AI Pipeline</span>
        </div>
        {mobile && (
          <button onClick={() => setSidebarOpen(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: '#9ca3af', display: 'flex' }}>
            <CloseIcon />
          </button>
        )}
      </div>

      {/* User Card */}
      {user && (
        <div style={styles.userCard}>
          <div style={styles.userAvatar}>
            <UserIcon />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={styles.userName}>{user.name || user.email}</div>
            <span style={{ ...styles.roleBadge, ...(user.role === 'ADMIN' ? { background: 'rgba(168,85,247,0.25)', color: '#c4b5fd' } : { background: 'rgba(16,185,129,0.25)', color: '#6ee7b7' }) }}>
              {user.role === 'ADMIN' ? 'Admin' : 'Reviewer'}
            </span>
          </div>
        </div>
      )}

      {/* Nav Links */}
      <div style={styles.navSection}>
        <span style={styles.navLabel}>Navigation</span>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const IconComp = icons[item.href];
          return (
            <Link
              key={item.href}
              href={item.href}
              style={styles.navLink(isActive)}
              onClick={() => mobile && setSidebarOpen(false)}
            >
              <span style={styles.navIcon(isActive)}>
                {IconComp && <IconComp />}
              </span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {isActive && <span style={styles.navDot} />}
            </Link>
          );
        })}
      </div>

      {/* Bottom */}
      <div style={styles.bottomNav}>
        <Link href="/" style={styles.bottomLink} onClick={() => mobile && setSidebarOpen(false)}>
          <span style={{ color: '#6b7280' }}><HomeIcon /></span>
          <span>Public Form</span>
        </Link>
        <button style={styles.logoutBtn} onClick={() => { handleLogout(); if (mobile) setSidebarOpen(false); }}>
          <span style={{ color: '#6b7280' }}><LogoutIcon /></span>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div style={styles.loading}>
        <div style={styles.loadingInner}>
          <div style={styles.loadingIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <p style={styles.loadingText}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      {/* Desktop Sidebar */}
      <aside style={{ ...styles.sidebar, display: showDesktopSidebar ? 'block' : 'none' }}>{sidebarContent()}</aside>

      {/* Mobile overlay + sidebar */}
      {sidebarOpen && (
        <>
          <div style={styles.overlay} onClick={() => setSidebarOpen(false)} />
          <div style={styles.mobileSidebar}>{sidebarContent(true)}</div>
        </>
      )}

      {/* Main - push right by sidebar width on desktop */}
      <div style={{ ...styles.mainArea, paddingLeft: showDesktopSidebar ? '260px' : '0' }}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerInner}>
            {/* Left */}
            <div style={styles.headerLeft}>
              <button
                style={{ ...styles.menuBtn, display: 'none' }}
                onClick={() => setSidebarOpen(true)}
              >
                <MenuIcon />
              </button>
              <div style={styles.breadcrumb}>
                <div style={styles.breadcrumbText}>
                  <span>Dashboard</span>
                  <ChevronIcon />
                  <span style={{ color: '#111827', fontWeight: 500 }}>{title}</span>
                </div>
                <span style={styles.pageTitle}>{subtitle}</span>
              </div>
            </div>

            {/* Right */}
            <div style={styles.headerRight}>
              <Link href="/" style={styles.headerLink}>
                <ExternalLinkIcon />
                Public Form
              </Link>
              <button style={styles.bellBtn}>
                <BellIcon />
              </button>
              <div style={styles.liveBadge}>
                <span style={styles.liveDot} />
                <span style={styles.liveText}>Live</span>
              </div>

              {/* Profile */}
              <div style={{ position: 'relative' }}>
                <button style={styles.profileBtn} onClick={() => setProfileOpen(!profileOpen)} onBlur={() => setTimeout(() => setProfileOpen(false), 200)}>
                  <div style={styles.profileAvatar}>
                    {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span style={styles.profileName}>{user?.name || user?.email || 'User'}</span>
                </button>
                {profileOpen && (
                  <div style={styles.dropdown}>
                    <div style={styles.dropdownHeader}>
                      <div style={styles.dropdownName}>{user?.name || 'User'}</div>
                      <div style={styles.dropdownEmail}>{user?.email}</div>
                      <span style={styles.dropdownRole(user?.role || 'REVIEWER')}>
                        {user?.role === 'ADMIN' ? 'Admin' : 'Reviewer'}
                      </span>
                    </div>
                    <button style={styles.dropdownLogout} onClick={() => { handleLogout(); setProfileOpen(false); }}>
                      <LogoutIcon />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}