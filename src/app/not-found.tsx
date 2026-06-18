import NotFoundView from "@/components/system/NotFoundView";

export default function NotFound() {
  return (
    <div className="d-flex justify-content-center">
      <div className="w-100" style={{ maxWidth: 520 }}>
        <NotFoundView />
      </div>
    </div>
  );
}
