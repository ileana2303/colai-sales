"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "!border-[rgba(var(--bs-success-rgb),0.35)] !bg-[rgba(var(--bs-success-rgb),0.12)] !text-[var(--bs-success)]",
          error:
            "group-[.toaster]:!bg-destructive/10 group-[.toaster]:!text-destructive group-[.toaster]:!border-destructive/30",
        },
      }}
      {...props}
    />
  );
}
