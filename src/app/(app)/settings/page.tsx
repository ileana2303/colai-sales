"use client";

import packageJson from "../../../../package.json";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettingsStore } from "@/stores/settingsStore";

export default function SettingsPage() {
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  return (
    <div className="app-page app-page--narrow">
      <Card>
        <CardHeader>
          <CardTitle>Ρυθμίσεις</CardTitle>
          <CardDescription>Προτιμήσεις εμφάνισης και εφαρμογής.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-3">
          <div>
            <Label htmlFor="theme-switch" className="font-semibold">
              Σκοτεινό θέμα
            </Label>
            <div className="text-sm text-muted-foreground mt-1">
              Εναλλαγή μεταξύ φωτεινής και σκοτεινής εμφάνισης.
            </div>
          </div>
          <Switch
            id="theme-switch"
            checked={theme === "dark"}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Εφαρμογή</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Έκδοση</div>
          <div className="font-semibold mt-1">{packageJson.version}</div>
        </CardContent>
      </Card>
    </div>
  );
}
