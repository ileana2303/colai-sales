"use client";

import React from "react";

type Props = {
  placeholder?: string;
  value: string;
  onChange: (next: string) => void;
  onSubmit?: () => void;
  onClear?: () => void;
  autoFocus?: boolean;
  className?: string;
  debounceMs?: number;
  onDebouncedChange?: (next: string) => void;
  debouncedCompareTo?: string;
};

export function SearchBar({
  placeholder = "Αναζήτηση…",
  value,
  onChange,
  onSubmit,
  onClear,
  autoFocus = false,
  className,
  debounceMs,
  onDebouncedChange,
  debouncedCompareTo = "",
}: Props) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const debounceTimerRef = React.useRef<number | null>(null);

  const clearDebounceTimer = React.useCallback(() => {
    if (debounceTimerRef.current != null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  const flushDebouncedChange = React.useCallback(
    (next: string) => {
      clearDebounceTimer();
      onDebouncedChange?.(next);
    },
    [clearDebounceTimer, onDebouncedChange],
  );

  React.useEffect(() => {
    if (!onDebouncedChange || debounceMs == null || debounceMs <= 0) return;

    const trimmedValue = value.trim();
    const trimmedCompare = debouncedCompareTo.trim();
    if (trimmedValue === trimmedCompare) return;

    debounceTimerRef.current = window.setTimeout(() => {
      debounceTimerRef.current = null;
      onDebouncedChange(value);
    }, debounceMs);

    return clearDebounceTimer;
  }, [
    value,
    debouncedCompareTo,
    debounceMs,
    onDebouncedChange,
    clearDebounceTimer,
  ]);

  const submit = React.useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      inputRef.current?.blur();
      if (onDebouncedChange && debounceMs) {
        flushDebouncedChange(value);
      }
      onSubmit?.();
    },
    [debounceMs, flushDebouncedChange, onDebouncedChange, onSubmit, value],
  );

  const clear = React.useCallback(() => {
    clearDebounceTimer();
    onChange("");
    inputRef.current?.focus();
    if (onDebouncedChange) {
      onDebouncedChange("");
    }
    onClear?.();
  }, [clearDebounceTimer, onChange, onClear, onDebouncedChange]);

  return (
    <form onSubmit={submit} className={className}>
      <div className="input-group">
        <span
          className="input-group-text border-0 bg-transparent pe-0"
          aria-hidden
        >
          <i className="bi bi-search" />
        </span>
        <input
          ref={inputRef}
          className="form-control search-bar border-0 ps-2"
          type="text"
          inputMode="search"
          enterKeyHint="search"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          autoFocus={autoFocus}
          style={{ background: "none" }}
        />
        {value ? (
          <button
            type="button"
            className="btn d-inline-flex align-items-center justify-content-center border-0"
            onClick={clear}
            aria-label="Καθαρισμός αναζήτησης"
            style={{ maxHeight: 36 }}
          >
            <i className="bi bi-x-lg" />
          </button>
        ) : null}
      </div>
    </form>
  );
}
