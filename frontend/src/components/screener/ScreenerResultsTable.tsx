'use client';

import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { StockMetricResult, SortConfig, SortableField } from '@/types/screener';
import { StockResultCard } from './StockResultCard';

interface ScreenerResultsTableProps {
  results: StockMetricResult[];
  total: number;
  page: number;
  totalPages: number;
  sortConfig: SortConfig;
  onSort: (config: SortConfig) => void;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

interface SortButtonProps {
  field: SortableField;
  label: string;
  active: boolean;
  order: 'asc' | 'desc';
  onClick: () => void;
}

function SortButton({ field, label, active, order, onClick }: SortButtonProps) {
  return (
    <button
      type="button"
      id={`sort-${field}`}
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
        active
          ? 'bg-primary/15 text-primary border border-primary/30'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent'
      }`}
      aria-label={`Sort by ${label}`}
      aria-pressed={active}
    >
      <ArrowUpDown size={11} />
      {label}
      {active && (
        <span className="text-[10px] opacity-70">{order === 'desc' ? '↓' : '↑'}</span>
      )}
    </button>
  );
}

// Skeleton card for loading state
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border/30 bg-card/60 p-4 animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="space-y-2">
          <div className="h-4 w-20 rounded bg-muted" />
          <div className="h-3 w-32 rounded bg-muted/70" />
        </div>
        <div className="space-y-2 text-right">
          <div className="h-4 w-16 rounded bg-muted" />
          <div className="h-3 w-12 rounded bg-muted/70 ml-auto" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="rounded-xl bg-muted/40 h-14" />
        ))}
      </div>
      <div className="flex gap-1.5">
        <div className="h-4 w-16 rounded-full bg-muted/60" />
        <div className="h-4 w-20 rounded-full bg-muted/40" />
      </div>
    </div>
  );
}

const SORT_OPTIONS: { field: SortableField; label: string }[] = [
  { field: 'relevanceScore', label: 'Relevance' },
  { field: 'changePct', label: 'Change %' },
  { field: 'volumeRatio', label: 'Volume ×' },
  { field: 'rsi14', label: 'RSI' },
  { field: 'closePrice', label: 'Price' },
  { field: 'distanceFrom52wHigh', label: '52W Distance' },
];

export function ScreenerResultsTable({
  results,
  total,
  page,
  totalPages,
  sortConfig,
  onSort,
  onPageChange,
  isLoading = false,
}: ScreenerResultsTableProps) {
  const handleSort = (field: SortableField) => {
    if (sortConfig.field === field) {
      onSort({ field, order: sortConfig.order === 'desc' ? 'asc' : 'desc' });
    } else {
      onSort({ field, order: 'desc' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Sort controls */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Sort by:</span>
        {SORT_OPTIONS.map(opt => (
          <SortButton
            key={opt.field}
            field={opt.field}
            label={opt.label}
            active={sortConfig.field === opt.field}
            order={sortConfig.order}
            onClick={() => handleSort(opt.field)}
          />
        ))}
        <span className="ml-auto text-xs text-muted-foreground">
          {total > 0 && (
            <>Page {page} of {totalPages} · {total.toLocaleString()} results</>
          )}
        </span>
      </div>

      {/* Results grid */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 text-5xl opacity-20">📉</div>
          <h3 className="text-base font-semibold text-muted-foreground">No results found</h3>
          <p className="mt-1.5 text-sm text-muted-foreground/60">
            Try a broader query or different criteria
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((stock, i) => (
            <StockResultCard
              key={stock.symbol}
              stock={stock}
              rank={(page - 1) * 20 + i + 1}
              animationDelay={i * 30}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !isLoading && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            type="button"
            id="screener-prev-page"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/80 px-4 py-2 text-sm font-medium transition-all duration-200 hover:border-primary/40 hover:bg-muted/60 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            <ChevronLeft size={15} />
            Prev
          </button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p: number;
              if (totalPages <= 5) p = i + 1;
              else if (page <= 3) p = i + 1;
              else if (page >= totalPages - 2) p = totalPages - 4 + i;
              else p = page - 2 + i;

              return (
                <button
                  key={p}
                  type="button"
                  id={`screener-page-${p}`}
                  onClick={() => onPageChange(p)}
                  className={`h-8 w-8 rounded-lg text-sm font-medium transition-all duration-200 ${
                    p === page
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  }`}
                  aria-label={`Go to page ${p}`}
                  aria-current={p === page ? 'page' : undefined}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            id="screener-next-page"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/80 px-4 py-2 text-sm font-medium transition-all duration-200 hover:border-primary/40 hover:bg-muted/60 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            Next
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
