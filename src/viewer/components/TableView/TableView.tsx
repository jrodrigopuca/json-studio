/**
 * TableView component - renders arrays of objects as tables.
 */

import { useMemo } from "react";
import { useStore } from "../../store";
import styles from "./TableView.module.css";

export function TableView() {
  const rawJson = useStore((s) => s.rawJson);

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

  if (tableData.type === "invalid") {
    return (
      <div className={styles.message}>
        <p>Invalid JSON - cannot render as table.</p>
      </div>
    );
  }

  if (tableData.type === "not-array") {
    return (
      <div className={styles.message}>
        <p>Table view works best with arrays of objects.</p>
        <p>Current data is a {typeof tableData.data === "object" ? "object" : typeof tableData.data}.</p>
      </div>
    );
  }

  if (tableData.type === "empty-array") {
    return (
      <div className={styles.message}>
        <p>Empty array - no data to display.</p>
      </div>
    );
  }

  if (tableData.type === "primitive-array") {
    return (
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Index</th>
              <th className={styles.th}>Value</th>
            </tr>
          </thead>
          <tbody>
            {tableData.data.map((item: unknown, idx: number) => (
              <tr key={idx} className={styles.tr}>
                <td className={styles.td}>{idx}</td>
                <td className={styles.td}>
                  <CellValue value={item} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Object array - full table
  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>#</th>
            {tableData.columns.map((col) => (
              <th key={col} className={styles.th}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableData.rows.map((row: Record<string, unknown>, idx: number) => (
            <tr key={idx} className={styles.tr}>
              <td className={styles.td}>{idx}</td>
              {tableData.columns.map((col) => (
                <td key={col} className={styles.td}>
                  <CellValue value={row[col]} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CellValue({ value }: { value: unknown }) {
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
    return <span className={styles.complex}>[Array: {value.length}]</span>;
  }

  if (typeof value === "object") {
    return <span className={styles.complex}>{"{Object}"}</span>;
  }

  return <span>{String(value)}</span>;
}
