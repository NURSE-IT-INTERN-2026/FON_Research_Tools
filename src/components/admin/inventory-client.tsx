"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/status-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  saveTool,
  toggleToolStatus,
  deactivateTool,
  type ActionState,
} from "@/actions/tool-actions";
import {
  Plus,
  Pencil,
  Wrench,
  ToggleLeft,
  Trash2,
} from "lucide-react";

export type ToolRow = {
  id: string;
  name: string;
  description: string;
  category: string;
  serialNumber: string;
  imageUrl: string | null;
  status: string;
  location: string;
  isActive: boolean;
};

type InventoryClientProps = {
  tools: ToolRow[];
  categories: string[];
};

function ToolFormModal({
  open,
  onOpenChange,
  tool,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tool: ToolRow | null;
  categories: string[];
}) {
  const isEdit = !!tool;
  const [state, formAction, pending] = useActionState(saveTool, {} as ActionState);

  useEffect(() => {
    if (state.success) {
      toast.success(isEdit ? "แก้ไขอุปกรณ์สำเร็จ" : "เพิ่มอุปกรณ์สำเร็จ");
      onOpenChange(false);
    }
  }, [state.success, isEdit, onOpenChange]);

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded">
        <DialogHeader>
          <DialogTitle className="font-heading font-bold tracking-tight">
            {isEdit ? "แก้ไขอุปกรณ์" : "เพิ่มอุปกรณ์ใหม่"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "แก้ไขข้อมูลอุปกรณ์"
              : "กรอกข้อมูลอุปกรณ์ที่ต้องการเพิ่ม"}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="grid gap-4 py-2">
          {isEdit && (
            <input type="hidden" name="id" value={tool.id} />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ชื่ออุปกรณ์ *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={tool?.name ?? ""}
                required
                className="rounded"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serialNumber" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">หมายเลขซีเรียล *</Label>
              <Input
                id="serialNumber"
                name="serialNumber"
                defaultValue={tool?.serialNumber ?? ""}
                required
                className="rounded"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">รายละเอียด</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={tool?.description ?? ""}
              rows={2}
              className="rounded"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">หมวดหมู่</Label>
              <Input
                id="category"
                name="category"
                defaultValue={tool?.category ?? ""}
                list="categories"
                className="rounded"
              />
              <datalist id="categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">สถานที่ตั้ง</Label>
              <Input
                id="location"
                name="location"
                defaultValue={tool?.location ?? ""}
                className="rounded"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="imageUrl" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">URL รูปภาพ</Label>
              <Input
                id="imageUrl"
                name="imageUrl"
                type="url"
                defaultValue={tool?.imageUrl ?? ""}
                placeholder="https://..."
                className="rounded"
              />
            </div>
            {!isEdit && (
              <div className="space-y-2">
                <Label htmlFor="status" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">สถานะ</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue="AVAILABLE"
                  className="flex h-9 w-full rounded border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="AVAILABLE">พร้อมใช้งาน</option>
                  <option value="MAINTENANCE">ซ่อมบำรุง</option>
                </select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded"
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={pending} className="rounded font-semibold">
              {pending
                ? "กำลังบันทึก..."
                : isEdit
                  ? "บันทึกการแก้ไข"
                  : "เพิ่มอุปกรณ์"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ToggleButton({ toolId, currentStatus }: { toolId: string; currentStatus: string }) {
  const [state, formAction, pending] = useActionState(toggleToolStatus, {} as ActionState);

  useEffect(() => {
    if (state.success) toast.success("เปลี่ยนสถานะสำเร็จ");
  }, [state.success]);

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error]);

  const isMaintenance = currentStatus === "MAINTENANCE";

  return (
    <form action={formAction}>
      <input type="hidden" name="toolId" value={toolId} />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={pending || currentStatus === "BORROWED"}
        className="rounded"
        title={
          currentStatus === "BORROWED"
            ? "ไม่สามารถเปลี่ยนสถานะอุปกรณ์ที่กำลังยืมอยู่"
            : isMaintenance
              ? "เปลี่ยนเป็นพร้อมใช้งาน"
              : "เปลี่ยนเป็นซ่อมบำรุง"
        }
      >
        <ToggleLeft className="mr-1 h-3.5 w-3.5" />
        {isMaintenance ? "พร้อมใช้งาน" : "ซ่อมบำรุง"}
      </Button>
    </form>
  );
}

function DeactivateButton({ tool }: { tool: ToolRow }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [state, formAction, pending] = useActionState(deactivateTool, {} as ActionState);

  useEffect(() => {
    if (state.success) {
      toast.success("ปิดใช้งานอุปกรณ์สำเร็จ");
    }
  }, [state.success]);

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error]);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setConfirmOpen(true)}
        disabled={tool.status === "BORROWED"}
        className="rounded"
        title={
          tool.status === "BORROWED"
            ? "ไม่สามารถปิดใช้งานอุปกรณ์ที่กำลังยืมอยู่"
            : "ปิดใช้งาน"
        }
      >
        <Trash2 className="mr-1 h-3.5 w-3.5" />
        ปิดใช้งาน
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm rounded">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold tracking-tight">ยืนยันการปิดใช้งาน</DialogTitle>
            <DialogDescription>
              คุณต้องการปิดใช้งาน &quot;{tool.name}&quot; หรือไม่?
              อุปกรณ์ที่ปิดใช้งานจะไม่แสดงในรายการผู้ยืม
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} className="rounded">
              ยกเลิก
            </Button>
            <form action={formAction}>
              <input type="hidden" name="toolId" value={tool.id} />
              <Button type="submit" variant="destructive" disabled={pending} className="rounded font-semibold">
                {pending ? "กำลังดำเนินการ..." : "ยืนยันปิดใช้งาน"}
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function InventoryClient({ tools, categories }: InventoryClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<ToolRow | null>(null);

  const openCreate = () => {
    setEditingTool(null);
    setModalOpen(true);
  };

  const openEdit = (tool: ToolRow) => {
    setEditingTool(tool);
    setModalOpen(true);
  };

  const activeTools = tools.filter((t) => t.isActive);
  const inactiveTools = tools.filter((t) => !t.isActive);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate} className="rounded font-semibold">
          <Plus className="mr-1.5 h-4 w-4" />
          เพิ่มอุปกรณ์
        </Button>
      </div>

      <ToolFormModal
        key={editingTool?.id ?? "create"}
        open={modalOpen}
        onOpenChange={setModalOpen}
        tool={editingTool}
        categories={categories}
      />

      {activeTools.length === 0 && inactiveTools.length === 0 ? (
        <div className="rounded border border-dashed p-10 text-center text-muted-foreground">
          ยังไม่มีอุปกรณ์ในระบบ
        </div>
      ) : (
        <>
          <ToolTable tools={activeTools} onEdit={openEdit} />
          {inactiveTools.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                ปิดใช้งาน ({inactiveTools.length})
              </h2>
              <ToolTable tools={inactiveTools} onEdit={openEdit} inactive />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ToolTable({
  tools,
  onEdit,
  inactive,
}: {
  tools: ToolRow[];
  onEdit: (tool: ToolRow) => void;
  inactive?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded border bg-card">
      <table className="w-full min-w-160 text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">อุปกรณ์</th>
            <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">หมายเลขซีเรียล</th>
            <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">สถานะ</th>
            <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">สถานที่ตั้ง</th>
            <th className="px-4 py-3 text-right font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">การดำเนินการ</th>
          </tr>
        </thead>
        <tbody>
          {tools.map((tool) => (
            <tr
              key={tool.id}
              className={`border-t transition-colors hover:bg-muted/30 ${inactive ? "opacity-60" : ""}`}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted">
                    {tool.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={tool.imageUrl}
                        alt={tool.name}
                        className="h-full w-full rounded object-cover"
                      />
                    ) : (
                      <Wrench className="h-4 w-4 text-muted-foreground/30" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{tool.name}</p>
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                      {tool.category}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 font-mono text-xs">
                {tool.serialNumber}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={tool.status} type="tool" />
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {tool.location || "—"}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(tool)}
                    className="rounded"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {!inactive && (
                    <>
                      <ToggleButton toolId={tool.id} currentStatus={tool.status} />
                      <DeactivateButton tool={tool} />
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
