"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logoutAsync } from "@/features/auth/authSlice";

import Dropdown from "react-bootstrap/Dropdown";

const navItems = [
  { href: "/diadikasia-wc", icon: "bi-calendar-check", label: "WC" },
  { href: "/salesWC", icon: "bi-receipt", label: "Πωλήσεις" },
  {
    href: "/powerbi/seller-reports",
    activePath: "/powerbi",
    icon: "bi-bar-chart",
    label: "Power BI",
  },
] as const;

function isActive(pathname: string, item: (typeof navItems)[number]): boolean {
  const matchPath = "activePath" in item ? item.activePath : item.href;
  return pathname === matchPath || pathname.startsWith(`${matchPath}/`);
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  const userInfos = useAppSelector((s) => s.auth?.userInfos);
  const fullName =
    [userInfos?.fname, userInfos?.lname].filter(Boolean).join(" ") ||
    "Λογαριασμός";

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const displayName = mounted ? fullName : "Λογαριασμός";

  const onSettings = () => {
    router.push("/settings");
  };

  const onLogout = async () => {
    try {
      await dispatch(logoutAsync());
      router.replace("/login");
    } catch (e) {}
  };

  return (
    <div className="app-viewport d-flex flex-column">
      <header className="app-header">
        <div className="app-header__inner">
          <Link
            href="/"
            className="app-logo-link"
            aria-label="Μετάβαση στην αρχική"
          >
            <Image
              src="/mono_logo.png"
              alt="App logo"
              width={120}
              height={28}
              priority
              style={{ height: 28, width: "auto" }}
            />
          </Link>

          <nav className="app-top-nav" aria-label="Primary navigation">
            {navItems.map((item) => {
              const active = isActive(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`app-top-nav__link${active ? "app-top-nav__link--active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  <i className={`bi ${item.icon}`} aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="app-header__actions">
            <Dropdown align="end">
              <Dropdown.Toggle
                id="user-menu"
                size="sm"
                variant="outline-secondary"
                className="app-pill d-inline-flex align-items-center gap-2"
                aria-label="User menu"
                style={{ maxWidth: 200 }}
              >
                <span
                  className="text-truncate"
                  style={{ maxWidth: 170 }}
                  suppressHydrationWarning
                >
                  {displayName}
                </span>
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <Dropdown.Item onClick={onSettings}>
                  <i className="bi bi-gear me-2" />
                  Ρυθμίσεις
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={onLogout}>
                  <i className="bi bi-box-arrow-right me-2" />
                  Αποσύνδεση
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>
      </header>

      <main className="app-content">{children}</main>
    </div>
  );
}
