// components/ui/OtpInput.tsx
"use client";

import * as React from "react";

type Props = {
  value: string;
  onChange: (next: string) => void;
  length?: number;
  name?: string;
  disabled?: boolean;
};

import { onlyDigits } from "@/lib/utils/string";

export default function OtpInput({
  value,
  onChange,
  length = 6,
  name,
  disabled,
}: Props) {
  const refs = React.useRef<Array<HTMLInputElement | null>>([]);

  const chars = React.useMemo(() => {
    const v = onlyDigits(value).slice(0, length);
    return Array.from({ length }, (_, i) => v[i] ?? "");
  }, [value, length]);

  const setAt = (startIndex: number, text: string) => {
    const incoming = onlyDigits(text);
    if (!incoming) return;

    const next = [...chars];
    let i = startIndex;

    for (const ch of incoming) {
      if (i >= length) break;
      next[i] = ch;
      i++;
    }

    onChange(next.join(""));

    const nextFocus = Math.min(startIndex + incoming.length, length - 1);
    refs.current[nextFocus]?.focus();
    refs.current[nextFocus]?.select();
  };

  const clearAt = (idx: number) => {
    const next = [...chars];
    next[idx] = "";
    onChange(next.join(""));
  };

  return (
    <div className="d-flex gap-1">
      {chars.map((ch, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className="form-control text-center"
          name={name ? `${name}_${i}` : undefined}
          inputMode="numeric"
          pattern="\d*"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          disabled={disabled}
          value={ch}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => {
            const text = e.target.value;

            // Mobile autofill / fast typing may put multiple digits at once
            if (text.length > 1) {
              setAt(i, text);
              return;
            }

            const digit = onlyDigits(text).slice(-1); // keep last typed digit
            if (!digit) {
              clearAt(i);
              return;
            }

            const next = [...chars];
            next[i] = digit;
            onChange(next.join(""));

            if (i < length - 1) {
              refs.current[i + 1]?.focus();
              refs.current[i + 1]?.select();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace") {
              if (chars[i]) {
                clearAt(i);
                return;
              }
              if (i > 0) {
                refs.current[i - 1]?.focus();
                refs.current[i - 1]?.select();
              }
              return;
            }

            if (e.key === "ArrowLeft" && i > 0) {
              refs.current[i - 1]?.focus();
              refs.current[i - 1]?.select();
            }

            if (e.key === "ArrowRight" && i < length - 1) {
              refs.current[i + 1]?.focus();
              refs.current[i + 1]?.select();
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            const pasted = e.clipboardData.getData("text");
            setAt(i, pasted);
          }}
          style={{ width: 34, maxWidth: 40, paddingLeft: 0, paddingRight: 0 }}
        />
      ))}
    </div>
  );
}
