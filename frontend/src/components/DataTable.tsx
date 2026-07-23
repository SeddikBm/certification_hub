import type { ReactNode } from "react";
import { EmptyState } from "./EmptyState";

export type Column<T> = {
  key: string;
  title: string;
  render: (item: T) => ReactNode;
};

export interface DataTableProps<T> {
  columns: Column<T>[];
  items: T[];
}

export const DataTable = <T,>({ columns, items }: Readonly<DataTableProps<T>>) => (
  <div className="table-wrap">
    {items.length === 0 ? (
      <EmptyState />
    ) : (
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td key={column.key}>{column.render(item)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);
