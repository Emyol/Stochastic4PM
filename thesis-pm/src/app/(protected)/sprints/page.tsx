"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

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

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    loadSprints();
  }, [session, router]);

  const loadSprints = async () => {
    const res = await fetch("/api/sprints");
    if (res.ok) setSprints(await res.json());
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

  const deleteSprint = async (sprint: Sprint) => {
    if (!confirm(`Delete sprint "${sprint.name}"?`)) return;
    const res = await fetch(`/api/sprints/${sprint.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Sprint deleted");
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
        <h1 className="text-2xl font-bold text-[#0A2342]">Sprints</h1>
        <Button
          onClick={openCreate}
          className="bg-[#0F4C8A] hover:bg-[#0D3B73]"
        >
          <Plus className="h-4 w-4 mr-1" />
          Sprint
        </Button>
      </div>

      {sprints.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No sprints yet. Create your first sprint!
        </div>
      ) : (
        <div className="grid gap-4">
          {sprints.map((sprint) => {
            const now = new Date();
            const isActive =
              new Date(sprint.startDate) <= now &&
              new Date(sprint.endDate) >= now;
            return (
              <Card
                key={sprint.id}
                className={isActive ? "border-[#1366A6] border-2" : ""}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{sprint.name}</h3>
                      {isActive && (
                        <span className="text-xs bg-[#CFE8FF] text-[#0A2342] px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(sprint.startDate).toLocaleDateString()} –{" "}
                      {new Date(sprint.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {sprint._count.tasks} tasks
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => openEdit(sprint)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => deleteSprint(sprint)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
                className="bg-[#0F4C8A] hover:bg-[#0D3B73]"
              >
                {loading ? "Saving…" : editingSprint ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
