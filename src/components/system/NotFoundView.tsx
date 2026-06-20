import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
};

export default function NotFoundView({
  title = "Δεν βρέθηκε",
  description = "Η σελίδα που ζητήσατε δεν υπάρχει ή δεν είναι διαθέσιμη.",
  actionHref = "/",
  actionLabel = "Επιστροφή στην αρχική",
}: Props) {
  return (
    <div className="app-card p-5">
      <h1 className="mb-2 text-lg font-semibold">{title}</h1>
      <p className="mb-3 text-muted-foreground">{description}</p>
      <Link
        href={actionHref}
        className={cn(buttonVariants(), "w-full")}
      >
        {actionLabel}
      </Link>
    </div>
  );
}
