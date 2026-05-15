import { ToolStatus } from "@/generated/prisma/enums";
import db from "@/lib/db";
import { ToolCatalogClient } from "@/components/borrower/tool-catalog-client";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; status?: string }>;
}) {
  const { q, category, status } = await searchParams;

  const where = {
    isActive: true,
    ...(q && { name: { contains: q, mode: "insensitive" as const } }),
    ...(category && category !== "ALL" && { category }),
    ...(status && status !== "ALL" && { status: status as ToolStatus }),
  };

  const [tools, categories] = await Promise.all([
    db.tool.findMany({
      where,
      orderBy: { name: "asc" },
    }),
    db.tool.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    }),
  ]);

  const serializedTools = tools.map((tool) => ({
    id: tool.id,
    name: tool.name,
    description: tool.description,
    category: tool.category,
    serialNumber: tool.serialNumber,
    imageUrl: tool.imageUrl,
    status: tool.status,
    location: tool.location,
  }));

  const categoryList = categories.map((c) => c.category);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight heading-accent">คลังอุปกรณ์</h1>
        <p className="text-muted-foreground mt-3">
          ค้นหาและยืมอุปกรณ์วิจัย
        </p>
      </div>

      <ToolCatalogClient
        tools={serializedTools}
        categories={categoryList}
        filters={{ q: q ?? "", category: category ?? "", status: status ?? "" }}
      />
    </div>
  );
}
