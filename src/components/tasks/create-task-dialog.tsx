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
  const [assigneeId, setAssigneeId] = useState("");
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
    setAssigneeId("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const isEveryone = assigneeId === "everyone";

    if (isEveryone) {
      // Create one task per user
      let successCount = 0;
      let failCount = 0;

      for (const user of users) {
        const body: Record<string, unknown> = {
          title,
          description,
          type,
          priority,
          status,
          startDate: startDate || null,
          dueDate: dueDate || null,
          assigneeId: user.id,
        };
        if (type === "SPRINT_TASK" && sprintId) body.sprintId = sprintId;
        if (parentId) body.parentId = parentId;

        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) successCount++;
        else failCount++;
      }

      setLoading(false);

      if (successCount > 0) {
        toast.success(
          `Created ${successCount} task${successCount > 1 ? "s" : ""} for all members`,
        );
        if (failCount > 0) toast.error(`${failCount} failed to create`);
        resetForm();
        onOpenChange(false);
        onCreated?.();
      } else {
        toast.error("Failed to create tasks");
      }
    } else {
      // Single task creation
      const body: Record<string, unknown> = {
        title,
        description,
        type,
        priority,
        status,
        startDate: startDate || null,
        dueDate: dueDate || null,
        assigneeId: assigneeId || null,
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
        toast.success("Task created");
        resetForm();
        onOpenChange(false);
        onCreated?.();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create task");
      }
    }
  };

  const isEveryone = assigneeId === "everyone";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#0A2342] flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#CFE8FF]">
              <FileText className="h-4 w-4 text-[#0F4C8A]" />
            </div>
            {parentId ? "Create Subtask" : "Create Task"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-sm font-medium">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="h-10"
              required
            />
          </div>

          {/* Description */}
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
              className="resize-none"
            />
          </div>

          <Separator />

          {/* Type & Priority & Status */}
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
                          <Zap className="h-3 w-3 text-[#1366A6]" />
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

          {/* Sprint */}
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

          <Separator />

          {/* Dates */}
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

          <Separator />

          {/* Assignee */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <User className="h-3 w-3" />
              Assignment
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Assignee</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
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
                    <span className="flex items-center gap-2 font-medium text-[#0F4C8A]">
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

              {/* Everyone info banner */}
              {isEveryone && (
                <div className="flex items-start gap-2 p-2.5 bg-blue-50 rounded-lg border border-blue-200 mt-2">
                  <Users className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-blue-700 font-medium">
                      Assigning to everyone
                    </p>
                    <p className="text-[10px] text-blue-600 mt-0.5">
                      This will create {users.length} separate task
                      {users.length !== 1 ? "s" : ""}, one for each team member.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#0F4C8A] hover:bg-[#0D3B73]"
            >
              {loading
                ? isEveryone
                  ? `Creating ${users.length} tasks…`
                  : "Creating…"
                : isEveryone
                  ? `Create for Everyone`
                  : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
