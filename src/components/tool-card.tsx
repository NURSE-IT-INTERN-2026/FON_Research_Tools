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
  onRequest?: (tool: ToolCardData) => void;
};

export function ToolCard({ tool, onRequest }: ToolCardProps) {
  const isAvailable = tool.status === "AVAILABLE";

  return (
    <div className="rounded border bg-card overflow-hidden transition-all hover:border-foreground/15 hover:shadow-md">
      <div className="relative aspect-video bg-muted flex items-center justify-center">
        {tool.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tool.imageUrl}
            alt={tool.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Wrench className="h-12 w-12 text-muted-foreground/30" />
        )}
        <div className="absolute top-2.5 right-2.5">
          <StatusBadge status={tool.status} />
        </div>
      </div>

      <div className="p-4 space-y-2">
        <h3 className="font-heading font-semibold leading-tight">{tool.name}</h3>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">{tool.category}</p>
        {tool.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {tool.description}
          </p>
        )}
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
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
          className="w-full rounded font-semibold"
          variant={isAvailable ? "default" : "outline"}
          disabled={!isAvailable}
          onClick={isAvailable && onRequest ? () => onRequest(tool) : undefined}
        >
          {isAvailable ? "ขอใช้อุปกรณ์" : "ไม่พร้อมให้ใช้"}
        </Button>
      </div>
    </div>
  );
}
