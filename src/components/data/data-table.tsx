"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";

export type Column<T> = {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  align?: "left" | "right" | "center";
  width?: string;
};

// Table grammar ported from the dashboard's tokens/sessions tables: a solid
// .dn-tile wrapper, uppercase muted head row, faint row separators, hover wash.
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowHref,
  emptyState,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  rowHref?: (row: T) => string | undefined;
  emptyState?: React.ReactNode;
}) {
  const router = useRouter();

  if (rows.length === 0 && emptyState) return <>{emptyState}</>;

  return (
    <div className="dn-tile overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[clamp(0.78rem,1vw,0.92rem)]">
          <thead>
            <tr className="text-left text-[var(--dn-text-50)] text-[0.72em] uppercase tracking-wide font-bold [&>th]:whitespace-nowrap [&>th]:px-4 [&>th]:py-3">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={clsx(
                    "font-bold",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                  )}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const href = rowHref?.(row);
              return (
                <tr
                  key={rowKey(row)}
                  onClick={href ? () => router.push(href) : undefined}
                  className={clsx(
                    "border-t border-[rgba(255,255,255,0.07)] transition-colors",
                    "[&>td]:whitespace-nowrap [&>td]:px-4 [&>td]:py-3 [&>td]:align-middle",
                    href && "cursor-pointer hover:bg-[rgba(255,255,255,0.04)]",
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={clsx(
                        col.align === "right" && "text-right",
                        col.align === "center" && "text-center",
                      )}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
