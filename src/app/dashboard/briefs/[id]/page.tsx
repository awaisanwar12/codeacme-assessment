// src/app/dashboard/briefs/[id]/page.tsx
// Brief detail view - AI analysis, notes, stage timeline
'use client';

import { useState, useEffect, FormEvent, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type BriefStage = 'NEW' | 'UNDER_REVIEW' | 'PROPOSAL_SENT' | 'WON' | 'ARCHIVED';
type AIStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

interface AIAnalysis {
  id: string;
  features: string[];
  requirements: string[];
  category: string;
  techStack: string[];
  effortMinHours: number | null;
  effortMaxHours: number | null;
  complexityScore: number;
  confidenceScore: number | null;
  overriddenHours: number | null;
  overrideReason: string | null;
  rawPrompt: string | null;
  rawResponse: string | null;
  status: AIStatus;
  errorMessage: string | null;
  createdAt: string;
}

interface NoteAuthor {
  id: string;
  name: string | null;
  email: string;
}

interface Note {
  id: string;
  content: string;
  createdAt: string;
  author: NoteAuthor;
  parentId?: string | null;
  replies?: Note[];
}

interface StageEvent {
  id: string;
  fromStage: string | null;
  toStage: string;
  reason: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
}

interface Brief {
  id: string;
  title: string;
  description: string;
  contactName: string;
  contactEmail: string;
  companyName: string | null;
  budgetRange: string;
  urgency: string;
  source: string;
  assignedReviewerId: string | null;
  stage: BriefStage;
  createdAt: string;
  updatedAt: string;
  aiAnalysis: AIAnalysis | null;
  notes: Note[];
  stageEvents: StageEvent[];
}

const BUDGET_LABELS: Record<string, string> = {
  UNDER_5K: '< $5K',
  FIVE_TO_10K: '$5K-10K',
  TEN_TO_25K: '$10K-25K',
  TWENTY_FIVE_TO_50K: '$25K-50K',
  FIFTY_TO_100K: '$50K-100K',
  OVER_100K: '> $100K',
};

const STAGE_LABELS: Record<BriefStage, string> = {
  NEW: 'New',
  UNDER_REVIEW: 'Under Review',
  PROPOSAL_SENT: 'Proposal Sent',
  WON: 'Won',
  ARCHIVED: 'Archived',
};

const CATEGORY_LABELS: Record<string, string> = {
  WEB_APP: 'Web Application',
  MOBILE: 'Mobile App',
  AI_ML: 'AI / ML',
  AUTOMATION: 'Automation',
  INTEGRATION: 'Integration',
};

const STAGE_BADGE: Record<BriefStage, { bg: string; fg: string }> = {
  NEW: { bg: '#dbeafe', fg: '#1e40af' },
  UNDER_REVIEW: { bg: '#fef3c7', fg: '#92400e' },
  PROPOSAL_SENT: { bg: '#e0e7ff', fg: '#3730a3' },
  WON: { bg: '#d1fae5', fg: '#065f46' },
  ARCHIVED: { bg: '#f3f4f6', fg: '#4b5563' },
};

// All styles
const s = {
  page: { maxWidth: '1120px', margin: '0 auto', padding: '24px' },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap' as const, gap: '12px' },
  topBarLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  backLink: { display: 'flex', alignItems: 'center', color: '#6b7280', textDecoration: 'none' },
  title: { fontSize: '20px', fontWeight: 700, color: '#111827', margin: 0 },
  subtitle: { fontSize: '13px', color: '#6b7280', marginTop: '2px' },
  badge: (stage: BriefStage): React.CSSProperties => ({ display: 'inline-block', ...STAGE_BADGE[stage], fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }),
  actionsCard: { background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '16px', marginBottom: '24px' },
  actionsTitle: { fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '12px' },
  actionsWrap: { display: 'flex', flexWrap: 'wrap' as const, gap: '8px' },
  actionBtn: (disabled: boolean): React.CSSProperties => ({ display: 'inline-flex', alignItems: 'center', padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '12px', fontWeight: 500, color: '#374151', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }),
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' },
  card: { background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '24px' },
  cardTitle: { fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' },
  dl: { display: 'flex', flexDirection: 'column' as const, gap: '16px' },
  dt: { fontSize: '12px', fontWeight: 500, color: '#6b7280', marginBottom: '2px' },
  dd: { fontSize: '14px', color: '#111827', whiteSpace: 'pre-wrap' as const },
  section: { marginBottom: '16px' },
  sectionLabel: { fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' },
  techTag: { display: 'inline-block', fontSize: '11px', background: '#f3f4f6', color: '#374151', padding: '2px 8px', borderRadius: '4px', marginRight: '4px', marginBottom: '4px' },
  featureLi: { fontSize: '13px', color: '#4b5563', marginBottom: '4px' },
  complexityRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f9fafb', borderRadius: '6px' },
  dot: (filled: boolean): React.CSSProperties => ({ width: '12px', height: '12px', borderRadius: '9999px', background: filled ? '#3b82f6' : '#e5e7eb' }),
  complexityLabel: { fontSize: '14px', fontWeight: 600, color: '#111827' },
  overrideCard: { marginTop: '16px', padding: '12px', background: '#fefce8', borderRadius: '6px', border: '1px solid #fef9c3' },
  overrideText: { fontSize: '13px', fontWeight: 600, color: '#854d0e' },
  overrideReason: { fontSize: '11px', color: '#a16207', marginTop: '4px' },
  editBtn: { fontSize: '13px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: 0 },
  overrideForm: { marginTop: '12px', padding: '16px', borderRadius: '6px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' as const, gap: '10px' },
  input: { width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '14px', boxSizing: 'border-box' as const },
  textarea: { width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical' as const, minHeight: '50px', boxSizing: 'border-box' as const },
  saveBtn: { display: 'inline-flex', alignItems: 'center', padding: '6px 16px', borderRadius: '6px', border: 'none', background: '#3b82f6', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer' },
  timelineItem: { display: 'flex', gap: '12px', padding: '12px', background: '#f9fafb', borderRadius: '6px' },
  dotBlue: { width: '8px', height: '8px', borderRadius: '9999px', background: '#3b82f6', marginTop: '6px', flexShrink: 0 },
  timelineBody: { flex: 1 },
  timelineAction: { fontSize: '13px', color: '#111827' },
  bold: { fontWeight: 600 },
  timelineReason: { fontSize: '11px', color: '#6b7280', marginTop: '4px' },
  timelineBy: { fontSize: '10px', color: '#9ca3af', marginTop: '4px' },
  notesWrap: { maxHeight: '200px', overflowY: 'auto' as const, display: 'flex', flexDirection: 'column' as const, gap: '10px', marginBottom: '16px' },
  noteCard: { padding: '12px', background: '#f9fafb', borderRadius: '6px' },
  noteText: { fontSize: '13px', color: '#111827' },
  noteMeta: { fontSize: '10px', color: '#9ca3af', marginTop: '6px' },
  noteForm: { display: 'flex', gap: '8px' },
  noteInput: { flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '13px', boxSizing: 'border-box' as const },
  addNoteBtn: { padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#3b82f6', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' as const },
  loadingWrap: { padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' },
  loadingInner: { textAlign: 'center' as const },
  errorWrap: { padding: '24px' },
  errorCard: { maxWidth: '400px', margin: '0 auto', textAlign: 'center' as const, padding: '32px', background: '#fff', borderRadius: '8px', border: '1px solid #fecaca' },
  retryBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '13px', fontWeight: 500, color: '#374151', cursor: 'pointer' },
  pending: { textAlign: 'center' as const, padding: '32px' },
  pendingText: { color: '#6b7280' },
  failed: { textAlign: 'center' as const, padding: '32px' },
  failedTitle: { color: '#dc2626', marginBottom: '8px' },
  failedMsg: { fontSize: '13px', color: '#6b7280' },
};

export default function BriefDetailPage() {
  const params = useParams();
  const router = useRouter();
  const briefId = params?.id as string;

  const [brief, setBrief] = useState<Brief | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState<string | null>(null);
  const [showEstimateEdit, setShowEstimateEdit] = useState(false);
  const [overrideEstimation, setOverrideEstimation] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  const fetchBrief = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/dashboard/briefs/${briefId}`);
      const data = await res.json();
      if (!res.ok) {
        if (data?.error === 'UNAUTHENTICATED') { router.push('/login'); return; }
        setError(data?.message || 'Failed to load brief');
        return;
      }
      setBrief(data.data || data);
    } catch {
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  }, [briefId, router]);

  useEffect(() => { fetchBrief(); }, [fetchBrief]);

  async function handleAddNote(e: FormEvent) {
    e.preventDefault();
    if (!noteContent.trim()) return;
    setIsSubmittingNote(true);
    try {
      const res = await fetch(`/api/dashboard/briefs/${briefId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteContent.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data?.message || 'Failed to add note'); return; }
      setNoteContent('');
      fetchBrief();
    } catch { alert('Failed to add note'); }
    finally { setIsSubmittingNote(false); }
  }

  async function handleTransition(toStage: BriefStage) {
    setIsTransitioning(toStage);
    try {
      const res = await fetch(`/api/dashboard/briefs/${briefId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toStage, reason: 'Manual transition from detail view' }),
      });
      if (!res.ok) { alert('Stage transition failed'); return; }
      fetchBrief();
    } catch { alert('Stage transition failed'); }
    finally { setIsTransitioning(null); }
  }

  async function handleEstimateOverride() {
    if (!overrideEstimation || !overrideReason) {
      alert('Please provide both an estimate and a reason'); return;
    }
    try {
      const res = await fetch(`/api/dashboard/briefs/${briefId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overriddenHours: parseFloat(overrideEstimation), overrideReason: overrideReason.trim() }),
      });
      if (!res.ok) { alert('Failed to update estimate'); return; }
      setShowEstimateEdit(false);
      setOverrideEstimation('');
      setOverrideReason('');
      fetchBrief();
    } catch { alert('Failed to update estimate'); }
  }

  const stagesToTransition = (['UNDER_REVIEW', 'PROPOSAL_SENT', 'WON', 'ARCHIVED'] as BriefStage[])
    .filter((stage: BriefStage) => stage !== brief?.stage);

  if (isLoading) {
    return (
      <div style={s.loadingWrap}>
        <div style={s.loadingInner}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" style={{ display: 'block', margin: '0 auto', animation: 'spin 1s linear infinite' }}>
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
            <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="#3b82f6" fillOpacity="0.75" />
          </svg>
          <p style={{ marginTop: '16px', color: '#6b7280', fontSize: '14px' }}>Loading brief details...</p>
        </div>
      </div>
    );
  }

  if (error || !brief) {
    return (
      <div style={s.errorWrap}>
        <div style={s.errorCard}>
          <p style={{ color: '#dc2626', marginBottom: '16px' }}>{error || 'Brief not found'}</p>
          <button style={s.retryBtn} onClick={() => router.push('/dashboard')}>Back to Pipeline</button>
        </div>
      </div>
    );
  }

  const stage = brief.stage;
  const ai = brief.aiAnalysis;
  const isAiComplete = ai && ai.status === 'COMPLETED';

  return (
    <div style={s.page}>
      {/* Top bar */}
      <div style={s.topBar}>
        <div style={s.topBarLeft}>
          <Link href="/dashboard" style={s.backLink}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 19 9 12 15 5" />
            </svg>
          </Link>
          <div>
            <h2 style={s.title}>{brief.title}</h2>
            <p style={s.subtitle}>
              {new Date(brief.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} &middot; {brief.source === 'FORM' ? 'Public Form' : 'Webhook'}
            </p>
          </div>
        </div>
        <span style={s.badge(stage)}>{STAGE_LABELS[stage]}</span>
      </div>

      {/* Quick Actions */}
      <div style={s.actionsCard}>
        <h3 style={s.actionsTitle}>Quick Actions</h3>
        <div style={s.actionsWrap}>
          {stagesToTransition.map((ts: BriefStage) => (
            <button key={ts} style={s.actionBtn(isTransitioning !== null)} onClick={() => handleTransition(ts)} disabled={isTransitioning !== null}>
              {isTransitioning === ts ? 'Moving...' : `Move to ${STAGE_LABELS[ts]}`}
            </button>
          ))}
        </div>
      </div>

      {/* Two-column grid */}
      <div style={s.grid}>
        {/* LEFT COLUMN: Submission + AI Analysis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Original Submission */}
          <div style={s.card}>
            <h3 style={s.cardTitle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
              </svg>
              Original Submission
            </h3>
            <dl style={s.dl}>
              {brief.companyName && (
                <div><dt style={s.dt}>Company</dt><dd style={s.dd}>{brief.companyName}</dd></div>
              )}
              <div><dt style={s.dt}>Contact</dt><dd style={s.dd}>{brief.contactName} ({brief.contactEmail})</dd></div>
              <div><dt style={s.dt}>Budget Range</dt><dd style={s.dd}>{BUDGET_LABELS[brief.budgetRange] || brief.budgetRange}</dd></div>
              <div><dt style={s.dt}>Timeline Urgency</dt><dd style={s.dd}>{brief.urgency}</dd></div>
              <div><dt style={s.dt}>Project Description</dt><dd style={s.dd}>{brief.description}</dd></div>
            </dl>
          </div>

          {/* AI Analysis */}
          <div style={s.card}>
            <h3 style={s.cardTitle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" /><path d="M12 16v-4" /><circle cx="12" cy="8" r="1" fill="#8b5cf6" />
              </svg>
              AI Analysis
            </h3>

            {!ai || ai.status === 'PENDING' ? (
              <div style={s.pending}><p style={s.pendingText}>AI analysis is pending...</p></div>
            ) : ai.status === 'FAILED' ? (
              <div style={s.failed}>
                <p style={s.failedTitle}>AI analysis failed</p>
                {ai.errorMessage && <p style={s.failedMsg}>{ai.errorMessage}</p>}
              </div>
            ) : (
              <>
                {/* Complexity Score */}
                <div style={s.section}>
                  <div style={s.complexityRow}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Complexity Score</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} style={s.dot(i < ai.complexityScore)} />
                      ))}
                      <span style={s.complexityLabel}>{ai.complexityScore}/5</span>
                    </div>
                  </div>
                </div>

                {/* Category */}
                <div style={s.section}>
                  <label style={s.sectionLabel}>Category</label>
                  <p style={s.dd}>{CATEGORY_LABELS[ai.category] || ai.category}</p>
                </div>

                {/* Estimated Hours */}
                <div style={s.section}>
                  <label style={s.sectionLabel}>Estimated Hours</label>
                  <p style={s.dd}>
                    {ai.effortMinHours != null && ai.effortMaxHours != null
                      ? `${ai.effortMinHours} - ${ai.effortMaxHours} hours` : 'N/A'}
                  </p>
                </div>

                {/* Tech Stack */}
                {ai.techStack && ai.techStack.length > 0 && (
                  <div style={s.section}>
                    <label style={s.sectionLabel}>Suggested Tech Stack</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                      {ai.techStack.map((tech: string, i: number) => (
                        <span key={i} style={s.techTag}>{tech}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Features */}
                {ai.features && ai.features.length > 0 && (
                  <div style={s.section}>
                    <label style={s.sectionLabel}>Extracted Features</label>
                    <ul style={{ margin: '8px 0 0', paddingLeft: '18px' }}>
                      {ai.features.map((f: string, i: number) => (
                        <li key={i} style={s.featureLi}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Override */}
                {ai.overriddenHours && (
                  <div style={s.overrideCard}>
                    <p style={s.overrideText}>Custom Estimate Override</p>
                    <p style={s.overrideText}>{ai.overriddenHours} hours</p>
                    <p style={s.overrideReason}>Reason: {ai.overrideReason}</p>
                  </div>
                )}

                <button style={s.editBtn} onClick={() => setShowEstimateEdit(!showEstimateEdit)}>
                  {showEstimateEdit ? 'Cancel Edit' : 'Edit Estimate'}
                </button>

                {showEstimateEdit && (
                  <div style={s.overrideForm}>
                    <input type="number" style={s.input} placeholder="New estimated hours" value={overrideEstimation} onChange={(e) => setOverrideEstimation(e.target.value)} />
                    <textarea style={s.textarea} placeholder="Reason for override" value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} rows={2} />
                    <button style={s.saveBtn} onClick={handleEstimateOverride}>Save Override</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Timeline + Notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Stage Timeline */}
          <div style={s.card}>
            <h3 style={s.cardTitle}>Stage History</h3>
            {brief.stageEvents.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#9ca3af' }}>No stage history yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {brief.stageEvents.map((event: StageEvent) => (
                  <div key={event.id} style={s.timelineItem}>
                    <div style={s.dotBlue} />
                    <div style={s.timelineBody}>
                      <p style={s.timelineAction}>
                        {event.fromStage ? (
                          <>
                            <strong style={s.bold}>{STAGE_LABELS[event.fromStage as BriefStage]}</strong>{' '}
                            <span style={{ color: '#6b7280' }}>&rarr;</span>{' '}
                            <strong style={s.bold}>{STAGE_LABELS[event.toStage as BriefStage]}</strong>
                          </>
                        ) : (
                          <>Created as <strong style={s.bold}>{STAGE_LABELS[event.toStage as BriefStage]}</strong></>
                        )}
                      </p>
                      {event.reason && <p style={s.timelineReason}>{event.reason}</p>}
                      <p style={s.timelineBy}>
                        {new Date(event.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        {' '}by {event.user.name || event.user.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Internal Notes */}
          <div style={s.card}>
            <h3 style={s.cardTitle}>Internal Notes</h3>
            {/* Notes List */}
            <div style={s.notesWrap}>
              {brief.notes.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center' as const }}>No notes yet. Add the first one!</p>
              ) : (
                brief.notes.map((note: Note) => (
                  <div key={note.id} style={s.noteCard}>
                    <p style={s.noteText}>{note.content}</p>
                    <p style={s.noteMeta}>
                      {note.author?.name || note.author?.email || 'Unknown'} &middot;{' '}
                      {new Date(note.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>
                    {note.replies && note.replies.length > 0 && (
                      <div style={{ marginTop: '8px', paddingLeft: '12px', borderLeft: '2px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {note.replies.map((reply: Note) => (
                          <div key={reply.id} style={{ padding: '8px', background: '#f3f4f6', borderRadius: '4px' }}>
                            <p style={{ fontSize: '12px', color: '#374151' }}>{reply.content}</p>
                            <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>
                              {reply.author?.name || reply.author?.email || 'Unknown'} &middot;{' '}
                              {new Date(reply.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Add Note Form */}
            <form onSubmit={handleAddNote} style={s.noteForm}>
              <input
                type="text"
                style={s.noteInput}
                placeholder="Add a note..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                maxLength={500}
              />
              <button type="submit" style={s.addNoteBtn} disabled={isSubmittingNote || !noteContent.trim()}>
                {isSubmittingNote ? '...' : 'Add'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}