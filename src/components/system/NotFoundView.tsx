import Link from "next/link";

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
    <div className="app-card p-3">
      <h1 className="h5 mb-2">{title}</h1>
      <p className="text-secondary mb-3">{description}</p>
      <Link href={actionHref} className="btn btn-primary w-100">
        {actionLabel}
      </Link>
    </div>
  );
}
