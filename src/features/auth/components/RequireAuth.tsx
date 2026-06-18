"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";

export default function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const status = useAppSelector((s) => s.auth.status);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      const next = encodeURIComponent(pathname || "/");
      router.replace(`/login?next=${next}`);
    }
  }, [status, router, pathname]);

  if (status === "unknown") {
    // return (
    //   <div className="app-card p-3 text-center">
    //     <div className="spinner-border" role="status" aria-hidden />
    //     <div className="mt-2 text-secondary small">Loading…</div>
    //   </div>
    // );
    return null;
  }

  if (status === "unauthenticated") {
    return null;
  }

  return <>{children}</>;
}
