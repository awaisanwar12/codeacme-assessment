// src/app/dashboard/analytics/page.tsx
// Analytics dashboard with Recharts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, Area, AreaChart, ReferenceLine, Legend,
} from 'recharts';

interface AnalyticsData {
  totalBriefs: number;
  stageDistribution: { stage: string; count: number }[];
  categoryDistribution: { category: string; count: number }[];
  conversionRate: { won: number; total: number; rate: number };
  estimatedPipeline: { min: number; max: number };
  avgComplexityOverTime?: { date: string; complexity: number }[];
}

const STAGE_LABELS: Record<string, string> = {
  NEW: 'New', UNDER_REVIEW: 'Under Review', PROPOSAL_SENT: 'Proposal Sent', WON: 'Won', ARCHIVED: 'Archived',
};
const STAGE_COLORS: Record<string, string> = {
  NEW: '#9ca3af', UNDER_REVIEW: '#f59e0b', PROPOSAL_SENT: '#6366f1', WON: '#10b981', ARCHIVED: '#6b7280',
};
const CATEGORY_COLORS: Record<string, string> = {
  WEB_APP: '#3b82f6', MOBILE: '#8b5cf6', AI_ML: '#06b6d4', AUTOMATION: '#f59e0b', INTEGRATION: '#10b981',
  ECOMMERCE: '#ef4444', CMS: '#ec4899', OTHER: '#6b7280',
};

const s = {
  page: { maxWidth: '1200px', margin: '0 auto', padding: '24px' },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' },
  title: { fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 },
  subtitle: { fontSize: '14px', color: '#6b7280', marginTop: '4px' },
  refreshBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '13px', fontWeight: 500, color: '#374151', cursor: 'pointer' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' },
  statCard: { background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '20px 20px 20px 60px', position: 'relative' as const, overflow: 'hidden' },
  statIcon: { position: 'absolute' as const, left: '18px', top: '18px', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: '13px', fontWeight: 500, color: '#6b7280', marginBottom: '4px' },
  statValue: { fontSize: '28px', fontWeight: 700, color: '#111827' },
  statSub: { fontSize: '12px', color: '#9ca3af', marginTop: '4px' },
  chartRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '20px', marginBottom: '24px' },
  chartCard: { background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '24px' },
  chartTitle: { fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '16px' },
  chartContainer: { width: '100%', height: '280px' },
  tableCard: { background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '24px' },
  tableTitle: { fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '16px' },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { textAlign: 'left' as const, padding: '10px 12px', fontSize: '12px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' },
  td: { padding: '12px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f3f4f6' },
  dot: (color: string): React.CSSProperties => ({ width: '10px', height: '10px', borderRadius: '9999px', background: color, display: 'inline-block', marginRight: '8px' }),
  loadingWrap: { padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' },
  loadingInner: { textAlign: 'center' as const },
  errorWrap: { padding: '24px' },
  errorCard: { maxWidth: '400px', margin: '0 auto', textAlign: 'center' as const, padding: '32px', background: '#fff', borderRadius: '8px', border: '1px solid #fecaca' },
  retryBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '13px', fontWeight: 500, color: '#374151', cursor: 'pointer' },
};

const ICONS = {
  briefs: { bg: '#dbeafe', fg: '#3b82f6' },
  conversion: { bg: '#ecfdf5', fg: '#10b981' },
  won: { bg: '#fef3c7', fg: '#f59e0b' },
  pipeline: { bg: '#e0e7ff', fg: '#6366f1' },
};

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/analytics');
      const json = await res.json();
      if (!res.ok) { if (json?.error === 'UNAUTHENTICATED') router.push('/login'); else setError(json?.message || 'Failed'); return; }
      setData(json?.data || json);
    } catch { setError('Failed to connect'); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div style={s.loadingWrap}><div style={s.loadingInner}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" style={{ display: 'block', margin: '0 auto', animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="#3b82f6" fillOpacity="0.75" /></svg><p style={{ marginTop: '16px', color: '#6b7280' }}>Loading analytics...</p></div></div>;
  if (error || !data) return <div style={s.errorWrap}><div style={s.errorCard}><p style={{ color: '#dc2626', marginBottom: '16px' }}>{error || 'Unavailable'}</p><button style={s.retryBtn} onClick={fetchData}>Retry</button></div></div>;

  const stageData = data.stageDistribution.map((d: { stage: string; count: number }) => ({
    name: STAGE_LABELS[d.stage] || d.stage,
    value: d.count,
    fill: STAGE_COLORS[d.stage] || '#9ca3af',
  }));

  const categoryData = data.categoryDistribution.map((d: { category: string; count: number }) => ({
    name: d.category.replace('_', '/'),
    value: d.count,
    fill: CATEGORY_COLORS[d.category] || '#6b7280',
  }));

  // Format complexity data for display
  const complexityData = (data.avgComplexityOverTime || []).map((d: { date: string; complexity: number }) => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    complexity: d.complexity,
  }));

  const STAGE_KEYS = ['NEW', 'UNDER_REVIEW', 'PROPOSAL_SENT', 'WON', 'ARCHIVED'];
  const total = data.totalBriefs || 0;
  const convRate = data.conversionRate?.rate || 0;

  return (
    <div style={s.page}>
      {/* Top Bar */}
      <div style={s.topBar}>
        <div>
          <h2 style={s.title}>Analytics Dashboard</h2>
          <p style={s.subtitle}>Pipeline overview and performance metrics</p>
        </div>
        <button style={s.refreshBtn} onClick={fetchData}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" /></svg>
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div style={s.statsGrid}>
        <div style={s.statCard}>
          <div style={{ ...s.statIcon, background: ICONS.briefs.bg, color: ICONS.briefs.fg }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
          </div>
          <p style={s.statLabel}>Total Briefs</p>
          <p style={s.statValue}>{total}</p>
        </div>
        <div style={s.statCard}>
          <div style={{ ...s.statIcon, background: ICONS.conversion.bg, color: ICONS.conversion.fg }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
          </div>
          <p style={s.statLabel}>Conversion Rate</p>
          <p style={s.statValue}>{convRate.toFixed(1)}%</p>
        </div>
        <div style={s.statCard}>
          <div style={{ ...s.statIcon, background: ICONS.won.bg, color: ICONS.won.fg }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></svg>
          </div>
          <p style={s.statLabel}>Won Briefs</p>
          <p style={s.statValue}>{data.conversionRate?.won || 0}</p>
        </div>
        <div style={s.statCard}>
          <div style={{ ...s.statIcon, background: ICONS.pipeline.bg, color: ICONS.pipeline.fg }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
          </div>
          <p style={s.statLabel}>Pipeline Value</p>
          <p style={s.statValue}>${Math.max(0, data.estimatedPipeline?.min || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div style={s.chartRow}>
        {/* Briefs by Stage - Bar Chart */}
        <div style={s.chartCard}>
          <h3 style={s.chartTitle}>Briefs by Stage</h3>
          <div style={s.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {stageData.map((entry: { fill: string }, i: number) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Projects by Category - Bar Chart */}
        <div style={s.chartCard}>
          <h3 style={s.chartTitle}>Top Project Categories</h3>
          <div style={s.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {categoryData.map((entry: { fill: string }, i: number) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Avg Complexity Over Time - Area Chart */}
      <div style={{ ...s.chartCard, marginBottom: '24px' }}>
        <h3 style={s.chartTitle}>Average AI Complexity Score (Last 30 Days)</h3>
        <div style={{ height: '220px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={complexityData.length > 0 ? complexityData : [{ date: 'No data', complexity: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 5]} allowDecimals tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
              <Area type="monotone" dataKey="complexity" stroke="#6366f1" fill="url(#complexityGrad)" strokeWidth={2} />
              <ReferenceLine y={3} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Medium', position: 'right', fontSize: 10, fill: '#f59e0b' }} />
              <defs>
                <linearGradient id="complexityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stage Breakdown Table */}
      <div style={s.tableCard}>
        <h3 style={s.tableTitle}>Stage Breakdown</h3>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Stage</th>
              <th style={{ ...s.th, textAlign: 'center' }}>Count</th>
              <th style={{ ...s.th, textAlign: 'right' }}>Percentage</th>
              <th style={{ ...s.th, textAlign: 'right' }}>Distribution</th>
            </tr>
          </thead>
          <tbody>
            {STAGE_KEYS.map(stage => {
              const count = data.stageDistribution?.find((d: { stage: string; count: number }) => d.stage === stage)?.count || 0;
              const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
              return (
                <tr key={stage}>
                  <td style={s.td}>
                    <span style={s.dot(STAGE_COLORS[stage])} />
                    <span style={{ fontWeight: 500 }}>{STAGE_LABELS[stage]}</span>
                  </td>
                  <td style={{ ...s.td, textAlign: 'center', fontWeight: 600 }}>{count}</td>
                  <td style={{ ...s.td, textAlign: 'right' }}>{pct}%</td>
                  <td style={{ ...s.td, textAlign: 'right', paddingRight: '24px' }}>
                    <div style={{ display: 'inline-block', width: '120px', height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: STAGE_COLORS[stage], borderRadius: '4px' }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}