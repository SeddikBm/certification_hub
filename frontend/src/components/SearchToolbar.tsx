import { Search } from "lucide-react";
import type { ReactNode } from "react";
import { appText } from "../data/mockData";

export interface SearchToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  children?: ReactNode;
}

export const SearchToolbar = ({ query, onQueryChange, children }: Readonly<SearchToolbarProps>) => (
  <div className="toolbar">
    <label className="search-field">
      <Search size={18} />
      <input
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={appText.searchPlaceholder}
      />
    </label>
    {children ? <div className="toolbar-actions">{children}</div> : null}
  </div>
);
