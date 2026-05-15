import { Wrench, MapPin, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";

export type ToolCardData = {
  id: string;
  name: string;
  description: string;
  category: string;
  serialNumber: string;
  imageUrl: string | null;
  status: string;
  location: string;
};

type ToolCardProps = {
  tool: ToolCardData;
};

export function ToolCard({ tool }: ToolCardProps) {
  const isAvailable = tool.status === "AVAILABLE";

  return (
    <div className="rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative aspect-video bg-muted flex items-center justify-center">
        {tool.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tool.imageUrl}
            alt={tool.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Wrench className="h-12 w-12 text-muted-foreground/40" />
        )}
        <div className="absolute top-3 right-3">
          <StatusBadge status={tool.status} />
        </div>
      </div>

      <div className="p-4 space-y-2">
        <h3 className="font-semibold leading-tight">{tool.name}</h3>
        <p className="text-xs font-medium text-primary">{tool.category}</p>
        {tool.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {tool.description}
          </p>
        )}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {tool.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {tool.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Hash className="h-3 w-3" />
            {tool.serialNumber}
          </span>
        </div>
      </div>

      <div className="px-4 pb-4">
        <Button
          className="w-full"
          variant={isAvailable ? "default" : "outline"}
          disabled={!isAvailable}
          asChild={isAvailable}
        >
          {isAvailable ? (
            <span>ยืมอุปกรณ์</span>
          ) : (
            <span>ไม่พร้อมให้ยืม</span>
          )}
        </Button>
      </div>
    </div>
  );
}
