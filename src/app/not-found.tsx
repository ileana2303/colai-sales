import NotFoundView from "@/components/system/NotFoundView";

export default function NotFound() {
  return (
    <div className="flex justify-center">
      <div className="w-full" style={{ maxWidth: 520 }}>
        <NotFoundView />
      </div>
    </div>
  );
}
