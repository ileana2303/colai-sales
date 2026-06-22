import type { ReactNode } from "react";

export type ReportMatrixTone =
  | "danger"
  | "default"
  | "muted"
  | "primary"
  | "rose"
  | "success"
  | "warning";

export type ReportMatrixColumn = {
  key: string;
  label: ReactNode;
  align?: "center" | "left" | "right";
  headerTone?: ReportMatrixTone;
  cellTone?: ReportMatrixTone;
  width?: number;
};

export type ReportMatrixLeadingColumn = {
  key: string;
  label: ReactNode;
  width: number;
};

export type ReportMatrixSection = {
  key: string;
  title: ReactNode;
  columns: ReportMatrixColumn[];
  tone?: ReportMatrixTone;
};

export type ReportMatrixRow = {
  key: string;
  category: ReactNode;
  leadingValues?: Record<string, ReactNode>;
  values: Record<string, ReactNode>;
  cellTones?: Record<string, ReportMatrixTone>;
  isTotal?: boolean;
};

type ReportMatrixTableProps = {
  brandLabel: string;
  caption: string;
  categoryLabel?: string;
  description?: string;
  leadingColumns?: ReportMatrixLeadingColumn[];
  rows: ReportMatrixRow[];
  sections: ReportMatrixSection[];
  title?: string;
};

function cn(...classes: Array<false | null | string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getAlignClass(align: ReportMatrixColumn["align"]) {
  if (align === "left") return "report-matrix__cell--left";
  if (align === "center") return "report-matrix__cell--center";
  return "report-matrix__cell--right";
}

function renderValue(value: ReactNode) {
  return value == null || value === "" ? "—" : value;
}

function getLeadingValue(row: ReportMatrixRow, key: string) {
  if (key === "category") return row.category;
  return row.leadingValues?.[key];
}

export function ReportMatrixTable({
  brandLabel,
  caption,
  categoryLabel = "Κατηγορία Στόχου",
  description,
  leadingColumns,
  rows,
  sections,
  title,
}: ReportMatrixTableProps) {
  const resolvedLeadingColumns = leadingColumns ?? [
    { key: "category", label: categoryLabel, width: 220 },
  ];
  const leadingOffsets = resolvedLeadingColumns.reduce<number[]>(
    (offsets, column, index) => {
      offsets.push(index === 0 ? 0 : offsets[index - 1] + column.width);
      return offsets;
    },
    [],
  );
  const leadingWidth = resolvedLeadingColumns.reduce(
    (sum, column) => sum + column.width,
    0,
  );

  const columns = sections.flatMap((section) =>
    section.columns.map((column, index) => ({
      ...column,
      isSectionStart: index === 0,
      sectionKey: section.key,
      sectionTone: section.tone,
    })),
  );

  return (
    <section className="app-card report-matrix-card">
      {title || description ? (
        <div className="report-matrix-card__header">
          <div className="min-w-0">
            {title ? (
              <h2 className="report-matrix-card__title">{title}</h2>
            ) : null}
            {description ? (
              <p className="report-matrix-card__description">{description}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="report-matrix__viewport">
        <table className="report-matrix">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              <th
                className="report-matrix__brand-cell"
                colSpan={resolvedLeadingColumns.length}
                scope="colgroup"
                style={{ left: 0, minWidth: leadingWidth, width: leadingWidth }}
              >
                {brandLabel}
              </th>
              {sections.map((section) => (
                <th
                  key={section.key}
                  className={cn(
                    "report-matrix__section-heading",
                    section.tone &&
                      `report-matrix__section-heading--${section.tone}`,
                  )}
                  colSpan={section.columns.length}
                  scope="colgroup"
                >
                  {section.title}
                </th>
              ))}
            </tr>
            <tr>
              {resolvedLeadingColumns.map((column, index) => (
                <th
                  key={column.key}
                  className={cn(
                    "report-matrix__leading-heading",
                    index === 0 && "report-matrix__category-heading",
                  )}
                  scope="col"
                  style={{
                    left: leadingOffsets[index],
                    minWidth: column.width,
                    width: column.width,
                  }}
                >
                  {column.label}
                </th>
              ))}
              {columns.map((column) => (
                <th
                  key={`${column.sectionKey}-${column.key}`}
                  className={cn(
                    "report-matrix__column-heading",
                    column.isSectionStart && "report-matrix__section-start",
                    column.sectionTone &&
                      `report-matrix__column-heading--section-${column.sectionTone}`,
                    column.headerTone &&
                      `report-matrix__column-heading--${column.headerTone}`,
                    getAlignClass(column.align),
                  )}
                  scope="col"
                  style={
                    column.width
                      ? { minWidth: column.width, width: column.width }
                      : undefined
                  }
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.key}
                className={cn(row.isTotal && "report-matrix__row--total")}
              >
                {resolvedLeadingColumns.map((column, index) => {
                  const content = renderValue(getLeadingValue(row, column.key));
                  const className = cn(
                    index === 0
                      ? "report-matrix__category-cell"
                      : "report-matrix__dimension-cell",
                  );
                  const style = {
                    left: leadingOffsets[index],
                    minWidth: column.width,
                    width: column.width,
                  };

                  return index === 0 ? (
                    <th
                      key={column.key}
                      className={className}
                      scope="row"
                      style={style}
                    >
                      {content}
                    </th>
                  ) : (
                    <td key={column.key} className={className} style={style}>
                      {content}
                    </td>
                  );
                })}
                {columns.map((column) => {
                  const tone =
                    row.cellTones?.[column.key] ?? column.cellTone ?? "default";

                  return (
                    <td
                      key={`${row.key}-${column.key}`}
                      className={cn(
                        "report-matrix__cell",
                        getAlignClass(column.align),
                        column.isSectionStart && "report-matrix__section-start",
                        tone !== "default" && `report-matrix__cell--${tone}`,
                      )}
                    >
                      {renderValue(row.values[column.key])}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
