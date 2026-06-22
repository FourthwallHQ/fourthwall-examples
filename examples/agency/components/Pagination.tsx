import { Button } from "@fourthwall-examples/ui";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
}

/** page / size navigation with a total count. */
export function Pagination({ page, totalPages, total, onChange }: PaginationProps) {
  if (total === 0) return null;
  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        {total} product{total === 1 ? "" : "s"}
        {totalPages > 1 ? ` · page ${page + 1} of ${totalPages}` : ""}
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button
            appearance="secondary"
            size="small"
            disabled={!canPrev}
            onClick={() => onChange(page - 1)}
          >
            Previous
          </Button>
          <Button
            appearance="secondary"
            size="small"
            disabled={!canNext}
            onClick={() => onChange(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
