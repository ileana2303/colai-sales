"use client";

import React from "react";
import { normalizeSearchText } from "@/lib/utils/string";

export type SearchableSelectOption = {
  value: string;
  label: string;
  description?: string;
  searchText?: string;
};

type SearchableSelectProps = {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  size?: "sm" | "lg";
  className?: string;
  name?: string;
  isInvalid?: boolean;
};

function getOptionSearchText(option: SearchableSelectOption): string {
  return normalizeSearchText(
    option.searchText ??
      [option.label, option.description, option.value]
        .filter(Boolean)
        .join(" "),
  );
}

function getOptionLabel(option: SearchableSelectOption): string {
  const name = option.label.trim() || option.value;
  const code = option.description?.trim();
  return code && code !== name ? `${name} (${code})` : name;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  ariaLabel = "Επιλογή",
  placeholder = "Επιλέξτε…",
  searchPlaceholder = "Αναζήτηση…",
  emptyMessage = "Δεν βρέθηκαν αποτελέσματα.",
  size,
  className = "",
  name,
  isInvalid = false,
}: SearchableSelectProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const searchRef = React.useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );

  const filteredOptions = React.useMemo(() => {
    const q = normalizeSearchText(query);
    if (!q) return options;
    return options.filter((option) => getOptionSearchText(option).includes(q));
  }, [options, query]);

  React.useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!rootRef.current?.contains(target)) {
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
  }, [open]);

  const controlClass =
    size === "sm" ? "form-control form-control-sm" : "form-control";

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
    setQuery("");
  };

  return (
    <div
      ref={rootRef}
      className={`searchable-select position-relative${open ? "searchable-select--open" : ""} ${className}`.trim()}
    >
      <button
        type="button"
        name={name}
        className={`${controlClass} searchable-select-toggle d-flex align-items-center justify-content-between gap-2 text-start${isInvalid ? "is-invalid" : ""}`.trim()}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
      >
        <span
          className={`text-truncate ${selectedOption ? "" : "text-secondary"}`.trim()}
        >
          {selectedOption ? getOptionLabel(selectedOption) : placeholder}
        </span>
        <i
          className={`bi bi-chevron-${open ? "up" : "down"} text-secondary flex-shrink-0`}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="searchable-select-menu shadow">
          <div className="border-bottom p-2">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-transparent">
                <i className="bi bi-search" aria-hidden />
              </span>
              <input
                ref={searchRef}
                type="search"
                className="form-control"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                autoComplete="off"
                spellCheck={false}
              />
              {query ? (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  aria-label="Καθαρισμός αναζήτησης"
                  onClick={() => setQuery("")}
                >
                  <i className="bi bi-x-lg" aria-hidden />
                </button>
              ) : null}
            </div>
          </div>

          <div
            className="searchable-select-list"
            role="listbox"
            aria-label={ariaLabel}
          >
            {filteredOptions.length ? (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`searchable-select-option${isSelected ? "is-selected" : ""}`}
                    onClick={() => handleSelect(option.value)}
                  >
                    <span className="d-block fw-medium text-break">
                      {option.label.trim() || option.value}
                    </span>
                    {option.description ? (
                      <span className="d-block small text-secondary text-break">
                        {option.description}
                      </span>
                    ) : null}
                  </button>
                );
              })
            ) : (
              <div className="searchable-select-empty text-secondary small">
                {emptyMessage}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
