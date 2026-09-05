type ExportFileIconProps = {
  className?: string;
  size?: number;
};

export function ExcelFileIcon({ className, size = 20 }: ExportFileIconProps) {
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
      <rect width="24" height="24" rx="5" fill="#107C41" />
      <path
        d="M7.25 7.25h9.5a.75.75 0 0 1 .75.75v8a.75.75 0 0 1-.75.75h-9.5a.75.75 0 0 1-.75-.75v-8a.75.75 0 0 1 .75-.75Z"
        fill="white"
      />
      <path
        d="M6.5 11.5h11M6.5 15h11M11 7.25v9.5M15 7.25v9.5"
        stroke="#107C41"
        strokeWidth="1.2"
      />
    </svg>
  );
}
