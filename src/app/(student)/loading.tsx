export default function StudentLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-48 bg-muted rounded" />
        <div className="h-4 w-72 bg-muted rounded mt-3" />
      </div>
      <div className="rounded border bg-card p-5 space-y-3">
        <div className="h-4 w-28 bg-muted rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="h-10 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
        </div>
      </div>
      <div className="rounded border bg-card p-5 space-y-3">
        <div className="h-4 w-32 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
      </div>
      <div className="rounded border bg-card p-5 space-y-4">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
        <div className="h-8 w-28 bg-muted rounded" />
      </div>
    </div>
  );
}
