"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AvatarInitials } from "@/components/shared/badges";
import {
  FileText,
  Tag,
  CalendarDays,
  User,
  Users,
  Zap,
  Layers,
  Flag,
  CircleDot,
  Sparkles,
} from "lucide-react";

interface UserOption {
  id: string;
  name: string;
}
interface Sprint {
  id: string;
  name: string;
}

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
  defaultType?: "SPRINT_TASK" | "GENERAL_TASK";
  defaultSprintId?: string;
  parentId?: string;
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  onCreated,
  defaultType = "SPRINT_TASK",
  defaultSprintId,
  parentId,
}: CreateTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState(defaultType);
  const [priority, setPriority] = useState("MEDIUM");
  const [status, setStatus] = useState("BACKLOG");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [sprintId, setSprintId] = useState(defaultSprintId || "");
  const [assigneeMode, setAssigneeMode] = useState("none");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetch("/api/users")
        .then((r) => (r.ok ? r.json() : []))
        .then((data: UserOption[]) =>
          setUsers(data.map((u) => ({ id: u.id, name: u.name }))),
        )
        .catch(() => {});
      fetch("/api/sprints")
        .then((r) => (r.ok ? r.json() : []))
        .then(setSprints)
        .catch(() => {});
      setType(defaultType);
      setSprintId(defaultSprintId || "");
    }
  }, [open, defaultType, defaultSprintId]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setType(defaultType);
    setPriority("MEDIUM");
    setStatus("BACKLOG");
    setStartDate("");
    setDueDate("");
    setSprintId(defaultSprintId || "");
    setAssigneeMode("none");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let assigneeIds: string[] = [];
    if (assigneeMode === "everyone") {
      assigneeIds = users.map((u) => u.id);
    } else if (assigneeMode !== "none") {
      assigneeIds = [assigneeMode];
    }

    const body: Record<string, unknown> = {
      title,
      description,
      type,
      priority,
      status,
      startDate: startDate || null,
      dueDate: dueDate || null,
      assigneeIds,
    };
    if (type === "SPRINT_TASK" && sprintId) body.sprintId = sprintId;
    if (parentId) body.parentId = parentId;

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (res.ok) {
      toast.success(
        assigneeMode === "everyone"
          ? "Task created and assigned to everyone"
          : "Task created",
      );
      resetForm();
      onOpenChange(false);
      onCreated?.();
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to create task");
    }
  };

  const isEveryone = assigneeMode === "everyone";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-0 shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#052659] via-[#5483B3] to-[#7DA0CA] rounded-t-lg" />

        <DialogHeader className="pt-2">
          <DialogTitle className="text-lg font-bold text-[#021024] flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#C1E8FF] to-[#C1E8FF] shadow-sm">
              <FileText className="h-4 w-4 text-[#052659]" />
            </div>
            {parentId ? "Create Subtask" : "Create Task"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-sm font-medium">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="h-10 transition-all duration-200 focus:shadow-md focus:shadow-[#5483B3]/10"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="description"
              className="text-sm font-medium flex items-center gap-1.5"
            >
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details, context, or instructions…"
              rows={3}
              className="resize-none transition-all duration-200 focus:shadow-md focus:shadow-[#5483B3]/10"
            />
          </div>

          <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Tag className="h-3 w-3" />
              Classification
            </p>
            <div className="grid grid-cols-2 gap-3">
              {!parentId && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Layers className="h-3 w-3" /> Type
                  </Label>
                  <Select
                    value={type}
                    onValueChange={(v) =>
                      setType(v as "SPRINT_TASK" | "GENERAL_TASK")
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SPRINT_TASK">
                        <span className="flex items-center gap-1.5">
                          <Zap className="h-3 w-3 text-[#5483B3]" />
                          Sprint Task
                        </span>
                      </SelectItem>
                      <SelectItem value="GENERAL_TASK">
                        <span className="flex items-center gap-1.5">
                          <CircleDot className="h-3 w-3 text-gray-500" />
                          General Task
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Flag className="h-3 w-3" /> Priority
                </Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-gray-400" />
                        Low
                      </span>
                    </SelectItem>
                    <SelectItem value="MEDIUM">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        Medium
                      </span>
                    </SelectItem>
                    <SelectItem value="HIGH">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-orange-500" />
                        High
                      </span>
                    </SelectItem>
                    <SelectItem value="URGENT">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        Urgent
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <CircleDot className="h-3 w-3" /> Status
                </Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BACKLOG">Backlog</SelectItem>
                    <SelectItem value="TODO">To Do</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="IN_REVIEW">In Review</SelectItem>
                    <SelectItem value="DONE">Done</SelectItem>
                    <SelectItem value="BLOCKED">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {type === "SPRINT_TASK" && !parentId && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Zap className="h-3 w-3" /> Sprint
              </Label>
              <Select value={sprintId} onValueChange={setSprintId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select sprint" />
                </SelectTrigger>
                <SelectContent>
                  {sprints.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <CalendarDays className="h-3 w-3" />
              Schedule
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Start Date
                </Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Due Date
                </Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <User className="h-3 w-3" />
              Assignment
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Assignee</Label>
              <Select value={assigneeMode} onValueChange={setAssigneeMode}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-3.5 w-3.5" />
                      Unassigned
                    </span>
                  </SelectItem>
                  <SelectItem value="everyone">
                    <span className="flex items-center gap-2 font-medium text-[#052659]">
                      <Users className="h-3.5 w-3.5" />
                      Everyone ({users.length} members)
                    </span>
                  </SelectItem>
                  <div className="my-1 h-px bg-border" />
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      <span className="flex items-center gap-2">
                        <AvatarInitials
                          name={u.name}
                          className="h-5 w-5 text-[9px]"
                        />
                        {u.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {isEveryone && (
                <div className="flex items-start gap-2.5 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/60 mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#5483B3] to-[#7DA0CA] shadow-sm flex-shrink-0">
                    <Users className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-800 font-semibold">
                      Assigning to everyone
                    </p>
                    <p className="text-[11px] text-blue-600 mt-0.5 leading-relaxed">
                      This single task will be visible to and assigned to all{" "}
                      {users.length} team members.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="transition-all duration-200 hover:shadow-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-[#052659] to-[#5483B3] hover:from-[#052659] hover:to-[#052659] shadow-md hover:shadow-lg transition-all duration-300"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating…
                </span>
              ) : isEveryone ? (
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Create for Everyone
                </span>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
