"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  StatusBadge,
  PriorityBadge,
  AvatarInitials,
} from "@/components/shared/badges";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  Paperclip,
  Download,
  Trash2,
  Send,
  CheckCircle2,
  Circle,
  Pencil,
  X,
  Save,
  Plus,
  AlertTriangle,
  Clock,
  User,
  CalendarDays,
  FileText,
  MessageSquare,
  ListChecks,
} from "lucide-react";

interface TaskDetail {
  id: string;
  title: string;
  description: string;
  status: string;
  type: string;
  priority: string;
  startDate: string | null;
  dueDate: string | null;
  assignee: { id: string; name: string; email: string } | null;
  reporter: { id: string; name: string; email: string } | null;
  sprint: { id: string; name: string } | null;
  subtasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    assignee: { id: string; name: string } | null;
  }>;
  comments: Array<{
    id: string;
    body: string;
    createdAt: string;
    author: { id: string; name: string; email: string };
  }>;
  attachments: Array<{
    id: string;
    originalName: string;
    sizeBytes: number;
    createdAt: string;
    uploadedBy: { id: string; name: string };
  }>;
}

interface UserOption {
  id: string;
  name: string;
}

interface TaskDetailDialogProps {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated?: () => void;
}

const STATUSES = [
  { value: "BACKLOG", label: "Backlog" },
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "DONE", label: "Done" },
  { value: "BLOCKED", label: "Blocked" },
];

const PRIORITIES = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

export function TaskDetailDialog({
  taskId,
  open,
  onOpenChange,
  onTaskUpdated,
}: TaskDetailDialogProps) {
  const { data: session } = useSession();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editAssigneeId, setEditAssigneeId] = useState("");
  const [saving, setSaving] = useState(false);

  // Users list for assignee dropdown
  const [users, setUsers] = useState<UserOption[]>([]);

  // Delete confirmation
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Add subtask
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [creatingSubtask, setCreatingSubtask] = useState(false);

  const fetchTask = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data);
      }
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (open && taskId) {
      fetchTask();
      setEditing(false);
      setShowAddSubtask(false);
      // Load users for assignee picker
      fetch("/api/users")
        .then((r) => (r.ok ? r.json() : []))
        .then((data) =>
          setUsers(
            data.map((u: { id: string; name: string }) => ({
              id: u.id,
              name: u.name,
            })),
          ),
        )
        .catch(() => {});
    } else {
      setTask(null);
    }
  }, [open, taskId, fetchTask]);

  const startEditing = () => {
    if (!task) return;
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditPriority(task.priority);
    setEditStartDate(
      task.startDate ? new Date(task.startDate).toISOString().slice(0, 10) : "",
    );
    setEditDueDate(
      task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "",
    );
    setEditAssigneeId(task.assignee?.id || "none");
    setEditing(true);
  };

  const saveEdits = async () => {
    if (!task) return;
    setSaving(true);
    const body: Record<string, unknown> = {
      title: editTitle,
      description: editDescription,
      priority: editPriority,
      startDate: editStartDate || null,
      dueDate: editDueDate || null,
      assigneeId: editAssigneeId === "none" ? null : editAssigneeId,
    };

    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);

    if (res.ok) {
      toast.success("Task updated");
      setEditing(false);
      fetchTask();
      onTaskUpdated?.();
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to update task");
    }
  };

  const updateStatus = async (status: string) => {
    if (!task) return;
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success("Status updated");
      fetchTask();
      onTaskUpdated?.();
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to update status");
    }
  };

  const deleteTask = async () => {
    if (!task) return;
    setDeleting(true);
    const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    setDeleting(false);

    if (res.ok) {
      toast.success("Task deleted");
      setConfirmDeleteOpen(false);
      onOpenChange(false);
      onTaskUpdated?.();
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to delete task");
    }
  };

  const toggleSubtaskStatus = async (
    subtaskId: string,
    currentStatus: string,
  ) => {
    const newStatus = currentStatus === "DONE" ? "TODO" : "DONE";
    const res = await fetch(`/api/tasks/${subtaskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      fetchTask();
      onTaskUpdated?.();
    }
  };

  const addSubtask = async () => {
    if (!task || !subtaskTitle.trim()) return;
    setCreatingSubtask(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: subtaskTitle,
        type: task.type,
        parentId: task.id,
      }),
    });
    setCreatingSubtask(false);
    if (res.ok) {
      toast.success("Subtask added");
      setSubtaskTitle("");
      setShowAddSubtask(false);
      fetchTask();
      onTaskUpdated?.();
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to create subtask");
    }
  };

  const addComment = async () => {
    if (!task || !commentBody.trim()) return;
    setSubmittingComment(true);
    const res = await fetch(`/api/tasks/${task.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: commentBody }),
    });
    setSubmittingComment(false);
    if (res.ok) {
      setCommentBody("");
      fetchTask();
      toast.success("Comment added");
    }
  };

  const deleteComment = async (commentId: string) => {
    const res = await fetch(`/api/comments/${commentId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Comment deleted");
      fetchTask();
    }
  };

  const uploadAttachment = async (file: File) => {
    if (!task) return;
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/tasks/${task.id}/attachments`, {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      toast.success("File uploaded");
      fetchTask();
    } else {
      const err = await res.json();
      toast.error(err.error || "Upload failed");
    }
  };

  const deleteAttachment = async (id: string) => {
    const res = await fetch(`/api/attachments/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Attachment deleted");
      fetchTask();
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "Not set";
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  const canEdit =
    session?.user?.role === "ADMIN" ||
    session?.user?.id === task?.assignee?.id ||
    session?.user?.id === task?.reporter?.id;

  const canDelete =
    session?.user?.role === "ADMIN" || session?.user?.id === task?.reporter?.id;

  const isDueSoon = task?.dueDate
    ? (() => {
        const due = new Date(task.dueDate);
        const now = new Date();
        const diff = due.getTime() - now.getTime();
        return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
      })()
    : false;

  const isOverdue = task?.dueDate
    ? new Date(task.dueDate) < new Date() && task.status !== "DONE"
    : false;

  const subtasksDone =
    task?.subtasks.filter((s) => s.status === "DONE").length || 0;
  const subtasksTotal = task?.subtasks.length || 0;
  const subtaskProgress =
    subtasksTotal > 0 ? Math.round((subtasksDone / subtasksTotal) * 100) : 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1366A6] border-t-transparent" />
            </div>
          ) : task ? (
            <div className="flex flex-col">
              {/* Top bar */}
              <div className="sticky top-0 z-10 bg-white border-b px-6 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <StatusBadge status={task.status} />
                    <PriorityBadge priority={task.priority} />
                    {task.type === "SPRINT_TASK" && task.sprint && (
                      <span className="text-xs text-[#0F4C8A] bg-[#CFE8FF] px-2 py-0.5 rounded-full font-medium">
                        {task.sprint.name}
                      </span>
                    )}
                    {task.type === "GENERAL_TASK" && (
                      <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                        General
                      </span>
                    )}
                    {isOverdue && (
                      <span className="text-xs text-red-700 bg-red-100 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Overdue
                      </span>
                    )}
                    {isDueSoon && !isOverdue && (
                      <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Due soon
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {canEdit && !editing && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={startEditing}
                        className="h-8 px-2 text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmDeleteOpen(true)}
                        className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>

                {/* Title */}
                <DialogHeader className="mt-3 p-0">
                  {editing ? (
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-lg font-semibold"
                      placeholder="Task title"
                    />
                  ) : (
                    <DialogTitle className="text-xl font-bold text-[#0A2342] leading-tight">
                      {task.title}
                    </DialogTitle>
                  )}
                </DialogHeader>
              </div>

              <div className="px-6 py-5 space-y-6">
                {/* Edit mode banner */}
                {editing && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-700 font-medium flex-1">
                      Editing mode
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditing(false)}
                      className="h-7"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={saveEdits}
                      disabled={saving || !editTitle.trim()}
                      className="h-7 bg-[#0F4C8A] hover:bg-[#0D3B73]"
                    >
                      <Save className="h-3 w-3 mr-1" />
                      {saving ? "Saving…" : "Save"}
                    </Button>
                  </div>
                )}

                {/* Description */}
                <div>
                  <h4 className="text-sm font-semibold text-[#0A2342] mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Description
                  </h4>
                  {editing ? (
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={4}
                      placeholder="Add a description…"
                      className="resize-none"
                    />
                  ) : (
                    <div className="text-sm text-gray-700 whitespace-pre-wrap bg-[#F8FAFC] rounded-lg p-3 min-h-[60px]">
                      {task.description || (
                        <span className="text-muted-foreground italic">
                          No description
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Status
                    </Label>
                    <Select value={task.status} onValueChange={updateStatus}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Priority
                    </Label>
                    {editing ? (
                      <Select
                        value={editPriority}
                        onValueChange={setEditPriority}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITIES.map((p) => (
                            <SelectItem key={p.value} value={p.value}>
                              {p.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="h-9 flex items-center">
                        <PriorityBadge priority={task.priority} />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <User className="h-3 w-3" /> Assignee
                    </Label>
                    {editing ? (
                      <Select
                        value={editAssigneeId}
                        onValueChange={setEditAssigneeId}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Unassigned</SelectItem>
                          {users.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="h-9 flex items-center gap-2">
                        {task.assignee ? (
                          <>
                            <AvatarInitials
                              name={task.assignee.name}
                              className="h-6 w-6 text-[10px]"
                            />
                            <span className="text-sm">
                              {task.assignee.name}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Unassigned
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" /> Start Date
                    </Label>
                    {editing ? (
                      <Input
                        type="date"
                        value={editStartDate}
                        onChange={(e) => setEditStartDate(e.target.value)}
                        className="h-9"
                      />
                    ) : (
                      <p className="h-9 flex items-center text-sm">
                        {formatDate(task.startDate)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1 ${isOverdue ? "text-red-600" : "text-muted-foreground"}`}
                    >
                      <CalendarDays className="h-3 w-3" /> Due Date
                    </Label>
                    {editing ? (
                      <Input
                        type="date"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                        className="h-9"
                      />
                    ) : (
                      <p
                        className={`h-9 flex items-center text-sm ${isOverdue ? "text-red-600 font-medium" : ""}`}
                      >
                        {formatDate(task.dueDate)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Reporter
                    </Label>
                    <div className="h-9 flex items-center gap-2">
                      {task.reporter ? (
                        <>
                          <AvatarInitials
                            name={task.reporter.name}
                            className="h-6 w-6 text-[10px]"
                          />
                          <span className="text-sm">{task.reporter.name}</span>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Subtasks */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-[#0A2342] flex items-center gap-2">
                      <ListChecks className="h-4 w-4 text-muted-foreground" />
                      Subtasks
                      {subtasksTotal > 0 && (
                        <span className="text-xs font-normal text-muted-foreground">
                          ({subtasksDone}/{subtasksTotal})
                        </span>
                      )}
                    </h4>
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowAddSubtask(!showAddSubtask)}
                        className="h-7 text-xs text-[#1366A6] hover:text-[#0D3B73]"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add subtask
                      </Button>
                    )}
                  </div>

                  {subtasksTotal > 0 && (
                    <div className="mb-3">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all duration-300"
                          style={{ width: `${subtaskProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {subtaskProgress}% complete
                      </p>
                    </div>
                  )}

                  {showAddSubtask && (
                    <div className="flex gap-2 mb-3">
                      <Input
                        placeholder="Subtask title…"
                        value={subtaskTitle}
                        onChange={(e) => setSubtaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addSubtask();
                          }
                          if (e.key === "Escape") {
                            setShowAddSubtask(false);
                            setSubtaskTitle("");
                          }
                        }}
                        className="h-8 text-sm"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={addSubtask}
                        disabled={creatingSubtask || !subtaskTitle.trim()}
                        className="h-8 bg-[#0F4C8A] hover:bg-[#0D3B73]"
                      >
                        {creatingSubtask ? "…" : "Add"}
                      </Button>
                    </div>
                  )}

                  {task.subtasks.length > 0 ? (
                    <div className="space-y-1">
                      {task.subtasks.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() =>
                            toggleSubtaskStatus(sub.id, sub.status)
                          }
                          className="flex w-full items-center gap-2 rounded-lg p-2.5 text-sm hover:bg-[#F8FAFC] transition-colors text-left group"
                        >
                          {sub.status === "DONE" ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0 group-hover:text-[#1366A6]" />
                          )}
                          <span
                            className={`flex-1 ${
                              sub.status === "DONE"
                                ? "line-through text-muted-foreground"
                                : "text-gray-700"
                            }`}
                          >
                            {sub.title}
                          </span>
                          {sub.assignee && (
                            <AvatarInitials
                              name={sub.assignee.name}
                              className="h-5 w-5 text-[10px] opacity-60"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    !showAddSubtask && (
                      <p className="text-sm text-muted-foreground italic py-2">
                        No subtasks yet
                      </p>
                    )
                  )}
                </div>

                <Separator />

                {/* Attachments */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-[#0A2342] flex items-center gap-2">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      Attachments
                      {task.attachments.length > 0 && (
                        <span className="text-xs font-normal text-muted-foreground">
                          ({task.attachments.length})
                        </span>
                      )}
                    </h4>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadAttachment(f);
                          e.target.value = "";
                        }}
                      />
                      <div className="flex items-center gap-1 text-xs text-[#1366A6] hover:text-[#0D3B73] font-medium px-2 py-1 rounded hover:bg-[#CFE8FF]/50 transition-colors">
                        <Plus className="h-3 w-3" />
                        Upload
                      </div>
                    </label>
                  </div>
                  {task.attachments.length > 0 ? (
                    <div className="space-y-1.5">
                      {task.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center gap-2 text-sm p-2.5 bg-[#F8FAFC] rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                        >
                          <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="flex-1 truncate text-gray-700">
                            {att.originalName}
                          </span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatBytes(att.sizeBytes)}
                          </span>
                          <a
                            href={`/api/attachments/${att.id}`}
                            className="p-1 rounded hover:bg-[#CFE8FF] text-[#1366A6] transition-colors"
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                          {(session?.user?.role === "ADMIN" ||
                            session?.user?.id === att.uploadedBy.id) && (
                            <button
                              onClick={() => deleteAttachment(att.id)}
                              className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic py-2">
                      No attachments
                    </p>
                  )}
                </div>

                <Separator />

                {/* Comments */}
                <div>
                  <h4 className="text-sm font-semibold text-[#0A2342] mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    Comments
                    {task.comments.length > 0 && (
                      <span className="text-xs font-normal text-muted-foreground">
                        ({task.comments.length})
                      </span>
                    )}
                  </h4>

                  <div className="flex gap-2 mb-4">
                    {session?.user && (
                      <AvatarInitials
                        name={session.user.name}
                        className="h-8 w-8 text-xs flex-shrink-0 mt-0.5"
                      />
                    )}
                    <div className="flex-1 flex gap-2">
                      <Input
                        placeholder="Write a comment…"
                        value={commentBody}
                        onChange={(e) => setCommentBody(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            addComment();
                          }
                        }}
                        className="h-9"
                      />
                      <Button
                        size="sm"
                        onClick={addComment}
                        disabled={submittingComment || !commentBody.trim()}
                        className="h-9 px-3 bg-[#0F4C8A] hover:bg-[#0D3B73]"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {task.comments.length > 0 ? (
                    <div className="space-y-3">
                      {task.comments.map((c) => (
                        <div
                          key={c.id}
                          className="bg-[#F8FAFC] rounded-lg p-3 group"
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <AvatarInitials
                              name={c.author.name}
                              className="h-6 w-6 text-[10px]"
                            />
                            <span className="text-sm font-medium text-[#0A2342]">
                              {c.author.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(c.createdAt).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </span>
                            {(session?.user?.role === "ADMIN" ||
                              session?.user?.id === c.author.id) && (
                              <button
                                onClick={() => deleteComment(c.id)}
                                className="ml-auto opacity-0 group-hover:opacity-100 p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                title="Delete comment"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 pl-8">{c.body}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic py-2">
                      No comments yet
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mb-2" />
              <p>Task not found</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Delete task"
        description={`Are you sure you want to delete "${task?.title}"? ${task?.subtasks?.length ? `This will also delete ${task.subtasks.length} subtask(s).` : ""} This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={deleteTask}
      />
    </>
  );
}
