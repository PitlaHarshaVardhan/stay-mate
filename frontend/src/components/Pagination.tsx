import { Button, Heading, InlineText, Paragraph } from './ui';

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
      <Button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        variant="secondary"
        size="xs"
        className="min-h-10 px-3 text-sm text-slate-700"
      >
        Previous
      </Button>
      <InlineText aria-live="polite" className="text-sm text-slate-500">Page {page} of {totalPages}</InlineText>
      <Button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        variant="secondary"
        size="xs"
        className="min-h-10 px-3 text-sm text-slate-700"
      >
        Next
      </Button>
    </nav>
  );
}