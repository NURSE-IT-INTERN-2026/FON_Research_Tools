import db from "@/lib/db";
import { InventoryClient } from "@/components/admin/inventory-client";

export default async function InventoryPage() {
  const [tools, categories] = await Promise.all([
    db.tool.findMany({ orderBy: { name: "asc" } }),
    db.tool
      .findMany({
        select: { category: true },
        distinct: ["category"],
        orderBy: { category: "asc" },
      })
      .then((rows) => rows.map((r) => r.category)),
  ]);

  const serialized = tools.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category,
    serialNumber: t.serialNumber,
    imageUrl: t.imageUrl,
    status: t.status,
    location: t.location,
    isActive: t.isActive,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">คลังอุปกรณ์</h1>
        <p className="text-muted-foreground mt-1">
          จัดการอุปกรณ์ทั้งหมดในระบบ
        </p>
      </div>

      <InventoryClient tools={serialized} categories={categories} />
    </div>
  );
}
