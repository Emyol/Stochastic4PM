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
import {
  Paperclip,
  Download,
  Trash2,
  Send,
  CheckCircle2,
  Circle,
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

interface TaskDetailDialogProps {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated?: () => void;
}

const STATUSES = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
  "BLOCKED",
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
    } else {
      setTask(null);
    }
  }, [open, taskId, fetchTask]);

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
    if (!d) return "—";
    return new Date(d).toLocaleDateString();
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1366A6] border-t-transparent" />
          </div>
        ) : task ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
                {task.sprint && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {task.sprint.name}
                  </span>
                )}
              </div>
              <DialogTitle className="text-xl mt-2">{task.title}</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Description */}
              {task.description && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Description
                  </h4>
                  <p className="text-sm whitespace-pre-wrap">
                    {task.description}
                  </p>
                </div>
              )}

              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Status</span>
                  <Select value={task.status} onValueChange={updateStatus}>
                    <SelectTrigger className="mt-1 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <span className="text-muted-foreground">Assignee</span>
                  <div className="mt-1 flex items-center gap-2">
                    {task.assignee ? (
                      <>
                        <AvatarInitials name={task.assignee.name} />
                        <span>{task.assignee.name}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Start Date</span>
                  <p className="mt-1">{formatDate(task.startDate)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Due Date</span>
                  <p className="mt-1">{formatDate(task.dueDate)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Reporter</span>
                  <p className="mt-1">{task.reporter?.name || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Type</span>
                  <p className="mt-1">{task.type.replace(/_/g, " ")}</p>
                </div>
              </div>

              {/* Subtasks */}
              {task.subtasks.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Subtasks (
                    {task.subtasks.filter((s) => s.status === "DONE").length}/
                    {task.subtasks.length})
                  </h4>
                  <div className="space-y-1">
                    {task.subtasks.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => toggleSubtaskStatus(sub.id, sub.status)}
                        className="flex w-full items-center gap-2 rounded-md p-2 text-sm hover:bg-muted transition-colors text-left"
                      >
                        {sub.status === "DONE" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <span
                          className={
                            sub.status === "DONE"
                              ? "line-through text-muted-foreground"
                              : ""
                          }
                        >
                          {sub.title}
                        </span>
                        {sub.assignee && (
                          <AvatarInitials
                            name={sub.assignee.name}
                            className="ml-auto h-5 w-5 text-[10px]"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Attachments ({task.attachments.length})
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
                    <div className="flex items-center gap-1 text-sm text-[#1366A6] hover:underline">
                      <Paperclip className="h-4 w-4" />
                      Attach
                    </div>
                  </label>
                </div>
                {task.attachments.length > 0 && (
                  <div className="space-y-1">
                    {task.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-2 text-sm p-2 bg-muted rounded-md"
                      >
                        <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="flex-1 truncate">
                          {att.originalName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatBytes(att.sizeBytes)}
                        </span>
                        <a
                          href={`/api/attachments/${att.id}`}
                          className="text-[#1366A6] hover:text-[#0D3B73]"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        {(session?.user?.role === "ADMIN" ||
                          session?.user?.id === att.uploadedBy.id) && (
                          <button
                            onClick={() => deleteAttachment(att.id)}
                            className="text-red-500 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Comments */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Comments ({task.comments.length})
                </h4>
                <div className="space-y-3">
                  {task.comments.map((c) => (
                    <div key={c.id} className="bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <AvatarInitials
                          name={c.author.name}
                          className="h-6 w-6 text-[10px]"
                        />
                        <span className="text-sm font-medium">
                          {c.author.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(c.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{c.body}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <Input
                    placeholder="Add a comment…"
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        addComment();
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    onClick={addComment}
                    disabled={submittingComment || !commentBody.trim()}
                    className="bg-[#0F4C8A] hover:bg-[#0D3B73]"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <p className="text-center py-8 text-muted-foreground">
            Task not found
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
