// src/app/dashboard/page.tsx
// Kanban board - pipeline view with drag-and-drop
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type BriefStage = 'NEW' | 'UNDER_REVIEW' | 'PROPOSAL_SENT' | 'WON' | 'ARCHIVED';

interface Brief {
  id: string;
  title: string;
  contactName: string;
  companyName: string | null;
  stage: BriefStage;
  budgetRange: string;
  urgency: string;
  source: string;
  createdAt: string;
  aiAnalysis: {
    complexityScore: number;
    category: string;
    status: string;
  } | null;
}

const COLUMNS: { id: BriefStage; title: string }[] = [
  { id: 'NEW', title: 'New' },
  { id: 'UNDER_REVIEW', title: 'Under Review' },
  { id: 'PROPOSAL_SENT', title: 'Proposal Sent' },
  { id: 'WON', title: 'Won' },
  { id: 'ARCHIVED', title: 'Archived' },
];

const BUDGET_LABELS: Record<string, string> = {
  UNDER_5K: '< $5K',
  FIVE_TO_10K: '$5K-10K',
  TEN_TO_25K: '$10K-25K',
  TWENTY_FIVE_TO_50K: '$25K-50K',
  FIFTY_TO_100K: '$50K-100K',
  OVER_100K: '> $100K',
};

const STAGE_BADGE_STYLES: Record<BriefStage, React.CSSProperties> = {
  NEW: { background: '#dbeafe', color: '#1e40af' },
  UNDER_REVIEW: { background: '#fef3c7', color: '#92400e' },
  PROPOSAL_SENT: { background: '#e0e7ff', color: '#3730a3' },
  WON: { background: '#d1fae5', color: '#065f46' },
  ARCHIVED: { background: '#f3f4f6', color: '#4b5563' },
};

const COLUMN_COLORS: Record<BriefStage, string> = {
  NEW: '#9ca3af',
  UNDER_REVIEW: '#f59e0b',
  PROPOSAL_SENT: '#6366f1',
  WON: '#10b981',
  ARCHIVED: '#6b7280',
};

export default function DashboardPage() {
  const router = useRouter();
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<BriefStage | null>(null);
  const [optimisticStage, setOptimisticStage] = useState<Record<string, BriefStage>>({});
  const [refreshing, setRefreshing] = useState(false);

  const fetchBriefs = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      else setRefreshing(true);
      
      const res = await fetch('/api/dashboard/briefs?limit=50');
      const json = await res.json();
      
      if (!res.ok) {
        if (json?.error === 'UNAUTHENTICATED') {
          router.push('/login');
          return;
        }
        setError(json?.message || 'Failed to load briefs');
        return;
      }

      const briefsData = json?.data?.briefs || json?.briefs || [];
      setBriefs(briefsData);
    } catch {
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    fetchBriefs();
  }, [fetchBriefs]);

  function handleDragStart(_e: React.DragEvent, briefId: string) {
    setDraggedId(briefId);
  }

  function handleDragEnter(_e: React.DragEvent, colId: BriefStage) {
    setDragOverCol(colId);
  }

  function handleDragLeave(_e: React.DragEvent) {
    setDragOverCol(null);
  }

  function handleDragEnd() {
    setDraggedId(null);
    setDragOverCol(null);
  }

  async function handleDrop(e: React.DragEvent, toStage: BriefStage) {
    e.preventDefault();
    const briefId = draggedId;
    setDraggedId(null);
    setDragOverCol(null);
    
    if (!briefId) return;
    
    const brief = briefs.find(b => b.id === briefId);
    if (!brief || brief.stage === toStage) return;

    // Optimistic update
    setOptimisticStage(prev => ({ ...prev, [briefId]: toStage }));

    try {
      const res = await fetch(`/api/dashboard/briefs/${briefId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toStage, reason: 'Kanban drag-and-drop' }),
      });

      if (!res.ok) {
        setOptimisticStage(prev => {
          const next = { ...prev };
          delete next[briefId];
          return next;
        });
      }
      fetchBriefs(false);
    } catch {
      setOptimisticStage(prev => {
        const next = { ...prev };
        delete next[briefId];
        return next;
      });
    }
  }

  const groupedBriefs: Record<BriefStage, Brief[]> = {
    NEW: [],
    UNDER_REVIEW: [],
    PROPOSAL_SENT: [],
    WON: [],
    ARCHIVED: [],
  };

  briefs.forEach(brief => {
    const stage = (optimisticStage[brief.id] || brief.stage) as BriefStage;
    groupedBriefs[stage].push({ ...brief, stage });
  });

  // Styles
  const s = {
    container: { height: '100%', padding: '16px', overflowX: 'auto' as const },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', padding: '0 8px' },
    headerLeft: {},
    headerTitle: { fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 },
    headerCount: { fontSize: '14px', color: '#6b7280', marginTop: '2px', marginBottom: 0 },
    refreshBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '13px', fontWeight: 500, color: '#374151', cursor: refreshing ? 'not-allowed' : 'pointer', opacity: refreshing ? 0.6 : 1 },
    columnsWrap: { display: 'flex', gap: '16px', minWidth: 'max-content', paddingBottom: '16px' },
    column: (colId: BriefStage): React.CSSProperties => ({
      width: '288px',
      flexShrink: 0,
      background: dragOverCol === colId ? '#eff6ff' : '#f9fafb',
      borderRadius: '10px',
      border: dragOverCol === colId ? '2px solid #3b82f6' : '1px solid #e5e7eb',
      transition: 'all 0.15s ease',
    }),
    colHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #e5e7eb' },
    colTitle: { display: 'flex', alignItems: 'center', gap: '8px' },
    colDot: (color: string): React.CSSProperties => ({ width: '8px', height: '8px', borderRadius: '9999px', background: color }),
    colName: { fontWeight: 600, color: '#111827', fontSize: '14px' },
    colCount: { fontSize: '12px', color: '#6b7280', background: '#e5e7eb', padding: '2px 8px', borderRadius: '9999px' },
    cardsWrap: { padding: '12px', display: 'flex', flexDirection: 'column' as const, gap: '12px', minHeight: '200px' },
    dropHint: { fontSize: '12px', color: '#9ca3af', textAlign: 'center' as const, padding: '32px 0' },
    card: (isDragged: boolean): React.CSSProperties => ({
      background: '#fff',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      padding: '12px',
      cursor: 'grab',
      opacity: isDragged ? 0.5 : 1,
      boxShadow: isDragged ? '0 0 0 2px #60a5fa' : '0 1px 2px rgba(0,0,0,0.04)',
      transition: 'all 0.15s ease',
    }),
    cardTitle: { fontSize: '13px', fontWeight: 500, color: '#111827', marginBottom: '8px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' },
    cardMeta: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#6b7280', marginBottom: '8px' },
    badge: (stage: BriefStage): React.CSSProperties => ({
      ...STAGE_BADGE_STYLES[stage],
      fontSize: '9px',
      fontWeight: 600,
      padding: '2px 6px',
      borderRadius: '3px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
    }),
    analysisWrap: { display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '8px', borderTop: '1px solid #f3f4f6' },
    analysisLabel: { fontSize: '10px', color: '#9ca3af' },
    complexityDots: { display: 'flex', gap: '2px' },
    dot: (filled: boolean): React.CSSProperties => ({ width: '8px', height: '8px', borderRadius: '9999px', background: filled ? '#3b82f6' : '#e5e7eb' }),
    category: { fontSize: '10px', color: '#9ca3af' },
    cardDate: { marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f3f4f6', fontSize: '11px', color: '#9ca3af' },
    loadingWrap: { padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' },
    loadingInner: { textAlign: 'center' as const },
    errorWrap: { padding: '24px' },
    errorCard: { maxWidth: '448px', margin: '0 auto', textAlign: 'center' as const, padding: '32px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #fecaca' },
    errorText: { color: '#dc2626', marginBottom: '16px' },
    retryBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '13px', fontWeight: 500, color: '#374151', cursor: 'pointer' },
  };

  if (isLoading) {
    return (
      <div style={s.loadingWrap}>
        <div style={s.loadingInner}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto', animation: 'spin 1s linear infinite' }}>
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
            <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="#3b82f6" fillOpacity="0.75" />
          </svg>
          <p style={{ marginTop: '16px', color: '#6b7280', fontSize: '14px' }}>Loading pipeline...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={s.errorWrap}>
        <div style={s.errorCard}>
          <p style={{ ...s.errorText, marginBottom: '16px' }}>{error}</p>
          <button style={s.retryBtn} onClick={() => fetchBriefs()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.container}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <h2 style={s.headerTitle}>Pipeline</h2>
          <p style={s.headerCount}>{briefs.length} total briefs</p>
        </div>
        <button
          style={s.refreshBtn}
          onClick={() => fetchBriefs(false)}
          disabled={refreshing}
        >
          {refreshing ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'block', animation: 'spin 1s linear infinite' }}>
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" fillOpacity="0.75" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
            </svg>
          )}
          Refresh
        </button>
      </div>

      {/* Kanban Columns */}
      <div style={s.columnsWrap}>
        {COLUMNS.map(column => {
          const columnBriefs = groupedBriefs[column.id];
          const isOver = dragOverCol === column.id;
          
          return (
            <div
              key={column.id}
              style={s.column(column.id)}
              onDragEnter={(e) => handleDragEnter(e, column.id)}
              onDragLeave={handleDragLeave}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div style={s.colHeader}>
                <div style={s.colTitle}>
                  <span style={s.colDot(COLUMN_COLORS[column.id])} />
                  <span style={s.colName}>{column.title}</span>
                </div>
                <span style={s.colCount}>{columnBriefs.length}</span>
              </div>

              {/* Cards */}
              <div style={s.cardsWrap}>
                {columnBriefs.length === 0 ? (
                  <p style={s.dropHint}>{isOver ? 'Drop here' : 'Drop briefs here'}</p>
                ) : (
                  columnBriefs.map(brief => (
                    <div
                      key={brief.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, brief.id)}
                      onDragEnd={handleDragEnd}
                      style={s.card(draggedId === brief.id)}
                      onClick={() => router.push(`/dashboard/briefs/${brief.id}`)}
                    >
                      <h4 style={s.cardTitle}>{brief.title}</h4>
                      
                      <div style={s.cardMeta}>
                        <span>{brief.contactName}</span>
                        <span style={s.badge(brief.stage)}>
                          {BUDGET_LABELS[brief.budgetRange] || brief.budgetRange}
                        </span>
                      </div>

                      {brief.aiAnalysis && (
                        <div style={s.analysisWrap}>
                          <div style={s.complexityDots}>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div
                                key={i}
                                style={s.dot(i < brief.aiAnalysis!.complexityScore)}
                              />
                            ))}
                          </div>
                          {brief.aiAnalysis.category && (
                            <span style={s.category}>
                              {brief.aiAnalysis.category.replace('_', ' & ')}
                            </span>
                          )}
                        </div>
                      )}

                      <div style={s.cardDate}>
                        {new Date(brief.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}