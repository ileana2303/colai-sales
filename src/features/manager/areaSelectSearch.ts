export function normalizeAreaSearch(value: string) {
  return value.trim().toLocaleLowerCase("el-GR");
}

export function matchesAreaSearch(area: string, query: string) {
  if (!normalizeAreaSearch(query)) return true;
  return normalizeAreaSearch(area).includes(normalizeAreaSearch(query));
}

export function filterAreasBySearch(areas: string[], query: string) {
  return areas.filter((area) => matchesAreaSearch(area, query));
}
