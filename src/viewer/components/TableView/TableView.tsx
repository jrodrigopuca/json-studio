/**
 * TableView component - renders arrays of objects as paginated tables.
 */

import { useEffect, useMemo, useState } from "react";
import { useStore } from "../../store";
import { useI18n } from "../../hooks/useI18n";
import { TABLE_PAGE_SIZE } from "@shared/constants";
import styles from "./TableView.module.css";

export function TableView() {
  const rawJson = useStore((s) => s.rawJson);
  const { t } = useI18n();
  const [currentPage, setCurrentPage] = useState(0);

  // Parse and analyze JSON for table rendering
  const tableData = useMemo(() => {
    try {
      const data = JSON.parse(rawJson);

      // Check if it's an array of objects
      if (!Array.isArray(data)) {
        return { type: "not-array" as const, data };
      }

      if (data.length === 0) {
        return { type: "empty-array" as const };
      }

      // Check if items are objects
      const firstItem = data[0];
      if (typeof firstItem !== "object" || firstItem === null || Array.isArray(firstItem)) {
        return { type: "primitive-array" as const, data };
      }

      // Get all unique keys across all objects
      const keys = new Set<string>();
      for (const item of data) {
        if (item && typeof item === "object" && !Array.isArray(item)) {
          Object.keys(item).forEach((k) => keys.add(k));
        }
      }

      return {
        type: "object-array" as const,
        columns: Array.from(keys),
        rows: data,
      };
    } catch {
      return { type: "invalid" as const };
    }
  }, [rawJson]);

  // Reset page when data changes
  useEffect(() => {
    setCurrentPage(0);
  }, [rawJson]);

  if (tableData.type === "invalid") {
    return (
      <div className={styles.message}>
        <p>{t("tableView.error.invalidJson")}</p>
      </div>
    );
  }

  if (tableData.type === "not-array") {
    return (
      <div className={styles.message}>
        <p>{t("tableView.message.worksWithArrays")}</p>
        <p>{t("tableView.message.currentDataType", { type: typeof tableData.data === "object" ? "object" : typeof tableData.data })}</p>
      </div>
    );
  }

  if (tableData.type === "empty-array") {
    return (
      <div className={styles.message}>
        <p>{t("tableView.message.emptyArray")}</p>
      </div>
    );
  }

  if (tableData.type === "primitive-array") {
    const total = tableData.data.length;
    const totalPages = Math.ceil(total / TABLE_PAGE_SIZE);
    const start = currentPage * TABLE_PAGE_SIZE;
    const end = Math.min(start + TABLE_PAGE_SIZE, total);
    const pageItems = tableData.data.slice(start, end);

    return (
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>{t("tableView.column.index")}</th>
              <th className={styles.th}>{t("tableView.column.value")}</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((item: unknown, idx: number) => (
              <tr key={start + idx} className={styles.tr}>
                <td className={styles.td}>{start + idx}</td>
                <td className={styles.td}>
                  <CellValue value={item} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            start={start + 1}
            end={end}
            total={total}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    );
  }

  // Object array - paginated table
  const total = tableData.rows.length;
  const totalPages = Math.ceil(total / TABLE_PAGE_SIZE);
  const start = currentPage * TABLE_PAGE_SIZE;
  const end = Math.min(start + TABLE_PAGE_SIZE, total);
  const pageRows = tableData.rows.slice(start, end);

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>{t("tableView.column.rowNumber")}</th>
            {tableData.columns.map((col) => (
              <th key={col} className={styles.th}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pageRows.map((row: Record<string, unknown>, idx: number) => (
            <tr key={start + idx} className={styles.tr}>
              <td className={styles.td}>{start + idx}</td>
              {tableData.columns.map((col) => (
                <td key={col} className={styles.td}>
                  <CellValue value={row[col]} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {totalPages > 1 && (
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          start={start + 1}
          end={end}
          total={total}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}

/* ─── Pagination Controls ──────────────────────────────────────────────── */

interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  start: number;
  end: number;
  total: number;
  onPageChange: (page: number) => void;
}

function PaginationBar({ currentPage, totalPages, start, end, total, onPageChange }: PaginationBarProps) {
  const { t } = useI18n();

  return (
    <div className={styles.pagination}>
      <span className={styles.paginationInfo}>
        {t("tableView.pagination.showing", { start, end, total })}
      </span>

      <div className={styles.paginationControls}>
        <button
          className={styles.paginationBtn}
          disabled={currentPage === 0}
          onClick={() => onPageChange(0)}
          title={t("tableView.pagination.first")}
        >
          ⟨⟨
        </button>
        <button
          className={styles.paginationBtn}
          disabled={currentPage === 0}
          onClick={() => onPageChange(currentPage - 1)}
          title={t("tableView.pagination.previous")}
        >
          ⟨
        </button>

        <span className={styles.paginationPage}>
          {t("tableView.pagination.page", { page: currentPage + 1, totalPages })}
        </span>

        <button
          className={styles.paginationBtn}
          disabled={currentPage >= totalPages - 1}
          onClick={() => onPageChange(currentPage + 1)}
          title={t("tableView.pagination.next")}
        >
          ⟩
        </button>
        <button
          className={styles.paginationBtn}
          disabled={currentPage >= totalPages - 1}
          onClick={() => onPageChange(totalPages - 1)}
          title={t("tableView.pagination.last")}
        >
          ⟩⟩
        </button>
      </div>
    </div>
  );
}

function CellValue({ value }: { value: unknown }) {
  const { t } = useI18n();

  if (value === null) {
    return <span className={styles.null}>null</span>;
  }

  if (value === undefined) {
    return <span className={styles.undefined}>—</span>;
  }

  if (typeof value === "boolean") {
    return <span className={styles.boolean}>{String(value)}</span>;
  }

  if (typeof value === "number") {
    return <span className={styles.number}>{value}</span>;
  }

  if (typeof value === "string") {
    // Truncate long strings
    const display = value.length > 100 ? value.slice(0, 100) + "…" : value;
    return <span className={styles.string}>{display}</span>;
  }

  if (Array.isArray(value)) {
    return <span className={styles.complex}>{t("tableView.cell.arrayLabel", { length: value.length })}</span>;
  }

  if (typeof value === "object") {
    return <span className={styles.complex}>{t("tableView.cell.objectLabel")}</span>;
  }

  return <span>{String(value)}</span>;
}
