// src/app/page.tsx
// Public landing page with project brief submission form
'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';

const BUDGET_OPTIONS = [
  { value: 'UNDER_5K', label: 'Under $5,000' },
  { value: 'FIVE_TO_10K', label: '$5,000 - $10,000' },
  { value: 'TEN_TO_25K', label: '$10,000 - $25,000' },
  { value: 'TWENTY_FIVE_TO_50K', label: '$25,000 - $50,000' },
  { value: 'FIFTY_TO_100K', label: '$50,000 - $100,000' },
  { value: 'OVER_100K', label: 'Over $100,000' },
];

const URGENCY_OPTIONS = [
  { value: 'LOW', label: 'No rush - flexible timeline' },
  { value: 'MEDIUM', label: 'Standard - 3-6 months' },
  { value: 'HIGH', label: 'Urgent - 1-3 months' },
  { value: 'URGENT', label: 'Critical - ASAP' },
];

const FEATURES = [
  { icon: '⚡', title: 'Instant AI Analysis', desc: 'Your brief is analyzed within minutes' },
  { icon: '🔒', title: 'Secure & Confidential', desc: 'Your project details stay private' },
  { icon: '📊', title: 'Cost Estimation', desc: 'Accurate effort and budget ranges' },
  { icon: '💡', title: 'Tech Stack Suggestions', desc: 'Modern technology recommendations' },
];

const inputStyle = (hasError: boolean, focused: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '12px 14px',
  borderRadius: '8px',
  border: `1px solid ${hasError ? '#dc2626' : focused ? '#3b82f6' : '#e5e7eb'}`,
  fontSize: '14px',
  background: focused ? '#fff' : '#f9fafb',
  color: '#111827',
  outline: 'none',
  transition: 'all 0.15s ease',
  boxSizing: 'border-box',
  boxShadow: focused ? '0 0 0 3px rgba(59,130,246,0.1)' : 'none',
  fontFamily: 'inherit',
});

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '13px',
  fontWeight: 600,
  color: '#374151',
};

const errorStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#dc2626',
  marginTop: '4px',
};

const s = {
  root: { minHeight: '100vh', display: 'flex', flexDirection: 'column' as const, background: '#f9fafb' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: '#fff', borderBottom: '1px solid #e5e7eb' },
  logo: { display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' },
  logoIcon: { width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: '18px', fontWeight: 700, color: '#111827' },
  loginBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '13px', fontWeight: 500, color: '#374151', textDecoration: 'none', cursor: 'pointer' },
  hero: { textAlign: 'center' as const, padding: '48px 24px', background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)' },
  heroTitle: { fontSize: '36px', fontWeight: 700, color: '#111827', margin: '0 0 12px' },
  heroSub: { fontSize: '16px', color: '#4b5563', margin: '0 0 32px', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 },
  features: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', maxWidth: '700px', margin: '0 auto' },
  feature: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '8px', padding: '16px' },
  featureIcon: { fontSize: '24px' },
  featureTitle: { fontSize: '14px', fontWeight: 600, color: '#111827', margin: 0 },
  featureDesc: { fontSize: '12px', color: '#6b7280', margin: 0 },
  formSection: { padding: '32px 24px', maxWidth: '640px', margin: '0 auto', width: '100%' },
  formCard: { background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  formTitle: { fontSize: '20px', fontWeight: 700, color: '#111827', margin: '0 0 24px' },
  successAlert: { padding: '14px 16px', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', fontSize: '14px', fontWeight: 500, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' },
  errorAlert: { padding: '14px 16px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '14px', marginBottom: '20px' },
  formGroup: { marginBottom: '20px' },
  select: (hasError: boolean, focused: boolean): React.CSSProperties => ({
    ...inputStyle(hasError, focused),
    appearance: 'none' as const,
    cursor: 'pointer',
  }),
  textarea: (hasError: boolean, focused: boolean): React.CSSProperties => ({
    ...inputStyle(hasError, focused),
    minHeight: '120px',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
  }),
  submitBtn: (disabled: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '14px 24px',
    borderRadius: '8px',
    border: 'none',
    background: disabled ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: disabled ? 'none' : '0 4px 12px rgba(59,130,246,0.3)',
  }),
  footer: { marginTop: 'auto', padding: '24px', borderTop: '1px solid #e5e7eb', background: '#fff', textAlign: 'center' as const },
  footerText: { fontSize: '13px', color: '#9ca3af' },
  row: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' },
  halfInput: { flex: 1, minWidth: 0 },
};

const BoltIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

export default function Home() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focused, setFocused] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrors({});
    setErrorMessage('');
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries());
    try {
      const res = await fetch('/api/briefs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const json = await res.json();
      if (!res.ok) {
        if (json.error === 'VALIDATION_ERROR' && json.details) {
          const errs: Record<string, string> = {};
          Object.entries(json.details).forEach(([k, msgs]) => { if (Array.isArray(msgs) && msgs.length) errs[k] = msgs[0] as string; });
          setErrors(errs);
        }
        setErrorMessage(json.message || 'Submission failed.');
        setSubmitStatus('error');
        return;
      }
      setSubmitStatus('success');
      e.currentTarget.reset();
    } catch {
      setErrorMessage('Network error.');
      setSubmitStatus('error');
    } finally { setIsSubmitting(false); }
  }

  return (
    <div style={s.root}>
      {/* Header */}
      <header style={s.header}>
        <Link href="/" style={s.logo}>
          <div style={s.logoIcon}><BoltIcon /></div>
          <span style={s.logoText}>Veloce</span>
        </Link>
        <Link href="/login" style={s.loginBtn}>
          Team Login
          <ArrowIcon />
        </Link>
      </header>

      {/* Hero */}
      <section style={s.hero}>
        <h1 style={s.heroTitle}>Transform Your Project Idea Into Reality</h1>
        <p style={s.heroSub}>Submit your project brief and our AI-powered system will analyze your requirements, estimate costs, and suggest a tech stack — all within minutes.</p>
        <div style={s.features}>
          {FEATURES.map(f => (
            <div key={f.title} style={s.feature}>
              <span style={s.featureIcon}>{f.icon}</span>
              <h3 style={s.featureTitle}>{f.title}</h3>
              <p style={s.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Form */}
      <section style={s.formSection}>
        <div style={s.formCard}>
          <h3 style={s.formTitle}>Submit Your Project Brief</h3>

          {submitStatus === 'success' && (
            <div style={s.successAlert}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              Brief submitted successfully! We'll review and contact you soon.
            </div>
          )}
          {submitStatus === 'error' && (
            <div style={s.errorAlert}>{errorMessage}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Title */}
            <div style={s.formGroup}>
              <label htmlFor="title" style={labelStyle}>Project Title <span style={{ color: '#dc2626' }}>*</span></label>
              <input type="text" id="title" name="title" style={inputStyle(!!errors.title, focused === 'title')} placeholder="e.g., E-commerce Platform Redesign" required minLength={3} onFocus={() => setFocused('title')} onBlur={() => setFocused(null)} />
              {errors.title && <p style={errorStyle}>{errors.title}</p>}
            </div>

            {/* Description */}
            <div style={s.formGroup}>
              <label htmlFor="description" style={labelStyle}>Project Description <span style={{ color: '#dc2626' }}>*</span></label>
              <textarea id="description" name="description" style={s.textarea(!!errors.description, focused === 'description')} placeholder="Describe your project requirements, goals, and any specific features needed..." required minLength={50} onFocus={() => setFocused('description')} onBlur={() => setFocused(null)} />
              {errors.description && <p style={errorStyle}>{errors.description}</p>}
            </div>

            {/* Budget & Urgency */}
            <div style={s.row}>
              <div style={s.formGroup}>
                <label htmlFor="budgetRange" style={labelStyle}>Budget Range <span style={{ color: '#dc2626' }}>*</span></label>
                <select id="budgetRange" name="budgetRange" style={s.select(!!errors.budgetRange, focused === 'budgetRange')} required onFocus={() => setFocused('budgetRange')} onBlur={() => setFocused(null)}>
                  <option value="">Select budget range</option>
                  {BUDGET_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {errors.budgetRange && <p style={errorStyle}>{errors.budgetRange}</p>}
              </div>
              <div style={s.formGroup}>
                <label htmlFor="urgency" style={labelStyle}>Timeline Urgency</label>
                <select id="urgency" name="urgency" style={s.select(false, focused === 'urgency')} onFocus={() => setFocused('urgency')} onBlur={() => setFocused(null)}>
                  {URGENCY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {/* Contact */}
            <div style={s.row}>
              <div style={s.formGroup}>
                <label htmlFor="contactName" style={labelStyle}>Your Name <span style={{ color: '#dc2626' }}>*</span></label>
                <input type="text" id="contactName" name="contactName" style={inputStyle(!!errors.contactName, focused === 'contactName')} placeholder="John Doe" required minLength={2} onFocus={() => setFocused('contactName')} onBlur={() => setFocused(null)} />
                {errors.contactName && <p style={errorStyle}>{errors.contactName}</p>}
              </div>
              <div style={s.formGroup}>
                <label htmlFor="contactEmail" style={labelStyle}>Email <span style={{ color: '#dc2626' }}>*</span></label>
                <input type="email" id="contactEmail" name="contactEmail" style={inputStyle(!!errors.contactEmail, focused === 'contactEmail')} placeholder="john@company.com" required onFocus={() => setFocused('contactEmail')} onBlur={() => setFocused(null)} />
                {errors.contactEmail && <p style={errorStyle}>{errors.contactEmail}</p>}
              </div>
            </div>

            {/* Optional */}
            <div style={s.row}>
              <div style={s.formGroup}>
                <label htmlFor="contactPhone" style={labelStyle}>Phone</label>
                <input type="tel" id="contactPhone" name="contactPhone" style={inputStyle(false, focused === 'contactPhone')} placeholder="+1 (555) 123-4567" onFocus={() => setFocused('contactPhone')} onBlur={() => setFocused(null)} />
              </div>
              <div style={s.formGroup}>
                <label htmlFor="companyName" style={labelStyle}>Company</label>
                <input type="text" id="companyName" name="companyName" style={inputStyle(false, focused === 'companyName')} placeholder="Acme Corp" onFocus={() => setFocused('companyName')} onBlur={() => setFocused(null)} />
              </div>
            </div>

            <button type="submit" style={s.submitBtn(isSubmitting)} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                    <path d="M12 2a10 10 0 1010 10" strokeLinecap="round" />
                  </svg>
                  Analyzing Brief...
                </>
              ) : (
                <>Submit Brief & Get AI Analysis <ArrowIcon /></>
              )}
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer style={s.footer}>
        <p style={s.footerText}>Veloce — AI-Powered Project Brief Analysis & Pipeline Management</p>
      </footer>
    </div>
  );
}