// src/app/login/page.tsx
// Modern login page for agency team members
'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const styles = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  } as React.CSSProperties,
  leftPanel: {
    flex: '0 0 420px',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px',
    position: 'relative' as const,
    overflow: 'hidden',
  } as React.CSSProperties,
  leftPanelOverlay: {
    position: 'absolute' as const,
    inset: 0,
    background: 'radial-gradient(circle at 30% 70%, rgba(59,130,246,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(99,102,241,0.1) 0%, transparent 50%)',
  } as React.CSSProperties,
  leftContent: {
    position: 'relative' as const,
    zIndex: 1,
    textAlign: 'center',
  } as React.CSSProperties,
  logoContainer: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
    boxShadow: '0 8px 32px rgba(59,130,246,0.3)',
  } as React.CSSProperties,
  brandTitle: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#fff',
    marginBottom: '8px',
    letterSpacing: '-0.02em',
  } as React.CSSProperties,
  brandSubtitle: {
    fontSize: '14px',
    color: '#94a3b8',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    marginBottom: '40px',
  } as React.CSSProperties,
  featureList: {
    textAlign: 'left',
    marginTop: '20px',
  } as React.CSSProperties,
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
    color: '#cbd5e1',
    fontSize: '14px',
  } as React.CSSProperties,
  featureIcon: {
    width: '24px',
    height: '24px',
    borderRadius: '6px',
    background: 'rgba(59,130,246,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: '#60a5fa',
  } as React.CSSProperties,
  rightPanel: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f8fafc',
    padding: '40px 20px',
    overflow: 'auto',
  } as React.CSSProperties,
  cardContainer: {
    width: '100%',
    maxWidth: '420px',
  } as React.CSSProperties,
  cardHeader: {
    marginBottom: '32px',
  } as React.CSSProperties,
  cardTitle: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '8px',
    letterSpacing: '-0.02em',
  } as React.CSSProperties,
  cardDesc: {
    fontSize: '15px',
    color: '#64748b',
  } as React.CSSProperties,
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)',
    border: '1px solid #f1f5f9',
  } as React.CSSProperties,
  alert: {
    padding: '12px 16px',
    borderRadius: '10px',
    marginBottom: '24px',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
  } as React.CSSProperties,
  alertError: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
  } as React.CSSProperties,
  alertSuccess: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#16a34a',
  } as React.CSSProperties,
  formGroup: {
    marginBottom: '20px',
  } as React.CSSProperties,
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
  } as React.CSSProperties,
  inputWrapper: {
    position: 'relative' as const,
  } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    fontSize: '15px',
    color: '#0f172a',
    background: '#f8fafc',
    transition: 'all 0.15s ease',
    outline: 'none',
    boxSizing: 'border-box' as const,
  } as React.CSSProperties,
  inputFocus: {
    borderColor: '#3b82f6',
    background: '#fff',
    boxShadow: '0 0 0 3px rgba(59,130,246,0.1)',
  } as React.CSSProperties,
  inputDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  } as React.CSSProperties,
  submitBtn: {
    width: '100%',
    padding: '12px 24px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
  } as React.CSSProperties,
  submitBtnHover: {
    transform: 'translateY(-1px)',
    boxShadow: '0 6px 16px rgba(59,130,246,0.4)',
  } as React.CSSProperties,
  submitBtnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
    transform: 'none',
    boxShadow: 'none',
  } as React.CSSProperties,
  backLink: {
    textAlign: 'center',
    marginTop: '24px',
    fontSize: '14px',
    color: '#64748b',
  } as React.CSSProperties,
  backLinkText: {
    color: '#3b82f6',
    fontWeight: 500,
    textDecoration: 'none',
  } as React.CSSProperties,
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '24px 0',
  } as React.CSSProperties,
  dividerLine: {
    flex: 1,
    height: '1px',
    background: '#e2e8f0',
  } as React.CSSProperties,
  dividerText: {
    padding: '0 12px',
    fontSize: '12px',
    color: '#94a3b8',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  } as React.CSSProperties,
} as const;

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const BoltIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

const SpinnerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 2a10 10 0 1010 10" strokeLinecap="round" />
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [inputFocused, setInputFocused] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error === 'INVALID_CREDENTIALS') {
          setError('Invalid email or password. Please try again.');
        } else if (result.error === 'VALIDATION_ERROR') {
          setError('Please enter a valid email and password.');
        } else {
          setError(result.message || 'Login failed. Please try again.');
        }
        return;
      }

      setIsSuccess(true);
      if (result.data?.user) {
        sessionStorage.setItem('user', JSON.stringify(result.data.user));
      }
      setTimeout(() => {
        router.push('/dashboard');
      }, 600);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={styles.root}>
      {/* Left Panel - Branding */}
      <div style={styles.leftPanel}>
        <div style={styles.leftPanelOverlay} />
        <div style={styles.leftContent}>
          <div style={styles.logoContainer}>
            <BoltIcon />
          </div>
          <h1 style={styles.brandTitle}>Veloce</h1>
          <p style={styles.brandSubtitle}>AI Pipeline Management</p>

          <div style={styles.featureList}>
            <div style={styles.featureItem}>
              <span style={styles.featureIcon}><CheckIcon /></span>
              <span>AI-powered project brief analysis</span>
            </div>
            <div style={styles.featureItem}>
              <span style={styles.featureIcon}><CheckIcon /></span>
              <span>Real-time Kanban pipeline</span>
            </div>
            <div style={styles.featureItem}>
              <span style={styles.featureIcon}><CheckIcon /></span>
              <span>Collaborative team workspace</span>
            </div>
            <div style={styles.featureItem}>
              <span style={styles.featureIcon}><CheckIcon /></span>
              <span>Analytics and performance metrics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div style={styles.rightPanel}>
        <div style={styles.cardContainer}>
          {/* Back link */}
          <div style={{ marginBottom: '32px' }}>
            <Link href="/" style={{ fontSize: '14px', color: '#64748b', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back to public form
            </Link>
          </div>

          {/* Card Header */}
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Welcome back</h2>
            <p style={styles.cardDesc}>Sign in to your team account to continue</p>
          </div>

          {/* Login Card */}
          <div style={styles.card}>
            {error && (
              <div style={{ ...styles.alert, ...styles.alertError }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {isSuccess && (
              <div style={{ ...styles.alert, ...styles.alertSuccess }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>Login successful! Redirecting to dashboard...</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Email */}
              <div style={styles.formGroup}>
                <label htmlFor="email" style={styles.label}>
                  Email Address
                </label>
                <div style={styles.inputWrapper}>
                  <input
                    type="email"
                    id="email"
                    style={{
                      ...styles.input,
                      ...(inputFocused === 'email' ? styles.inputFocus : {}),
                      ...(isSuccess ? styles.inputDisabled : {}),
                    }}
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setInputFocused('email')}
                    onBlur={() => setInputFocused(null)}
                    required
                    autoComplete="email"
                    disabled={isSuccess}
                  />
                  {inputFocused === 'email' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Password */}
              <div style={styles.formGroup}>
                <label htmlFor="password" style={styles.label}>
                  Password
                </label>
                <div style={styles.inputWrapper}>
                  <input
                    type="password"
                    id="password"
                    style={{
                      ...styles.input,
                      ...(inputFocused === 'password' ? styles.inputFocus : {}),
                      ...(isSuccess ? styles.inputDisabled : {}),
                    }}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setInputFocused('password')}
                    onBlur={() => setInputFocused(null)}
                    required
                    minLength={8}
                    autoComplete="current-password"
                    disabled={isSuccess}
                  />
                  {inputFocused === 'password' && password.length > 0 && (
                    <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: `${Math.min(100, (password.length / 8) * 100)}px`, height: '2x', background: password.length >= 8 ? '#22c55e' : password.length >= 4 ? '#f59e0b' : '#ef4444', borderRadius: '1px' }} />
                    </div>
                  )}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                style={{
                  ...styles.submitBtn,
                  ...(isLoading || isSuccess ? styles.submitBtnDisabled : {}),
                }}
                disabled={isLoading || isSuccess}
                onMouseEnter={(e) => {
                  if (!isLoading && !isSuccess) {
                    (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading && !isSuccess) {
                    (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                  }
                }}
              >
                {isLoading ? (
                  <>
                    <SpinnerIcon />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div style={styles.divider}>
              <div style={styles.dividerLine} />
              <span style={styles.dividerText}>Team Access</span>
              <div style={styles.dividerLine} />
            </div>

            {/* Help text */}
            <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
              Not a team member?{' '}
              <Link href="/" style={styles.backLinkText}>
                Submit a project brief instead
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}