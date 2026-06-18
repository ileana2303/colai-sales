"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { parseProxyJson } from "@/lib/api/client";
import type { LoginSuccess } from "@/types/api/responses";
import { loginOk, loginFail } from "@/features/auth/authSlice";

export default function LoginPage({ appVersion }: { appVersion: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const dispatch = useAppDispatch();

  const next = params.get("next") || "/";
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const u = username.trim();
    const p = password;

    if (u.length < 2 || p.length < 2) {
      setError("Συμπλήρωσε σωστά στοιχεία σύνδεσης.");
      dispatch(loginFail("Invalid input"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p }),
      });

      const data = await parseProxyJson<LoginSuccess>(
        res,
        "Αποτυχία σύνδεσης.",
      );

      if (!data.userInfos) {
        throw new Error("Missing user info from login response.");
      }

      dispatch(loginOk({ userInfos: data.userInfos }));
      router.replace(next);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Αποτυχία σύνδεσης. Δοκίμασε ξανά.";
      setError(msg);
      dispatch(loginFail(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-viewport login-screen">
      <div className="w-100">
        <div className="mb-3 text-center">
          <Image
            src="/logo_auth.png"
            alt="Mavrogenis"
            width={520}
            height={140}
            priority
            style={{ width: "min(320px, 85vw)", height: "auto" }}
          />
        </div>

        <div className="app-card p-3">
          {error ? (
            <div className="alert alert-danger small py-2">{error}</div>
          ) : null}

          <form onSubmit={onSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Username</label>
              <input
                className="form-control"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Password</label>
              <input
                className="form-control"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {loading ? (
                <span className="d-inline-flex align-items-center gap-2">
                  <span
                    className="spinner-border spinner-border-sm"
                    aria-hidden
                  />
                  Συνδέεται…
                </span>
              ) : (
                <span>
                  <i className="bi bi-box-arrow-in-right me-2" />
                  Σύνδεση
                </span>
              )}
            </button>
          </form>
          <div className="mt-3 text-center">
            <div className="small">
              <Link href="/privacy-policy" className="text-decoration-none">
                Πολιτική Απορρήτου
              </Link>
              <span className="text-secondary mx-2">|</span>
              <Link href="/terms-of-use" className="text-decoration-none">
                Όροι Χρήσης
              </Link>
            </div>
            <div className="small text-secondary mt-2">
              Version {appVersion}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
