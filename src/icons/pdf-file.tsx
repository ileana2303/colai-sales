type ExportFileIconProps = {
  className?: string;
  size?: number;
};

export function PdfFileIcon({ className, size = 20 }: ExportFileIconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="24" height="24" rx="5" fill="#E5252A" />
      <path
        d="M4.9 8.35h2.35c1.42 0 2.38.82 2.38 2.12 0 1.3-.96 2.14-2.38 2.14H6.2V15.7H4.9zm1.3 3.08h.95c.68 0 1.1-.4 1.1-.96 0-.55-.42-.94-1.1-.94H6.2z"
        fill="white"
      />
      <path
        d="M10.85 8.35h2.15c2.18 0 3.55 1.42 3.55 3.35s-1.37 3.35-3.55 3.35h-2.15zm1.3 5.5h.78c1.32 0 2.18-.86 2.18-2.15 0-1.28-.86-2.15-2.18-2.15h-.78z"
        fill="white"
      />
      <path
        d="M17.85 8.35H21.1v1.22h-1.95v1.62h1.78v1.18h-1.78V15.7h-1.3z"
        fill="white"
      />
    </svg>
  );
}
