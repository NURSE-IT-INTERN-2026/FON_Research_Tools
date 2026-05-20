"use server";

import { requireRole } from "@/lib/auth";
import db from "@/lib/db";

export type SearchResult = {
  type: "student" | "document";
  id: string;
  label: string;
  sublabel: string | null;
};

export async function searchAll(query: string): Promise<SearchResult[]> {
  await requireRole("ADMIN");

  const q = query.trim();
  if (!q) return [];

  const [students, documents] = await Promise.all([
    db.profile.findMany({
      where: {
        userRole: { role: "STUDENT" },
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { studentId: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: { id: true, name: true, studentId: true },
    }),
    db.document.findMany({
      where: {
        title: { contains: q, mode: "insensitive" },
      },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        profile: { select: { name: true } },
      },
    }),
  ]);

  const results: SearchResult[] = [
    ...students.map((s) => ({
      type: "student" as const,
      id: s.id,
      label: s.name,
      sublabel: s.studentId ?? null,
    })),
    ...documents.map((d) => ({
      type: "document" as const,
      id: d.id,
      label: d.title,
      sublabel: d.profile.name,
    })),
  ];

  return results;
}
