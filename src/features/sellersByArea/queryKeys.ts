export const sellersByAreaKeys = {
  all: ["sellers-by-area"] as const,
  ensure: () => [...sellersByAreaKeys.all, "ensure"] as const,
};
