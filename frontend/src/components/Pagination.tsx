export const PAGE_SIZE = 5;

type PaginationProps = {
  page: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  label: string;
};

export default function Pagination({ page, totalItems, onPageChange, label }: PaginationProps) {
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  if (totalPages < 2) return null;

  return (
    <nav aria-label={`${label} pages`} className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Previous
      </button>
      <span aria-live="polite" className="text-sm text-slate-500">Page {page} of {totalPages}</span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>
    </nav>
  );
}