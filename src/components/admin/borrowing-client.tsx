"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
} from "lucide-react";
import {
  createBorrowingRecord,
  updateBorrowingRecord,
  removeBorrowing,
  type BorrowingActionState,
} from "@/actions/borrowing-actions";
import { AppDatePicker } from "@/components/ui/app-date-picker";

type RecordRow = {
  id: string;
  ownerUserId: string;
  ownerName: string;
  ownerStudentId: string;
  requesterName: string;
  requestDate: string | null;
  source: string | null;
  hasLicense: boolean;
  hasCertificate: boolean;
  createdAt: string;
};

type BorrowingClientProps = {
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
};

export function BorrowingClient({
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
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState<RecordRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isEdit, setIsEdit] = useState(false);
  const [pending, setPending] = useState(false);
  const [actionResult, setActionResult] = useState<BorrowingActionState | null>(null);
  const [ownerSearch, setOwnerSearch] = useState("");
  const [ownerResults, setOwnerResults] = useState<SearchResult[]>([]);
  const [ownerSearching, setOwnerSearching] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const licenseRef = useRef<HTMLInputElement>(null);
  const certificateRef = useRef<HTMLInputElement>(null);

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
    setIsEdit(false);
    setActionResult(null);
    setOwnerSearch("");
    setOwnerResults([]);
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
    });
    setIsEdit(true);
    setActionResult(null);
    setOwnerSearch(record.ownerName);
    setOwnerResults([]);
    if (licenseRef.current) licenseRef.current.value = "";
    if (certificateRef.current) certificateRef.current.value = "";
    setShowForm(true);
  }

  async function handleOwnerSearch(query: string) {
    setOwnerSearch(query);
    if (query.length < 2) {
      setOwnerResults([]);
      return;
    }
    setOwnerSearching(true);
    try {
      const res = await fetch(
        `/researchtool/api/students/search?q=${encodeURIComponent(query)}`,
      );
      if (res.ok) {
        const data = await res.json();
        setOwnerResults(data.students ?? []);
      }
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

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setActionResult(null);
    const action = isEdit ? updateBorrowingRecord : createBorrowingRecord;
    const result = await action({} as BorrowingActionState, formData);
    setActionResult(result);
    setPending(false);
    if (result.success) {
      setShowForm(false);
      router.refresh();
    }
  }

  async function handleDelete(recordId: string) {
    if (!confirm("ต้องการลบรายการนี้?")) return;
    const fd = new FormData();
    fd.set("recordId", recordId);
    setPending(true);
    await removeBorrowing({} as BorrowingActionState, fd);
    setPending(false);
    router.refresh();
  }

  const formatDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("th-TH") : "—";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Button onClick={openCreate} className="rounded gap-2">
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
          ทั้งหมด {totalCount} รายการ
        </span>
      </div>

      {/* Table */}
      {records.length === 0 ? (
        <div className="rounded border border-dashed p-10 text-center text-muted-foreground">
          ยังไม่มีรายการยืม
        </div>
      ) : (
        <>
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
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    ผู้ขอใช้
                  </th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    จากองกรค์
                  </th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    วันที่อนุมัติ
                  </th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    แนบไฟล์
                  </th>
                  <th className="px-4 py-3 text-center font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, i) => (
                  <tr
                    key={record.id}
                    className="border-t transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 text-muted-foreground">
                      {(page - 1) * 10 + i + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{record.ownerName}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {record.ownerStudentId}
                      </div>
                    </td>
                    <td className="px-4 py-3">{record.requesterName}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {record.source || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(record.requestDate)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {record.hasLicense && (
                          <a
                            href={`/researchtool/api/borrowing/${record.id}/license?type=license`}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <FileText className="h-3 w-3" />
                            ใบอนุญาต
                          </a>
                        )}
                        {record.hasCertificate && (
                          <a
                            href={`/researchtool/api/borrowing/${record.id}/license?type=certificate`}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <FileText className="h-3 w-3" />
                            ใบรับรอง
                          </a>
                        )}
                        {!record.hasLicense && !record.hasCertificate && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowDetail(record)}
                          className="h-8 w-8 p-0"
                          title="ดูรายละเอียด"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(record)}
                          className="h-8 w-8 p-0"
                          title="แก้ไข"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(record.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          title="ลบ"
                          disabled={pending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-3">
            {records.map((record) => (
              <div key={record.id} className="rounded border bg-card p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{record.ownerName}</p>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(record)}
                      className="h-7 w-7 p-0"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(record.id)}
                      className="h-7 w-7 p-0 text-destructive"
                      disabled={pending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  {record.ownerStudentId}
                </p>
                <p className="text-xs mt-1">ผู้ขอ: {record.requesterName}</p>
                <p className="text-xs text-muted-foreground">
                  วันที่: {formatDate(record.requestDate)} | จากองกรค์:{" "}
                  {record.source || "—"}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {(page > 1 || hasMore) && (
        <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
      )}

      {/* Detail Dialog */}
      <Dialog open={!!showDetail} onOpenChange={(open) => !open && setShowDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>รายละเอียดการยืม</DialogTitle>
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
              <div className="pt-2 space-y-1">
                <span className="text-muted-foreground text-xs">ไฟล์แนบ:</span>
                <div className="flex gap-3">
                  {showDetail.hasLicense ? (
                    <a
                      href={`/researchtool/api/borrowing/${showDetail.id}/license?type=license`}
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
                      href={`/researchtool/api/borrowing/${showDetail.id}/license?type=certificate`}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "แก้ไขรายการยืม" : "เพิ่มรายการยืมเครื่องมือวิจัย"}
            </DialogTitle>
          </DialogHeader>

          {actionResult?.error && (
            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {actionResult.error}
            </div>
          )}

          <form action={handleSubmit} className="space-y-4">
            {isEdit && <input type="hidden" name="recordId" value={form.recordId} />}
            <input type="hidden" name="ownerUserId" value={form.ownerUserId} />

            {/* เจ้าของเครื่องมือ — search & select */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                เจ้าของเครื่องมือ <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={ownerSearch}
                  onChange={(e) => handleOwnerSearch(e.target.value)}
                  placeholder="ค้นหาชื่อหรือรหัสนักศึกษา..."
                  className="pl-9"
                />
              </div>
              {ownerSearching && (
                <p className="text-xs text-muted-foreground mt-1">กำลังค้นหา...</p>
              )}
              {ownerResults.length > 0 && (
                <div className="border rounded mt-1 max-h-40 overflow-y-auto bg-card">
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
                <p className="text-xs text-primary mt-1">เลือกแล้ว: {form.ownerName}</p>
              )}
            </div>

            {/* ผู้ขอใช้ */}
            <div>
              <label className="text-sm font-medium mb-1 block">
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

            {/* จากองกรค์ */}
            <div>
              <label className="text-sm font-medium mb-1 block">
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

            {/* วันที่อนุมัติ */}
            <div>
              <label className="text-sm font-medium mb-1 block">วันที่อนุมัติ</label>
              <AppDatePicker
                value={form.requestDate}
                onChange={(v) => setForm((f) => ({ ...f, requestDate: v }))}
                name="requestDate"
              />
            </div>

            {/* แนบไฟล์ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  ใบอนุญาตจากสำนักทะเบียน
                </label>
                <input
                  ref={licenseRef}
                  type="file"
                  name="licenseFile"
                  accept="application/pdf"
                  className="text-sm file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-muted file:text-foreground hover:file:bg-muted/80"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  PDF ไม่เกิน 10 MB (ไม่จำเป็น)
                </p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">ใบรับรอง</label>
                <input
                  ref={certificateRef}
                  type="file"
                  name="certificateFile"
                  accept="application/pdf"
                  className="text-sm file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-muted file:text-foreground hover:file:bg-muted/80"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  PDF ไม่เกิน 10 MB (ไม่จำเป็น)
                </p>
              </div>
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
              <Button type="submit" disabled={pending} className="rounded gap-2">
                {pending && <RefreshCw className="h-4 w-4 animate-spin" />}
                บันทึก
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
