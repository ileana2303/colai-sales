import { getPowerBiRouteAuthContext } from "@/lib/bi-reports/powerBiRouteContext";
import { resolveBiReportPowerBiTarget } from "@/lib/bi-reports/biReports";
import type { BiReportPowerBiTargetKey } from "@/lib/bi-reports/biReports.types";
import {
  getCurrentReportYear,
  getPreviousReportYear,
  executePowerBiQuery,
  POWERBI_NO_CACHE_HEADERS,
  PowerBiRequestError,
} from "@/lib/bi-reports/powerBi";
import type {
  PowerBiAreaQuerySpec,
  PowerBiAreaReportRouteConfig,
} from "@/lib/bi-reports/createPowerBiAreaReportRoute.types";
import { NextResponse } from "next/server";

export type { PowerBiAreaQuerySpec, PowerBiAreaReportRouteConfig };

export function queriesFromList(
  queries: string[],
  targetKey: BiReportPowerBiTargetKey,
  labels?: readonly string[],
): PowerBiAreaQuerySpec[] {
  return queries.map((query, index) => ({
    query,
    targetKey,
    label: labels?.[index],
  }));
}

export function createPowerBiAreaReportGetHandler<TRow>(
  config: PowerBiAreaReportRouteConfig<TRow>,
) {
  return async function GET() {
    const auth = await getPowerBiRouteAuthContext();
    if (!auth.ok) {
      return auth.response;
    }

    const { token, reportContext } = auth;
    const area = reportContext.area;
    const year =
      config.year === "previous"
        ? getPreviousReportYear()
        : getCurrentReportYear();
    const specs = [config.getQueries(area)].flat();
    const tokenOptions = { amsaAccessToken: token };

    try {
      const data = await Promise.all(
        specs.map(async (spec, index) => {
          try {
            return await executePowerBiQuery(
              spec.query,
              resolveBiReportPowerBiTarget(spec.targetKey),
              tokenOptions,
            );
          } catch (err) {
            if (err instanceof PowerBiRequestError && specs.length > 1) {
              const label = spec.label ?? `query ${index + 1}`;
              const prefix = config.errorLabel ?? config.report;
              throw new PowerBiRequestError(
                `${prefix} ${year} ${label} query failed. ${err.message}`,
                err.status,
              );
            }

            throw err;
          }
        }),
      );

      return NextResponse.json(
        {
          ok: true,
          report: config.report,
          year,
          area,
          records: data.flatMap(config.normalize),
        },
        { headers: POWERBI_NO_CACHE_HEADERS },
      );
    } catch (err) {
      const status = err instanceof PowerBiRequestError ? err.status : 500;
      const message =
        err instanceof Error ? err.message : "Power BI request failed";

      return NextResponse.json(
        { ok: false, message },
        { status, headers: POWERBI_NO_CACHE_HEADERS },
      );
    }
  };
}
