import type { ReportMatrixExportMember } from "@/features/powerBI/reportMatrixVisibleRows";
import type { ReportMatrixPptxSlideDefinition } from "@/features/powerBI/types/reportMatrixPptxExport.types";

type BuildPptxSlidePlanInput = {
  effectiveSellerFilter: string;
  effectiveTeamFilter: string;
  members: ReportMatrixExportMember[];
  resolveSellerLabel: (seller: string) => string;
  resolveTeamLabel: (team: string) => string;
  teams: string[];
};

function createSlide(
  title: string,
  teamFilter: string,
  sellerFilter: string,
  teamLabel: string,
  sellerLabel: string,
): ReportMatrixPptxSlideDefinition {
  return {
    sellerFilter,
    sellerLabel,
    teamFilter,
    teamLabel,
    title,
  };
}

export function buildPptxSlidePlan({
  effectiveSellerFilter,
  effectiveTeamFilter,
  members,
  resolveSellerLabel,
  resolveTeamLabel,
  teams,
}: BuildPptxSlidePlanInput): ReportMatrixPptxSlideDefinition[] {
  if (effectiveSellerFilter) {
    const member = members.find(
      (entry) => entry.seller === effectiveSellerFilter,
    );
    const team = member?.team ?? effectiveTeamFilter;
    const teamLabel = resolveTeamLabel(team);
    const sellerLabel =
      member?.sellerLabel ?? resolveSellerLabel(effectiveSellerFilter);

    return [
      createSlide(
        `Σύνολα ομάδας: ${teamLabel}`,
        team,
        "",
        teamLabel,
        "Όλα",
      ),
      createSlide(
        `Πωλητής: ${sellerLabel}`,
        team,
        effectiveSellerFilter,
        teamLabel,
        sellerLabel,
      ),
    ];
  }

  if (effectiveTeamFilter) {
    const teamLabel = resolveTeamLabel(effectiveTeamFilter);
    const teamMembers = members.filter(
      (member) => member.team === effectiveTeamFilter,
    );

    return [
      createSlide(`Ομάδα: ${teamLabel}`, effectiveTeamFilter, "", teamLabel, "Όλα"),
      ...teamMembers.map((member) =>
        createSlide(
          `Πωλητής: ${member.sellerLabel}`,
          effectiveTeamFilter,
          member.seller,
          teamLabel,
          member.sellerLabel,
        ),
      ),
    ];
  }

  return [
    createSlide("Συνολική προβολή", "", "", "Όλα", "Όλα"),
    ...teams.map((team) => {
      const teamLabel = resolveTeamLabel(team);
      return createSlide(`Ομάδα: ${teamLabel}`, team, "", teamLabel, "Όλα");
    }),
    ...members.map((member) => {
      const teamLabel = resolveTeamLabel(member.team);
      return createSlide(
        `Πωλητής: ${member.sellerLabel}`,
        member.team,
        member.seller,
        teamLabel,
        member.sellerLabel,
      );
    }),
  ];
}
