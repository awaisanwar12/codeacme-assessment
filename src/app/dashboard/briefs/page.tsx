// src/app/dashboard/briefs/page.tsx
// All briefs listing with improved table view
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type BriefStage = 'NEW' | 'UNDER_REVIEW' | 'PROPOSAL_SENT' | 'WON' | 'ARCHIVED';

interface Brief {
  id: string;
  title: string;
  contactName: string;
  companyName: string | null;
  budgetRange: string;
  urgency: string;
  source: string;
  stage: BriefStage;
  createdAt: string;
  aiAnalysis: {
    complexityScore: number;
    category: string;
    estimatedHoursMin: number | null;
    estimatedHoursMax: number | null;
  } | null;
}

const STAGE_LABELS: Record<BriefStage, string> = {
  NEW: 'New', UNDER_REVIEW: 'Under Review', PROPOSAL_SENT: 'Proposal Sent', WON: 'Won', ARCHIVED: 'Archived',
};

const STAGE_STYLES: Record<BriefStage, { bg: string; fg: string }> = {
  NEW: { bg: '#dbeafe', fg: '#1e40af' },
  UNDER_REVIEW: { bg: '#fef3c7', fg: '#92400e' },
  PROPOSAL_SENT: { bg: '#e0e7ff', fg: '#3730a3' },
  WON: { bg: '#d1fae5', fg: '#065f46' },
  ARCHIVED: { bg: '#f3f4f6', fg: '#4b5563' },
};

const CATEGORY_LABELS: Record<string, string> = {
  WEB_APP: 'Web App', MOBILE: 'Mobile', AI_ML: 'AI / ML', AUTOMATION: 'Automation', INTEGRATION: 'Integration',
};

const BUDGET_LABELS: Record<string, string> = {
  UNDER_5K: '< $5K', FIVE_TO_10K: '$5K-10K', TEN_TO_25K: '$10K-25K',
  TWENTY_FIVE_TO_50K: '$25K-50K', FIFTY_TO_100K: '$50K-100K', OVER_100K: '> $100K',
};

const s = {
  page: { maxWidth: '1200px', margin: '0 auto', padding: '24px' },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap' as const, gap: '12px' },
  title: { fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 },
  count: { fontSize: '14px', color: '#6b7280', marginTop: '2px' },
  filters: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px', background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '16px' },
  searchInput: { flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', boxSizing: 'border-box' as const, background: '#f9fafb' },
  select: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', background: '#f9fafb', color: '#374151', minWidth: '160px' },
  table: { background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', overflow: 'hidden' },
  tableHead: { background: '#f9fafb' },
  th: { textAlign: 'left' as const, padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f3f4f6' },
  row: (hover: boolean): React.CSSProperties => ({ cursor: hover ? 'pointer' : 'default', transition: 'background-color 0.15s' }),
  titleText: { fontWeight: 500, color: '#111827' },
  stageBadge: (stage: BriefStage): React.CSSProperties => ({ display: 'inline-block', background: STAGE_STYLES[stage].bg, color: STAGE_STYLES[stage].fg, fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '9999px' }),
  complexityDots: { display: 'flex', gap: '3px', alignItems: 'center' },
  dot: (filled: boolean): React.CSSProperties => ({ width: '8px', height: '8px', borderRadius: '9999px', background: filled ? '#3b82f6' : '#e5e7eb' }),
  date: { fontSize: '13px', color: '#6b7280' },
  footer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderTop: '1px solid #f3f4f6' },
  loadMoreBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '13px', fontWeight: 500, color: '#374151', cursor: 'pointer' },
  emptyState: { textAlign: 'center' as const, padding: '48px 24px', background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb' },
  loadingWrap: { padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' },
  loadingInner: { textAlign: 'center' as const },
};

export default function AllBriefsPage() {
  const router = useRouter();
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<BriefStage | 'ALL'>('ALL');
  const [hasNextPage, setHasNextPage] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const fetchBriefs = useCallback(async (loadCursor: string | null = null, append = false) => {
    try {
      setIsLoading(!append);
      const res = await fetch(`/api/dashboard/briefs?limit=50${loadCursor ? `&cursor=${loadCursor}` : ''}`);
      const json = await res.json();
      if (!res.ok) { setError(json?.message || 'Failed'); return; }
      const result = json?.data || json;
      const newBriefs = result?.briefs || [];
      setHasNextPage(result?.pagination?.hasNext || false);
      setCursor(result?.pagination?.nextCursor || null);
      setBriefs(prev => append ? [...prev, ...newBriefs] : newBriefs);
    } catch { setError('Failed to connect'); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchBriefs(); }, [fetchBriefs]);

  const filtered = briefs.filter(b => {
    const search = searchTerm === '' || b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const stage = stageFilter === 'ALL' || b.stage === stageFilter;
    return search && stage;
  });

  if (isLoading && briefs.length === 0) return <div style={s.loadingWrap}><div style={s.loadingInner}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" style={{ display: 'block', margin: '0 auto', animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="#3b82f6" fillOpacity="0.75" /></svg><p style={{ marginTop: '16px', color: '#6b7280' }}>Loading briefs...</p></div></div>;

  return (
    <div style={s.page}>
      {/* Top Bar */}
      <div style={s.topBar}>
        <div>
        <h2 style={s.title}>All Briefs</h2>
        <p style={s.count}>{filtered.length} briefs found</p>
        </div>
        {hasNextPage && (
          <button style={s.loadMoreBtn} onClick={() => fetchBriefs(cursor, true)} disabled={isLoading}>
            {isLoading ? 'Loading...' : `Load More (${briefs.length} loaded)`}
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={s.filters}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input type="text" style={{ ...s.searchInput, flex: '1', minWidth: '200px' }} placeholder="Search by title, contact, or company..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <select style={s.select} value={stageFilter} onChange={(e) => setStageFilter(e.target.value as BriefStage | 'ALL')}>
            <option value="ALL">All Stages</option>
            <option value="NEW">New</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="PROPOSAL_SENT">Proposal Sent</option>
            <option value="WON">Won</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ ...s.emptyState, borderColor: '#fecaca', background: '#fef2f2' }}>
          <p style={{ color: '#dc2626' }}>{error}</p>
          <button style={s.loadMoreBtn} onClick={() => fetchBriefs()}>Retry</button>
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && !error && (
        <div style={s.table}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={s.tableHead}>
              <tr>
                <th style={s.th}>Title</th>
                <th style={{ ...s.th, minWidth: '120px' }}>Contact</th>
                <th style={{ ...s.th, minWidth: '100px' }}>Budget</th>
                <th style={{ ...s.th, minWidth: '110px' }}>Category</th>
                <th style={{ ...s.th, textAlign: 'center', minWidth: '120px' }}>Stage</th>
                <th style={{ ...s.th, textAlign: 'center', minWidth: '70px' }}>Complexity</th>
                <th style={{ ...s.th, textAlign: 'right', minWidth: '90px' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(brief => (
                <tr key={brief.id} style={s.row(hoveredRow === brief.id)}
                    onMouseEnter={() => setHoveredRow(brief.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    onClick={() => router.push(`/dashboard/briefs/${brief.id}`)}
                    onDoubleClick={() => router.push(`/dashboard/briefs/${brief.id}`)}>
                  <td style={{ ...s.td, background: hoveredRow === brief.id ? '#f9fafb' : 'transparent' }}>
                    <span style={s.titleText}>{brief.title}</span>
                  </td>
                  <td style={{ ...s.td, color: '#4b5563', background: hoveredRow === brief.id ? '#f9fafb' : 'transparent' }}>{brief.contactName}</td>
                  <td style={{ ...s.td, color: '#4b5563', fontSize: '13px', background: hoveredRow === brief.id ? '#f9fafb' : 'transparent' }}>{BUDGET_LABELS[brief.budgetRange] || brief.budgetRange}</td>
                  <td style={{ ...s.td, fontSize: '13px', color: '#6b7280', background: hoveredRow === brief.id ? '#f9fafb' : 'transparent' }}>
                    {brief.aiAnalysis?.category ? CATEGORY_LABELS[brief.aiAnalysis.category] || brief.aiAnalysis.category : '—'}
                  </td>
                  <td style={{ ...s.td, textAlign: 'center', background: hoveredRow === brief.id ? '#f9fafb' : 'transparent' }}>
                    <span style={s.stageBadge(brief.stage)}>{STAGE_LABELS[brief.stage]}</span>
                  </td>
                  <td style={{ ...s.td, textAlign: 'center', background: hoveredRow === brief.id ? '#f9fafb' : 'transparent' }}>
                    {brief.aiAnalysis ? (
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <div style={s.complexityDots}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} style={s.dot(i < brief.aiAnalysis!.complexityScore)} />
                          ))}
                        </div>
                      </div>
                    ) : <span style={{ color: '#9ca3af' }}>—</span>}
                  </td>
                  <td style={{ ...s.td, textAlign: 'right', background: hoveredRow === brief.id ? '#f9fafb' : 'transparent' }}>
                    <span style={s.date}>{new Date(brief.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Footer */}
          <div style={s.footer}>
            <span style={{ fontSize: '13px', color: '#9ca3af' }}>Showing {filtered.length} briefs</span>
            {hasNextPage && (
              <button style={s.loadMoreBtn} onClick={() => fetchBriefs(cursor, true)} disabled={isLoading}>
                Load More
              </button>
            )}
          </div>
        </div>
      )}

      {/* Empty */}
      {filtered.length === 0 && !isLoading && !error && (
        <div style={s.emptyState}>
          <p style={{ color: '#6b7280' }}>No briefs found</p>
        </div>
      )}
    </div>
  );
}