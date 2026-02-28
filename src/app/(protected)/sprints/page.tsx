"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Zap, Calendar } from "lucide-react";

interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  _count: { tasks: number };
}

export default function SprintsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Delete confirmation
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingSprint, setDeletingSprint] = useState<Sprint | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    loadSprints();
  }, [session, router]);

  const loadSprints = async () => {
    setPageLoading(true);
    const res = await fetch("/api/sprints");
    if (res.ok) setSprints(await res.json());
    setPageLoading(false);
  };

  const openCreate = () => {
    setEditingSprint(null);
    setName("");
    setStartDate("");
    setEndDate("");
    setDialogOpen(true);
  };

  const openEdit = (sprint: Sprint) => {
    setEditingSprint(sprint);
    setName(sprint.name);
    setStartDate(sprint.startDate.slice(0, 10));
    setEndDate(sprint.endDate.slice(0, 10));
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const body = { name, startDate, endDate };

    if (editingSprint) {
      const res = await fetch(`/api/sprints/${editingSprint.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success("Sprint updated");
        setDialogOpen(false);
        loadSprints();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update sprint");
      }
    } else {
      const res = await fetch("/api/sprints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success("Sprint created");
        setDialogOpen(false);
        loadSprints();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create sprint");
      }
    }

    setLoading(false);
  };

  const confirmDelete = (sprint: Sprint) => {
    setDeletingSprint(sprint);
    setConfirmDeleteOpen(true);
  };

  const deleteSprint = async () => {
    if (!deletingSprint) return;
    setDeleteLoading(true);
    const res = await fetch(`/api/sprints/${deletingSprint.id}`, {
      method: "DELETE",
    });
    setDeleteLoading(false);
    if (res.ok) {
      toast.success("Sprint deleted");
      setConfirmDeleteOpen(false);
      setDeletingSprint(null);
      loadSprints();
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to delete sprint");
    }
  };

  if (session?.user?.role !== "ADMIN") return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#C1E8FF] to-[#e0f3ff]">
            <Zap className="h-4 w-4 text-[#052659]" />
          </div>
          <h1 className="text-2xl font-bold text-[#021024] tracking-tight">Sprints</h1>
        </div>
        <Button
          onClick={openCreate}
          className="bg-[#052659] hover:bg-[#021024]"
        >
          <Plus className="h-4 w-4 mr-1" />
          Sprint
        </Button>
      </div>

      {pageLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-36 bg-gray-200 rounded" />
                    <div className="h-4 w-48 bg-gray-100 rounded" />
                    <div className="h-3 w-20 bg-gray-100 rounded" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-9 w-9 bg-gray-100 rounded" />
                    <div className="h-9 w-9 bg-gray-100 rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sprints.length === 0 ? (
        <div className="text-center py-16">
          <Zap className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">No sprints yet</p>
          <Button
            onClick={openCreate}
            className="bg-[#052659] hover:bg-[#021024]"
          >
            <Plus className="h-4 w-4 mr-1" />
            Create your first sprint
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {sprints.map((sprint) => {
            const now = new Date();
            const start = new Date(sprint.startDate);
            const end = new Date(sprint.endDate);
            const isActive = start <= now && end >= now;
            const isPast = end < now;
            const totalDays = Math.max(
              1,
              (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
            );
            const elapsed = Math.max(
              0,
              (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
            );
            const timeProgress = isActive
              ? Math.min(100, Math.round((elapsed / totalDays) * 100))
              : isPast
                ? 100
                : 0;

            return (
              <Card
                key={sprint.id}
                className={`transition-all ${isActive ? "border-[#5483B3] border-2 shadow-sm" : isPast ? "opacity-70" : ""}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-[#021024]">
                          {sprint.name}
                        </h3>
                        {isActive && (
                          <span className="text-[10px] bg-[#C1E8FF] text-[#021024] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                            Active
                          </span>
                        )}
                        {isPast && (
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                            Ended
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {start.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        –{" "}
                        {end.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {sprint._count.tasks} task
                        {sprint._count.tasks !== 1 ? "s" : ""}
                      </p>
                      {isActive && (
                        <div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full bg-[#5483B3] rounded-full transition-all"
                              style={{ width: `${timeProgress}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {Math.round(totalDays - elapsed)} days remaining
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => openEdit(sprint)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => confirmDelete(sprint)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSprint ? "Edit Sprint" : "Create Sprint"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sprint 1"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#052659] hover:bg-[#021024]"
              >
                {loading ? "Saving…" : editingSprint ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Delete sprint"
        description={`Are you sure you want to delete "${deletingSprint?.name}"? ${deletingSprint?._count?.tasks ? `This sprint has ${deletingSprint._count.tasks} task(s) that will be unlinked.` : ""} This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteLoading}
        onConfirm={deleteSprint}
      />
    </div>
  );
}
