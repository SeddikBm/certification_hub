import { useMemo, useState } from "react";

export const usePagination = <T>(items: T[], pageSize = 8) => {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  const pagedItems = useMemo(() => {
    const start = page * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const next = () => setPage((current) => Math.min(totalPages - 1, current + 1));
  const previous = () => setPage((current) => Math.max(0, current - 1));

  return { page, totalPages, pagedItems, next, previous, setPage };
};
