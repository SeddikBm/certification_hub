import { useMemo, useState } from "react";

export const useFilter = <T>(items: T[], selector: (item: T) => string) => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return items;
    }
    return items.filter((item) => selector(item).toLowerCase().includes(normalized));
  }, [items, query, selector]);

  return { query, setQuery, filtered };
};
