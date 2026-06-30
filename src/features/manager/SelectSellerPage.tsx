"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { powerBiKeys } from "@/features/powerBI/queryKeys";
import { fetchPowerBiSellers } from "@/lib/api/powerbi";
import type { PowerBiSellerRow } from "@/lib/bi-reports/sellers";
import { normalizeSellerCode } from "@/lib/sellerAccess";
import { useSelectedSellerStore } from "@/stores/selectedSellerStore";

function normalizeSearchValue(value: string) {
  return value.trim().toLocaleUpperCase("el-GR");
}

function matchesSellerSearch(record: PowerBiSellerRow, query: string) {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) return true;

  return [record.salesPerson, record.sellerCode, record.team, record.area].some(
    (field) =>
      String(field ?? "")
        .trim()
        .toLocaleUpperCase("el-GR")
        .includes(normalizedQuery),
  );
}

export function SelectSellerPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const selectedSeller = useSelectedSellerStore(
    (state) => state.selectedSeller,
  );
  const selectSeller = useSelectedSellerStore((state) => state.selectSeller);
  const [searchQuery, setSearchQuery] = useState("");
  const [submittingCode, setSubmittingCode] = useState<string | null>(null);

  const { data, error, isError, isLoading, refetch } = useQuery({
    queryKey: [...powerBiKeys.all, "sellers", "all"],
    queryFn: () => fetchPowerBiSellers("all"),
    staleTime: 60_000,
    retry: 1,
  });

  const filteredRecords = useMemo(() => {
    const records = data?.records ?? [];
    return records.filter((record) => matchesSellerSearch(record, searchQuery));
  }, [data?.records, searchQuery]);

  async function handleSelectSeller(sellerCode: string) {
    const normalizedCode = normalizeSellerCode(sellerCode);
    if (!normalizedCode || submittingCode) return;

    setSubmittingCode(normalizedCode);

    try {
      await selectSeller(normalizedCode);
      await queryClient.invalidateQueries({ queryKey: powerBiKeys.all });
      router.replace("/");
    } finally {
      setSubmittingCode(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <section className="app-card p-4">
        <div>
          <h1 className="app-report-title mb-0">Επιλογή πωλητή</h1>
          <p className="app-report-subtitle mb-0">
            Επιλέξτε πωλητή για προβολή αναφορών ανά area
          </p>
        </div>
      </section>

      <section className="app-card overflow-hidden p-0">
        <div className="border-border border-b p-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Αναζήτηση πωλητή</span>
            <Input
              placeholder="Όνομα, κωδικός, team, area…"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground p-8 text-center">
            Φόρτωση πωλητών…
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <p className="text-muted-foreground">
              {error instanceof Error
                ? error.message
                : "Αποτυχία φόρτωσης πωλητών"}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => void refetch()}
            >
              <AppIcon name="bi-arrow-clockwise" size={16} />
              Δοκιμή ξανά
            </Button>
          </div>
        ) : (
          <>
            <div className="border-border text-muted-foreground border-b px-4 py-3 text-sm">
              {filteredRecords.length} πωλητές
            </div>
            <div className="max-h-[min(70vh,720px)] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Πωλητής</TableHead>
                    <TableHead>Κωδικός</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead className="w-[132px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => {
                    const isSelected =
                      normalizeSellerCode(record.sellerCode) ===
                      normalizeSellerCode(selectedSeller?.sellerCode);
                    const isSubmitting =
                      submittingCode === normalizeSellerCode(record.sellerCode);

                    return (
                      <TableRow
                        key={`${record.sellerCode}-${record.area}-${record.team}`}
                        className={isSelected ? "bg-muted/40" : undefined}
                      >
                        <TableCell>{record.salesPerson || "-"}</TableCell>
                        <TableCell>{record.sellerCode || "-"}</TableCell>
                        <TableCell>{record.team || "-"}</TableCell>
                        <TableCell>{record.area || "-"}</TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            size="sm"
                            disabled={Boolean(submittingCode)}
                            className="min-w-[104px] font-semibold shadow-sm"
                            onClick={() =>
                              void handleSelectSeller(record.sellerCode)
                            }
                          >
                            {isSubmitting
                              ? "Επιλογή…"
                              : isSelected
                                ? "Επιλεγμένος"
                                : "Επιλογή"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {!filteredRecords.length ? (
              <div className="text-muted-foreground border-border border-t p-6 text-center text-sm">
                Δεν βρέθηκαν πωλητές με τα τρέχοντα φίλτρα.
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
