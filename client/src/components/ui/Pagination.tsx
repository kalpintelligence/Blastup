'use client';

interface Props { page: number; pages: number; total: number; pageSize?: number; onPageChange: (page: number) => void; compact?: boolean }

export default function Pagination({ page, pages, total, pageSize = 20, onPageChange, compact }: Props) {
  if (pages <= 1) return null;
  const start = (page - 1) * pageSize + 1; const end = Math.min(page * pageSize, total);
  return <div className="flex items-center justify-between gap-2" style={{ padding: compact ? '8px 12px' : '14px 0', borderTop: compact ? '1px solid var(--color-border)' : undefined }}>
    <span className="text-xs text-secondary">{start}–{end} of {total}</span>
    <div className="flex items-center gap-2"><button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</button><span className="text-xs">{page}/{pages}</span><button className="btn btn-secondary btn-sm" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>Next</button></div>
  </div>;
}
