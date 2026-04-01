// src/app/dashboard/page.tsx
// Kanban board - pipeline view with drag-and-drop
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Types
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

interface Column {
  id: BriefStage;
  title: string;
  badge: string;
}

const COLUMNS: Column[] = [
  { id: 'NEW', title: 'New', badge: 'badge--new' },
  { id: 'UNDER_REVIEW', title: 'Under Review', badge: 'badge--review' },
  { id: 'PROPOSAL_SENT', title: 'Proposal Sent', badge: 'badge--proposal' },
  { id: 'WON', title: 'Won', badge: 'badge--won' },
  { id: 'ARCHIVED', title: 'Archived', badge: 'badge--archived' },
];

const BUDGET_LABELS: Record<string, string> = {
  UNDER_5K: '< $5K',
  FIVE_TO_10K: '$5K-10K',
  TEN_TO_25K: '$10K-25K',
  TWENTY_FIVE_TO_50K: '$25K-50K',
  FIFTY_TO_100K: '$50K-100K',
  OVER_100K: '> $100K',
};

const STAGE_ORDER: BriefStage[] = ['NEW', 'UNDER_REVIEW', 'PROPOSAL_SENT', 'WON', 'ARCHIVED'];

export default function DashboardPage() {
  const router = useRouter();
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [optimisticStage, setOptimisticStage] = useState<Record<string, BriefStage>>({});
  const [refreshing, setRefreshing] = useState(false);

  // Fetch briefs
  const fetchBriefs = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      else setRefreshing(true);
      
      const res = await fetch('/api/dashboard/briefs?limit=50');
      const data = await res.json();
      
      if (!res.ok) {
        if (data?.error === 'UNAUTHENTICATED') {
          router.push('/login');
          return;
        }
        setError(data?.message || 'Failed to load briefs');
        return;
      }

      setBriefs(data.data?.briefs || []);
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    fetchBriefs();
  }, [fetchBriefs]);

  // Drag handlers
  function handleDragStart(e: React.DragEvent, briefId: string) {
    setDraggedId(briefId);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  async function handleDrop(e: React.DragEvent, toStage: BriefStage) {
    e.preventDefault();
    const briefId = draggedId;
    setDraggedId(null);
    
    if (!briefId) return;
    
    const brief = briefs.find(b => b.id === briefId);
    if (!brief || brief.stage === toStage) return;

    const prevStage = brief.stage;

    // Optimistic update
    setOptimisticStage(prev => ({ ...prev, [briefId]: toStage }));

    try {
      const res = await fetch(`/api/dashboard/briefs/${briefId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toStage, reason: 'Kanban drag-and-drop' }),
      });

      if (!res.ok) {
        // Revert optimistic update
        setOptimisticStage(prev => {
          const next = { ...prev };
          delete next[briefId];
          return next;
        });
        fetchBriefs(false); // Re-sync
      } else {
        // Refresh data
        fetchBriefs(false);
      }
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

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 mx-auto text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
          </svg>
          <p className="mt-4 text-gray-500">Loading pipeline...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto text-center p-8 bg-white rounded-lg border border-red-200">
          <p className="text-red-600 mb-4">{error}</p>
          <button className="btn btn--outline" onClick={() => fetchBriefs()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-4 overflow-x-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pipeline</h2>
          <p className="text-sm text-gray-500">{briefs.length} total briefs</p>
        </div>
        <button
          className="btn btn--outline btn--sm flex items-center gap-2"
          onClick={() => fetchBriefs(false)}
          disabled={refreshing}
        >
          {refreshing ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          Refresh
        </button>
      </div>

      {/* Kanban Columns */}
      <div className="flex gap-4 min-w-max pb-4">
        {COLUMNS.map(column => {
          const columnBriefs = groupedBriefs[column.id];
          
          return (
            <div
              key={column.id}
              className="w-72 flex-shrink-0 bg-gray-50 rounded-lg border border-gray-200"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{column.title}</h3>
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                    {columnBriefs.length}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div className="p-3 space-y-3 min-h-[200px]">
                {columnBriefs.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-8">Drop briefs here</p>
                ) : (
                  columnBriefs.map(brief => (
                    <div
                      key={brief.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, brief.id)}
                      className={`bg-white rounded-lg border p-3 cursor-move transition-shadow hover:shadow-md ${
                        draggedId === brief.id ? 'opacity-50 ring-2 ring-blue-400' : ''
                      }`}
                      onClick={() => router.push(`/dashboard/briefs/${brief.id}`)}
                    >
                      <h4 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">
                        {brief.title}
                      </h4>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <span>{brief.contactName}</span>
                        <span className={`badge ${
                          column.badge
                        } text-[10px] py-0.5`}>
                          {BUDGET_LABELS[brief.budgetRange] || brief.budgetRange}
                        </span>
                      </div>

                      {brief.aiAnalysis && (
                        <div className="flex items-center gap-2 pt-2 border-top border-gray-100">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-400">Complexity:</span>
                            <div className="flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-2 h-2 rounded-full ${
                                    i < brief.aiAnalysis!.complexityScore
                                      ? 'bg-blue-500'
                                      : 'bg-gray-200'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          {brief.aiAnalysis.category && (
                            <span className="text-xs text-gray-400 truncate">
                              {brief.aiAnalysis.category.replace('_', ' & ')}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-400">
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