"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/features/auth/hooks/useLogin";
import { useAuthStore } from "@/stores/authStore";

export default function LoginPage({ appVersion }: { appVersion: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const setUnauthenticated = useAuthStore((s) => s.setUnauthenticated);
  const loginMutation = useLogin();

  const next = params.get("next") || "/";
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const u = username.trim();
    const p = password;

    if (u.length < 2 || p.length < 2) {
      setError("Συμπλήρωσε σωστά στοιχεία σύνδεσης.");
      setUnauthenticated("Invalid input");
      return;
    }

    try {
      await loginMutation.mutateAsync({ username: u, password: p });
      router.replace(next);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Αποτυχία σύνδεσης. Δοκίμασε ξανά.";
      setError(msg);
    }
  }

  return (
    <div className="app-viewport login-screen">
      <div className="w-full">
        <div className="mb-3 text-center">
          <Image
            src="/logo_auth.png"
            alt="Mavrogenis"
            width={520}
            height={140}
            priority
            style={{ width: "min(420px, 85vw)", height: "auto" }}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Σύνδεση</CardTitle>
            <CardDescription>
              Συνδέσου με τα διαπιστευτήριά σου για πρόσβαση στις αναφορές.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <Alert variant="destructive" className="mb-3">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <form onSubmit={onSubmit} className="app-page">
              <div className="flex flex-col gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Συνδέεται…" : "Σύνδεση"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex-col gap-2 text-center">
            <div className="small">
              <Link href="/privacy-policy" className="no-underline">
                Πολιτική Απορρήτου
              </Link>
              <span className="text-muted-foreground mx-2">|</span>
              <Link href="/terms-of-use" className="no-underline">
                Όροι Χρήσης
              </Link>
            </div>
            <div className="text-sm text-muted-foreground">Version {appVersion}</div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
