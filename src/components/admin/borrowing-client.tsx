"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  X,
  Plus,
  Pencil,
  Eye,
  Trash2,
  FileText,
  RefreshCw,
  ArrowLeft,
  ScanText,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import {
  createBorrowingRecord,
  updateBorrowingRecord,
  removeBorrowing,
  type BorrowingActionState,
} from "@/actions/borrowing-actions";
import {
  processOCR,
  type OCRActionState,
} from "@/actions/ocr-actions";
import type { OCRResult } from "@/lib/ocr";
import { AppDatePicker } from "@/components/ui/app-date-picker";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type OwnerRow = {
  id: string;
  name: string;
  studentId: string;
  borrowCount: number;
};

type RecordRow = {
  id: string;
  ownerUserId: string;
  ownerName: string;
  ownerStudentId: string;
  requesterName: string;
  requestDate: string | null;
  source: string | null;
  additionalDetails: string | null;
  hasLicense: boolean;
  hasCertificate: boolean;
  licenseOriginalName: string | null;
  certificateOriginalName: string | null;
  createdAt: string;
};

type BorrowingClientProps = {
  owners: OwnerRow[];
  records: RecordRow[];
  currentQuery: string;
  page: number;
  hasMore: boolean;
  totalPages: number;
  totalCount: number;
};

type SearchResult = {
  id: string;
  name: string;
  studentId: string | null;
  email: string;
};

const emptyForm = {
  recordId: "",
  ownerUserId: "",
  ownerName: "",
  requesterName: "",
  requestDate: "",
  source: "",
  additionalDetails: "",
  licenseOriginalName: null as string | null,
  certificateOriginalName: null as string | null,
};

const OWNER_TITLE_PREFIX = /^(นาย|นางสาว|นาง|น\.ส\.)\s*/;

function normalizeOwnerLookup(value: string) {
  return value
    .replace(/^(?:ใช้)?เครื่องมือวิจัยของ\s*/i, "")
    .replace(/^เจ้าของเครื่องมือ(?:วิจัย)?\s*/i, "")
    .replace(OWNER_TITLE_PREFIX, "")
    .replace(/[()]/g, " ")
    .replace(/[.,]/g, " ")
    .replace(/\s+(ต[ำา]แหน่ง|สังกัด|ภาควิชา|คณะ|วิทยาลัย|มหาวิทยาลัย|จังหวัด).*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildOwnerSearchQueries(ownerName: string) {
  const normalized = normalizeOwnerLookup(ownerName);
  const parts = normalized.split(" ").filter(Boolean);
  const queries = new Set<string>();

  if (normalized.length >= 2) {
    queries.add(normalized);
  }
  if (parts.length >= 2) {
    queries.add(parts.slice(0, 2).join(" "));
    queries.add(parts.slice(-2).join(" "));
  }
  if (parts.length >= 3) {
    queries.add(parts[0]);
    queries.add(parts[parts.length - 1]);
  }

  return Array.from(queries);
}

function scoreOwnerCandidate(student: SearchResult, target: string) {
  const normalizedStudentName = normalizeOwnerLookup(student.name);

  if (normalizedStudentName === target) {
    return 100;
  }
  if (normalizedStudentName.startsWith(target) || target.startsWith(normalizedStudentName)) {
    return 80;
  }

  const targetParts = target.split(" ").filter(Boolean);
  const matchedParts = targetParts.filter((part) => normalizedStudentName.includes(part));

  return matchedParts.length * 10;
}

export function BorrowingClient({
  owners,
  records,
  currentQuery,
  page,
  hasMore,
  totalPages,
  totalCount,
}: BorrowingClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(currentQuery);
  const [selectedOwner, setSelectedOwner] = useState<OwnerRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState<RecordRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isEdit, setIsEdit] = useState(false);
  const [pending, setPending] = useState(false);
  const [actionResult, setActionResult] = useState<BorrowingActionState | null>(null);
  const [ownerSearch, setOwnerSearch] = useState("");
  const [ownerResults, setOwnerResults] = useState<SearchResult[]>([]);
  const [ownerSearching, setOwnerSearching] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [showOcrText, setShowOcrText] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<RecordRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // Persist File objects across re-renders so a failed submit (which the
  // browser clears from <input type="file">) doesn't force the user to
  // re-pick the file.
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [licenseRemoved, setLicenseRemoved] = useState(false);
  const [certificateRemoved, setCertificateRemoved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const licenseRef = useRef<HTMLInputElement>(null);
  const certificateRef = useRef<HTMLInputElement>(null);

  const ownerRecords = selectedOwner
    ? records.filter((r) => r.ownerUserId === selectedOwner.id)
    : [];

  const updateSearch = useCallback(
    (value: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set("q", value);
        else params.delete("q");
        params.delete("page");
        router.push(`/admin/borrowing?${params.toString()}`);
      }, 500);
    },
    [searchParams, router],
  );

  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setSearchInput(currentQuery);
    }
  }, [currentQuery]);

  // Derive the up-to-date owner from the refreshed `owners` prop so the
  // borrowCount shown inside the open dialog stays in sync after a record is
  // created/edited/deleted (router.refresh re-fetches `owners`).
  const effectiveOwner = useMemo(() => {
    if (!selectedOwner) return null;
    return owners.find((o) => o.id === selectedOwner.id) ?? selectedOwner;
  }, [owners, selectedOwner]);

  function clearSearch() {
    setSearchInput("");
    if (timerRef.current) clearTimeout(timerRef.current);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.delete("page");
    router.push(`/admin/borrowing?${params.toString()}`);
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) params.delete("page");
    else params.set("page", String(p));
    router.push(`/admin/borrowing?${params.toString()}`);
  }

  function openCreate() {
    setForm(emptyForm);
    setOwnerSearch("");
    setIsEdit(false);
    setActionResult(null);
    setOwnerResults([]);
    setOcrLoading(false);
    setOcrResult(null);
    setOcrError(null);
    setShowOcrText(false);
    setLicenseFile(null);
    setCertificateFile(null);
    setLicenseRemoved(false);
    setCertificateRemoved(false);
    if (licenseRef.current) licenseRef.current.value = "";
    if (certificateRef.current) certificateRef.current.value = "";
    setShowForm(true);
  }

  function openEdit(record: RecordRow) {
    setForm({
      recordId: record.id,
      ownerUserId: record.ownerUserId,
      ownerName: record.ownerName,
      requesterName: record.requesterName,
      requestDate: record.requestDate
        ? new Date(record.requestDate).toISOString().split("T")[0]
        : "",
      source: record.source ?? "",
      additionalDetails: record.additionalDetails ?? "",
      licenseOriginalName: record.licenseOriginalName,
      certificateOriginalName: record.certificateOriginalName,
    });
    setIsEdit(true);
    setActionResult(null);
    setOwnerSearch(record.ownerName);
    setOwnerResults([]);
    setOcrLoading(false);
    setOcrResult(null);
    setOcrError(null);
    setShowOcrText(false);
    setLicenseFile(null);
    setCertificateFile(null);
    setLicenseRemoved(false);
    setCertificateRemoved(false);
    if (licenseRef.current) licenseRef.current.value = "";
    if (certificateRef.current) certificateRef.current.value = "";
    setShowForm(true);
  }

  async function searchOwners(query: string) {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      return [] as SearchResult[];
    }

    const res = await fetch(
      `${BASE_PATH}/api/students/search?q=${encodeURIComponent(trimmedQuery)}`,
    );

    if (!res.ok) {
      return [] as SearchResult[];
    }

    const data = await res.json();
    return (data.students ?? []) as SearchResult[];
  }

  async function autoSelectOwnerFromOCR(ownerName: string) {
    const normalizedTarget = normalizeOwnerLookup(ownerName);
    if (normalizedTarget.length < 2) {
      return;
    }

    const queries = buildOwnerSearchQueries(ownerName);
    const candidateMap = new Map<string, SearchResult>();

    for (const query of queries) {
      const students = await searchOwners(query);
      for (const student of students) {
        candidateMap.set(student.id, student);
      }
    }

    const candidates = Array.from(candidateMap.values());
    const exactMatches = candidates.filter(
      (student) => normalizeOwnerLookup(student.name) === normalizedTarget,
    );

    if (exactMatches.length === 1) {
      selectOwner(exactMatches[0]);
      return;
    }

    if (candidates.length === 1) {
      selectOwner(candidates[0]);
      return;
    }

    const sortedCandidates = candidates.sort(
      (left, right) =>
        scoreOwnerCandidate(right, normalizedTarget) -
        scoreOwnerCandidate(left, normalizedTarget),
    );

    setOwnerSearch(normalizedTarget);
    setOwnerResults(sortedCandidates);
  }

  async function handleOCR() {
    const file = licenseRef.current?.files?.[0];
    if (!file) {
      setOcrError("กรุณาเลือกไฟล์ PDF ใบอนุญาตก่อนกดอ่านเอกสาร");
      return;
    }
    setOcrLoading(true);
    setOcrError(null);
    setOcrResult(null);
    try {
      const fd = new FormData();
      fd.append("licenseFile", file);
      const result: OCRActionState = await processOCR(fd);
      if (result.error) {
        setOcrError(result.error);
        return;
      }
      if (result.data) {
        const data = result.data;
        setOcrResult(data);
        setForm((f) => ({
          ...f,
          requesterName: data.requesterName ?? f.requesterName,
          requestDate: data.requestDate ?? f.requestDate,
          source: data.source ?? f.source,
          additionalDetails: data.additionalDetails ?? f.additionalDetails,
        }));
        setShowOcrText(true);

        // Auto-search student by extracted owner name
        if (data.ownerName) {
          try {
            await autoSelectOwnerFromOCR(data.ownerName);
          } catch {
            setOwnerSearch(normalizeOwnerLookup(data.ownerName));
          }
        }
      }
    } catch {
      setOcrError("เกิดข้อผิดพลาดที่ไม่คาดคิดในการอ่านเอกสาร");
    } finally {
      setOcrLoading(false);
    }
  }

  async function handleOwnerSearch(query: string) {
    setOwnerSearch(query);
    // Invalidate the previous selection only when the user has actually
    // changed the text away from the currently-selected owner's name. This
    // lets the user re-type the prefill name without losing ownerUserId,
    // while still forcing a fresh pick if they're searching for someone else.
    setForm((f) =>
      f.ownerUserId && f.ownerName !== query
        ? { ...f, ownerUserId: "", ownerName: "" }
        : f,
    );
    if (query.length < 2) {
      setOwnerResults([]);
      return;
    }
    setOwnerSearching(true);
    try {
      setOwnerResults(await searchOwners(query));
    } catch {
      // ignore
    }
    setOwnerSearching(false);
  }

  function selectOwner(student: SearchResult) {
    setForm((f) => ({ ...f, ownerUserId: student.id, ownerName: student.name }));
    setOwnerSearch(student.name);
    setOwnerResults([]);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setActionResult(null);
    // Rebuild FormData from form values + state-tracked files so that the
    // selected files survive a previous failed submit. We use onSubmit +
    // preventDefault rather than <form action={...}> because React 19 resets
    // the form (and clears <input type="file">.value) after an action resolves
    // — even on error. Preventing default keeps the file input intact.
    const formData = new FormData(e.currentTarget);
    const fd = new FormData();
    fd.set("ownerUserId", (formData.get("ownerUserId") as string) ?? "");
    fd.set("requesterName", (formData.get("requesterName") as string) ?? "");
    fd.set("source", (formData.get("source") as string) ?? "");
    fd.set("requestDate", (formData.get("requestDate") as string) ?? "");
    fd.set("additionalDetails", (formData.get("additionalDetails") as string) ?? "");
    if (isEdit) {
      fd.set("recordId", form.recordId);
      if (licenseRemoved) fd.set("removeLicense", "true");
      if (certificateRemoved) fd.set("removeCertificate", "true");
    }
    if (licenseFile) fd.set("licenseFile", licenseFile);
    if (certificateFile) fd.set("certificateFile", certificateFile);

    const action = isEdit ? updateBorrowingRecord : createBorrowingRecord;
    const result = await action({} as BorrowingActionState, fd);
    setActionResult(result);
    setPending(false);
    if (result.success) {
      setShowForm(false);
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!recordToDelete) return;
    const fd = new FormData();
    fd.set("recordId", recordToDelete.id);
    setDeleting(true);
    setDeleteError(null);
    const result = await removeBorrowing({} as BorrowingActionState, fd);
    setDeleting(false);
    if (result.success) {
      const deletedOwnerId = recordToDelete.ownerUserId;
      setRecordToDelete(null);
      // Optimistic update on the open dialog so the count drops instantly;
      // router.refresh() reconciles with server state in the background.
      if (selectedOwner && selectedOwner.id === deletedOwnerId) {
        setSelectedOwner({
          ...selectedOwner,
          borrowCount: Math.max(0, selectedOwner.borrowCount - 1),
        });
      }
      router.refresh();
    } else if (result.error) {
      setDeleteError(result.error);
    }
  }

  const formatDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("th-TH") : "—";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Button onClick={() => openCreate()} className="rounded gap-2">
          <Plus className="h-4 w-4" />
          เพิ่มรายการยืม
        </Button>

        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              updateSearch(e.target.value);
            }}
            placeholder="ค้นหาชื่อเจ้าของ, รหัส, ผู้ขอ..."
            className="rounded pl-9 pr-8"
          />
          {searchInput && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <span className="text-sm text-muted-foreground">
          ทั้งหมด {totalCount} คน
        </span>
      </div>

      {/* Owner table */}
      {owners.length === 0 ? (
        <div className="rounded border border-dashed p-10 text-center text-muted-foreground">
          ยังไม่มีรายการยืม
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-primary" />
            คลิกที่ชื่อเจ้าของเครื่องมือเพื่อดูรายการยืมทั้งหมด 
          </p>
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto rounded border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    ลำดับ
                  </th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    เจ้าของเครื่องมือ
                  </th>
                  <th className="px-4 py-3 text-center font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    จำนวนครั้ง
                  </th>
                </tr>
              </thead>
              <tbody>
                {owners.map((owner, i) => (
                  <tr
                    key={owner.id}
                    className="group border-t hover:bg-primary/5 cursor-pointer transition-colors"
                    onClick={() => setSelectedOwner(owner)}
                    title={`ดูรายการยืมของ ${owner.name}`}
                  >
                    <td className="px-4 py-3 text-muted-foreground">
                      {(page - 1) * PAGE_SIZE + i + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-primary group-hover:underline">
                        {owner.name}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {owner.studentId}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="inline-flex items-center justify-center h-6 min-w-6 rounded-full bg-muted text-xs font-medium group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          {owner.borrowCount}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-3">
            {owners.map((owner) => (
              <button
                key={owner.id}
                type="button"
                onClick={() => setSelectedOwner(owner)}
                className="group w-full rounded border bg-card p-4 text-left flex items-center gap-3 hover:border-primary hover:bg-primary/5 active:bg-primary/10 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-primary group-hover:underline">
                    {owner.name}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {owner.studentId}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 shrink-0">
                  <span className="inline-flex items-center justify-center h-6 min-w-6 rounded-full bg-muted text-xs font-medium group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    {owner.borrowCount}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {(page > 1 || hasMore) && (
        <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
      )}

      {/* Owner Detail Dialog (full-width) */}
      <Dialog open={!!selectedOwner} onOpenChange={(open) => !open && setSelectedOwner(null)}>
        <DialogContent className="sm:max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedOwner(null)}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <DialogTitle className="text-left">
                  {effectiveOwner?.name ?? selectedOwner?.name}
                </DialogTitle>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  {effectiveOwner?.studentId ?? selectedOwner?.studentId}
                </p>
              </div>
              <span className="ml-auto inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                ถูกยืม
                <span className="inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-muted text-xs font-medium">
                  {effectiveOwner?.borrowCount ?? selectedOwner?.borrowCount}
                </span>
                ครั้ง
              </span>
            </div>
            <DialogDescription className="sr-only">
              ประวัติการถูกยืมเครื่องมือวิจัยของเจ้าของรายนี้
            </DialogDescription>
          </DialogHeader>

          {selectedOwner && (
            <div className="space-y-4">
              {ownerRecords.length === 0 ? (
                <div className="rounded border border-dashed p-6 text-center text-sm text-muted-foreground">
                  ยังไม่มีรายการยืม
                </div>
              ) : (
                <div className="rounded border bg-card overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-2.5 text-left text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground">
                          ลำดับ
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground">
                          ผู้ขอใช้
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground">
                          จากองกรค์
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground">
                          วันที่อนุมัติ
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground">
                          แนบไฟล์
                        </th>
                        <th className="px-3 py-2.5 text-center text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground">
                          จัดการ
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {ownerRecords.map((record, i) => (
                        <tr key={record.id} className="border-t hover:bg-muted/30">
                          <td className="px-3 py-2.5 text-muted-foreground">{i + 1}</td>
                          <td className="px-3 py-2.5">{record.requesterName}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">
                            {record.source || "—"}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground">
                            {formatDate(record.requestDate)}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex flex-wrap gap-1.5">
                              {record.hasLicense && (
                                <a
                                  href={`${BASE_PATH}/api/borrowing/${record.id}/license?type=license`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 rounded border border-primary/30 bg-primary/5 px-2 py-1 text-xs font-medium text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                                  title="เปิดใบอนุญาตในแท็บใหม่"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <FileText className="h-3 w-3" />
                                  ใบอนุญาต
                                  <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                                </a>
                              )}
                              {record.hasCertificate && (
                                <a
                                  href={`${BASE_PATH}/api/borrowing/${record.id}/license?type=certificate`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 rounded border border-primary/30 bg-primary/5 px-2 py-1 text-xs font-medium text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                                  title="เปิดใบรับรองในแท็บใหม่"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <FileText className="h-3 w-3" />
                                  ใบรับรอง
                                  <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                                </a>
                              )}
                              {!record.hasLicense && !record.hasCertificate && (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowDetail(record)}
                                className="h-7 w-7 p-0"
                                title="ดูรายละเอียด"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(record)}
                                className="h-7 w-7 p-0"
                                title="แก้ไข"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setRecordToDelete(record)}
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                title="ลบ"
                                disabled={pending}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Record Detail Dialog */}
      <Dialog open={!!showDetail} onOpenChange={(open) => !open && setShowDetail(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>รายละเอียดการยืม</DialogTitle>
            <DialogDescription className="sr-only">
              ข้อมูลรายละเอียดของรายการยืม
            </DialogDescription>
          </DialogHeader>
          {showDetail && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
                <span className="text-muted-foreground">เจ้าของเครื่องมือ:</span>
                <span className="font-medium">{showDetail.ownerName}</span>
                <span className="text-muted-foreground">รหัสนักศึกษา:</span>
                <span className="font-mono">{showDetail.ownerStudentId}</span>
                <span className="text-muted-foreground">ผู้ขอใช้:</span>
                <span>{showDetail.requesterName}</span>
                <span className="text-muted-foreground">จากองกรค์:</span>
                <span>{showDetail.source || "—"}</span>
                <span className="text-muted-foreground">วันที่อนุมัติ:</span>
                <span>{formatDate(showDetail.requestDate)}</span>
                <span className="text-muted-foreground">วันที่บันทึก:</span>
                <span>{formatDate(showDetail.createdAt)}</span>
              </div>
              {showDetail.additionalDetails && (
                <div className="rounded border bg-muted/30 p-3">
                  <p className="text-muted-foreground text-xs mb-1">รายละเอียดเพิ่มเติม:</p>
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {showDetail.additionalDetails}
                  </p>
                </div>
              )}
              <div className="pt-2 space-y-1">
                <span className="text-muted-foreground text-xs">ไฟล์แนบ:</span>
                <div className="flex gap-3">
                  {showDetail.hasLicense ? (
                    <a
                      href={`${BASE_PATH}/api/borrowing/${showDetail.id}/license?type=license`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <FileText className="h-4 w-4" />
                      ใบอนุญาตจากสำนักทะเบียน
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">ไม่มีใบอนุญาต</span>
                  )}
                  {showDetail.hasCertificate ? (
                    <a
                      href={`${BASE_PATH}/api/borrowing/${showDetail.id}/license?type=certificate`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <FileText className="h-4 w-4" />
                      ใบรับรอง
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">ไม่มีใบรับรอง</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => !open && setShowForm(false)}>
        <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "แก้ไขรายการยืม" : "เพิ่มรายการยืมเครื่องมือวิจัย"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              ฟอร์มสำหรับเพิ่มหรือแก้ไขข้อมูลการยืมเครื่องมือวิจัย
            </DialogDescription>
          </DialogHeader>

          {actionResult?.error && (
            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {actionResult.error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {isEdit && <input type="hidden" name="recordId" value={form.recordId} />}
            <input type="hidden" name="ownerUserId" value={form.ownerUserId} />

            <div className="space-y-1.5">
              <label className="text-sm font-medium block">
                เจ้าของเครื่องมือ <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={ownerSearch}
                  onChange={(e) => handleOwnerSearch(e.target.value)}
                  placeholder="ค้นหาชื่อหรือรหัสนักศึกษา..."
                  className="pl-9"
                  disabled={isEdit}
                />
              </div>
              {ownerSearching && (
                <p className="text-xs text-muted-foreground">กำลังค้นหา...</p>
              )}
              {ownerResults.length > 0 && (
                <div className="border rounded max-h-40 overflow-y-auto bg-card">
                  {ownerResults.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => selectOwner(s)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex justify-between items-center"
                    >
                      <span>{s.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {s.studentId}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {form.ownerName && (
                <p className="text-xs text-primary">เลือกแล้ว: {form.ownerName}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium block">
                  ผู้ขอใช้ <span className="text-destructive">*</span>
                </label>
                <Input
                  name="requesterName"
                  value={form.requesterName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, requesterName: e.target.value }))
                  }
                  placeholder="ชื่อผู้ขอใช้"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium block">
                  จากองกรค์ <span className="text-destructive">*</span>
                </label>
                <Input
                  name="source"
                  value={form.source}
                  onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                  placeholder="เช่น สำนักทะเบียน, บัณฑิตศึกษา"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium block">วันที่อนุมัติ</label>
              <AppDatePicker
                value={form.requestDate}
                onChange={(v) => setForm((f) => ({ ...f, requestDate: v }))}
                name="requestDate"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium block">
                รายละเอียดเพิ่มเติม
                <span className="block text-xs font-normal text-muted-foreground">
                  ตำแหน่ง · สังกัด · หัวข้อวิจัย (กรอกอัตโนมัติจาก OCR หรือพิมพ์เอง)
                </span>
              </label>
              <Textarea
                name="additionalDetails"
                value={form.additionalDetails}
                onChange={(e) =>
                  setForm((f) => ({ ...f, additionalDetails: e.target.value }))
                }
                placeholder="เช่น นางสาว... ตำแหน่ง... สังกัด... ซึ่งเป็นผู้วิจัย เรื่อง..."
                rows={3}
                className="resize-y"
              />
            </div>

            {/* License upload + OCR — grouped together because OCR reads from license */}
            <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium block">
                  ใบอนุญาตจากสำนักทะเบียน
                </label>
                {isEdit && form.licenseOriginalName && !licenseRemoved && (
                  <div className="flex items-center gap-2 rounded border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="text-muted-foreground">ไฟล์ปัจจุบัน:</span>
                    <a
                      href={`${BASE_PATH}/api/borrowing/${form.recordId}/license?type=license`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline truncate inline-flex items-center gap-1"
                      title="เปิดในแท็บใหม่"
                    >
                      {form.licenseOriginalName}
                      <ExternalLink className="h-3 w-3 opacity-70" />
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setLicenseRemoved(true);
                        setLicenseFile(null);
                        if (licenseRef.current) licenseRef.current.value = "";
                      }}
                      className="ml-auto text-muted-foreground hover:text-destructive"
                      title="ลบไฟล์นี้ (กดบันทึกเพื่อยืนยัน)"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                {(!isEdit || !form.licenseOriginalName || licenseRemoved) && (
                  <>
                    <input
                      ref={licenseRef}
                      type="file"
                      name="licenseFile"
                      accept="application/pdf"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        setLicenseFile(f);
                      }}
                      className="text-sm file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 w-full"
                    />
                    {licenseFile ? (
                      <p className="text-xs text-primary flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 shrink-0" />
                        เลือกแล้ว: <span className="font-medium truncate">{licenseFile.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setLicenseFile(null);
                            if (licenseRef.current) licenseRef.current.value = "";
                          }}
                          className="ml-auto text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        PDF ไม่เกิน 10 MB
                        {isEdit && licenseRemoved && " · จะถูกลบเมื่อบันทึก"}
                        {!isEdit && " · อัปโหลดแล้วกดปุ่ม OCR ด้านล่างเพื่อกรอกฟอร์มอัตโนมัติ"}
                      </p>
                    )}
                  </>
                )}
              </div>

              {!isEdit && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleOCR}
                    disabled={ocrLoading}
                    className="rounded gap-2"
                  >
                    {ocrLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <ScanText className="h-4 w-4" />
                    )}
                    {ocrLoading ? "กำลังอ่าน..." : "อ่านเอกสารอัตโนมัติ (OCR)"}
                  </Button>

                  {ocrError && (
                    <div className="flex items-start gap-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{ocrError}</span>
                    </div>
                  )}

                  {ocrResult && (
                    <div className="rounded border bg-background">
                      <button
                        type="button"
                        onClick={() => setShowOcrText((s) => !s)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
                      >
                        <span>ข้อความที่ OCR อ่านได้ · OCR Extracted Data</span>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${showOcrText ? "rotate-180" : ""}`}
                        />
                      </button>
                      {showOcrText && (
                        <div className="border-t px-3 py-2.5 space-y-1.5 text-xs">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                            <div>
                              <span className="text-muted-foreground">ผู้ขอใช้ · Requester:</span>
                              <p className="font-medium">{ocrResult.requesterName ?? "—"}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">วันที่ · Date:</span>
                              <p className="font-medium">{ocrResult.requestDate ?? "—"}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">จากองกรค์ · Source:</span>
                              <p className="font-medium whitespace-pre-wrap">{ocrResult.source ?? "—"}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">เจ้าของเครื่องมือ · Tool Owner:</span>
                              <p className="font-medium">{ocrResult.ownerName ?? "—"}</p>
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">รายละเอียดเพิ่มเติม · Additional Details:</span>
                            <p className="font-medium whitespace-pre-wrap break-words">
                              {ocrResult.additionalDetails ?? "—"}
                            </p>
                          </div>
                          <p className="text-muted-foreground/70 pt-1 italic">
                            ตรวจสอบและแก้ไขค่าในฟอร์มด้านบนได้ · Verify and edit values above
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium block">ใบรับรอง</label>
              {isEdit && form.certificateOriginalName && !certificateRemoved && (
                <div className="flex items-center gap-2 rounded border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="text-muted-foreground">ไฟล์ปัจจุบัน:</span>
                  <a
                    href={`${BASE_PATH}/api/borrowing/${form.recordId}/license?type=certificate`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline truncate inline-flex items-center gap-1"
                    title="เปิดในแท็บใหม่"
                  >
                    {form.certificateOriginalName}
                    <ExternalLink className="h-3 w-3 opacity-70" />
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setCertificateRemoved(true);
                      setCertificateFile(null);
                      if (certificateRef.current) certificateRef.current.value = "";
                    }}
                    className="ml-auto text-muted-foreground hover:text-destructive"
                    title="ลบไฟล์นี้ (กดบันทึกเพื่อยืนยัน)"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              {(!isEdit || !form.certificateOriginalName || certificateRemoved) && (
                <>
                  <input
                    ref={certificateRef}
                    type="file"
                    name="certificateFile"
                    accept="application/pdf"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setCertificateFile(f);
                    }}
                    className="text-sm file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 w-full"
                  />
                  {certificateFile ? (
                    <p className="text-xs text-primary flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      เลือกแล้ว: <span className="font-medium truncate">{certificateFile.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCertificateFile(null);
                          if (certificateRef.current) certificateRef.current.value = "";
                        }}
                        className="ml-auto text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      PDF ไม่เกิน 10 MB (ไม่จำเป็น)
                      {isEdit && certificateRemoved && " · จะถูกลบเมื่อบันทึก"}
                    </p>
                  )}
                </>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                className="rounded"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={pending}
                className="rounded gap-2"
              >
                {pending && <RefreshCw className="h-4 w-4 animate-spin" />}
                บันทึก
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={!!recordToDelete}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setRecordToDelete(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <Trash2 className="h-4 w-4" />
              </span>
              ยืนยันการลบรายการ
            </DialogTitle>
            <DialogDescription>
              การกระทำนี้ไม่สามารถย้อนกลับได้ · This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {recordToDelete && (
            <div className="rounded border bg-muted/30 p-3 text-sm space-y-1.5">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">เจ้าของเครื่องมือ:</span>
                <span className="font-medium text-right">{recordToDelete.ownerName}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">ผู้ขอใช้:</span>
                <span className="font-medium text-right">{recordToDelete.requesterName}</span>
              </div>
              {recordToDelete.source && (
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">จากองกรค์:</span>
                  <span className="font-medium text-right">{recordToDelete.source}</span>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">วันที่อนุมัติ:</span>
                <span className="font-medium text-right">{formatDate(recordToDelete.requestDate)}</span>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            ไฟล์แนบ (ใบอนุญาต/ใบรับรอง) จะถูกลบออกจากระบบด้วย
          </p>

          {deleteError && (
            <div className="flex items-start gap-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{deleteError}</span>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRecordToDelete(null);
                setDeleteError(null);
              }}
              disabled={deleting}
              className="rounded"
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded gap-2"
            >
              {deleting && <RefreshCw className="h-4 w-4 animate-spin" />}
              {deleting ? "กำลังลบ..." : "ลบรายการ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const PAGE_SIZE = 10;

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="rounded text-xs"
      >
        ก่อนหน้า
      </Button>
      <span className="text-xs text-muted-foreground px-2">
        หน้า {page} / {totalPages}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="rounded text-xs"
      >
        ถัดไป
      </Button>
    </div>
  );
}
