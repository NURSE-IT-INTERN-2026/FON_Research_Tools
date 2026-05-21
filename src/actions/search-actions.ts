"use server";

import { requireRole } from "@/lib/auth";
import db from "@/lib/db";

export type SearchResult = {
  type: "student" | "document";
  id: string;
  label: string;
  sublabel: string | null;
  ownerId: string;
};

export async function searchAll(query: string): Promise<SearchResult[]> {
  await requireRole("ADMIN");

  const q = query.trim();
  if (!q) return [];

  const [students, thesisStudents, documents] = await Promise.all([
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
    db.profile.findMany({
      where: {
        userRole: { role: "STUDENT" },
        OR: [
          { thesisTitleTh: { contains: q, mode: "insensitive" } },
          { thesisTitleEn: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: { id: true, name: true, thesisTitleTh: true },
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
        userId: true,
        profile: { select: { name: true } },
      },
    }),
  ]);

  const seenIds = new Set<string>();

  const results: SearchResult[] = [];

  for (const s of students) {
    seenIds.add(s.id);
    results.push({
      type: "student",
      id: s.id,
      label: s.name,
      sublabel: s.studentId ?? null,
      ownerId: s.id,
    });
  }

  for (const t of thesisStudents) {
    if (seenIds.has(t.id)) continue;
    seenIds.add(t.id);
    results.push({
      type: "student",
      id: t.id,
      label: t.name,
      sublabel: t.thesisTitleTh ?? null,
      ownerId: t.id,
    });
  }

  for (const d of documents) {
    results.push({
      type: "document",
      id: d.id,
      label: d.title,
      sublabel: d.profile.name,
      ownerId: d.userId,
    });
  }

  return results;
}
