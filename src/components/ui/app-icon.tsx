"use client";

import type { LucideIcon } from "lucide-react";

import { Activity } from "@/icons/lucide/activity";
import { ArrowDown } from "@/icons/lucide/arrow-down";
import { ArrowUp } from "@/icons/lucide/arrow-up";
import { ArrowUpDown } from "@/icons/lucide/arrow-up-down";
import { BarChart3 } from "@/icons/lucide/bar-chart-3";
import { Building2 } from "@/icons/lucide/building-2";
import { Calendar } from "@/icons/lucide/calendar";
import { ChevronLeft } from "@/icons/lucide/chevron-left";
import { ChevronRight } from "@/icons/lucide/chevron-right";
import { CircleCheck } from "@/icons/lucide/circle-check";
import { ClipboardList } from "@/icons/lucide/clipboard-list";
import { Coins } from "@/icons/lucide/coins";
import { Database } from "@/icons/lucide/database";
import { Droplet } from "@/icons/lucide/droplet";
import { FileSpreadsheet } from "@/icons/lucide/file-spreadsheet";
import { HeartPulse } from "@/icons/lucide/heart-pulse";
import { LayoutGrid } from "@/icons/lucide/layout-grid";
import { LineChart } from "@/icons/lucide/chart-line";
import { LogOut } from "@/icons/lucide/log-out";
import { PieChart } from "@/icons/lucide/pie-chart";
import { Repeat } from "@/icons/lucide/repeat";
import { RotateCcw } from "@/icons/lucide/rotate-ccw";
import { Settings } from "@/icons/lucide/settings";
import { Sparkles } from "@/icons/lucide/sparkles";
import { Table } from "@/icons/lucide/table";
import { Target } from "@/icons/lucide/target";
import { TrendingUp } from "@/icons/lucide/trending-up";
import { UserPlus } from "@/icons/lucide/user-plus";
import { Users } from "@/icons/lucide/users";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  "bi-activity": Activity,
  "bi-arrow-counterclockwise": RotateCcw,
  "bi-arrow-down-up": ArrowUpDown,
  "bi-arrow-repeat": Repeat,
  "bi-bar-chart": BarChart3,
  "bi-bar-chart-line": LineChart,
  "bi-box-arrow-right": LogOut,
  "bi-bullseye": Target,
  "bi-calendar2-week": Calendar,
  "bi-cash-stack": Coins,
  "bi-check2-circle": CircleCheck,
  "bi-chevron-left": ChevronLeft,
  "bi-chevron-right": ChevronRight,
  "bi-clipboard-data": ClipboardList,
  "bi-clipboard2-pulse": HeartPulse,
  "bi-database": Database,
  "bi-droplet-half": Droplet,
  "bi-file-earmark-excel": FileSpreadsheet,
  "bi-gear": Settings,
  "bi-graph-up-arrow": TrendingUp,
  "bi-grid-3x3-gap": LayoutGrid,
  "bi-hospital": Building2,
  "bi-people": Users,
  "bi-person-plus": UserPlus,
  "bi-pie-chart": PieChart,
  "bi-sort-down": ArrowDown,
  "bi-sort-up": ArrowUp,
  "bi-stars": Sparkles,
  "bi-table": Table,
};

type AppIconProps = {
  name: string;
  className?: string;
  size?: number;
};

export function AppIcon({ name, className, size = 16 }: AppIconProps) {
  const Icon = ICON_MAP[name] ?? BarChart3;
  return <Icon className={cn("shrink-0", className)} size={size} aria-hidden />;
}
