"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  StatusBadge,
  PriorityBadge,
  AvatarInitials,
} from "@/components/shared/badges";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import {
  Plus,
  Search,
  ListTodo,
  AlertTriangle,
  Clock,
  MessageSquare,
  Paperclip,
  ListChecks,
} from "lucide-react";

interface GeneralTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignees: Array<{ id: string; name: string; email: string }>;
  _count: { subtasks: number; comments: number; attachments: number };
}

const STATUSES = [
  { value: "all", label: "All Status" },
  { value: "BACKLOG", label: "Backlog" },
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "DONE", label: "Done" },
  { value: "BLOCKED", label: "Blocked" },
];

export default function GeneralPage() {
  const [tasks, setTasks] = useState<GeneralTask[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      type: "GENERAL_TASK",
      parentId: "null",
    });
    if (search) params.set("q", search);
    if (statusFilter !== "all") params.set("status", statusFilter);
    const res = await fetch(`/api/tasks?${params}`);
    if (res.ok) {
      setTasks(await res.json());
    }
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === "DONE") return false;
    return new Date(dueDate) < new Date();
  };

  const isDueSoon = (dueDate: string | null, status: string) => {
    if (!dueDate || status === "DONE") return false;
    const due = new Date(dueDate);
    const now = new Date();
    const diff = due.getTime() - now.getTime();
    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#C1E8FF] to-[#e0f3ff]">
            <ListTodo className="h-4 w-4 text-[#052659]" />
          </div>
          <h1 className="text-2xl font-bold text-[#021024] tracking-tight">General Tasks</h1>
          {!loading && (
            <span className="text-sm text-muted-foreground">
              ({tasks.length})
            </span>
          )}
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search…"
              className="pl-8 w-48"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
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
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-gradient-to-r from-[#052659] to-[#5483B3] hover:from-[#021024] hover:to-[#052659] shadow-md shadow-[#052659]/20 hover:shadow-lg hover:shadow-[#052659]/30 transition-all duration-300"
          >
            <Plus className="h-4 w-4 mr-1" />
            Task
          </Button>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading ? (
        <div className="space-y-2">
          <div className="hidden md:grid md:grid-cols-[1fr_120px_100px_140px_100px] gap-4 px-4 py-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-3 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 animate-pulse">
                <div className="hidden md:grid md:grid-cols-[1fr_120px_100px_140px_100px] gap-4 items-center">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-5 bg-gray-100 rounded w-20" />
                  <div className="h-5 bg-gray-100 rounded w-16" />
                  <div className="h-4 bg-gray-100 rounded w-24" />
                  <div className="h-6 w-6 bg-gray-200 rounded-full" />
                </div>
                <div className="md:hidden space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="flex gap-2">
                    <div className="h-5 bg-gray-100 rounded w-16" />
                    <div className="h-5 bg-gray-100 rounded w-14" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16">
          <ListTodo className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground mb-1">No general tasks found</p>
          {(search || statusFilter !== "all") && (
            <p className="text-sm text-muted-foreground mb-4">
              Try adjusting your filters
            </p>
          )}
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-gradient-to-r from-[#052659] to-[#5483B3] hover:from-[#021024] hover:to-[#052659] shadow-md shadow-[#052659]/20 transition-all duration-300"
          >
            <Plus className="h-4 w-4 mr-1" />
            Create a task
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Desktop table header */}
          <div className="hidden md:grid md:grid-cols-[1fr_120px_100px_140px_60px_100px] gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span>Title</span>
            <span>Status</span>
            <span>Priority</span>
            <span>Due Date</span>
            <span>Info</span>
            <span>Assignee</span>
          </div>
          {tasks.map((task) => {
            const taskOverdue = isOverdue(task.dueDate, task.status);
            const taskDueSoon = isDueSoon(task.dueDate, task.status);

            return (
              <Card
                key={task.id}
                className={`cursor-pointer hover:shadow-md transition-all ${
                  taskOverdue
                    ? "border-red-200 hover:border-red-300"
                  : "hover:border-[#5483B3]/20 card-hover-lift"
                }`}
                onClick={() => {
                  setSelectedTaskId(task.id);
                  setDetailOpen(true);
                }}
              >
                <CardContent className="p-4">
                  {/* Desktop row */}
                  <div className="hidden md:grid md:grid-cols-[1fr_120px_100px_140px_60px_100px] gap-4 items-center">
                    <span className="text-sm font-medium truncate text-[#021024]">
                      {task.title}
                    </span>
                    <StatusBadge status={task.status} />
                    <PriorityBadge priority={task.priority} />
                    <div className="flex items-center gap-1">
                      {taskOverdue && (
                        <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                      )}
                      {taskDueSoon && !taskOverdue && (
                        <Clock className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                      )}
                      <span
                        className={`text-sm ${
                          taskOverdue
                            ? "text-red-600 font-medium"
                            : taskDueSoon
                              ? "text-amber-600 font-medium"
                              : "text-muted-foreground"
                        }`}
                      >
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      {task._count.subtasks > 0 && (
                        <span
                          className="flex items-center gap-0.5 text-[10px]"
                          title="Subtasks"
                        >
                          <ListChecks className="h-3 w-3" />
                          {task._count.subtasks}
                        </span>
                      )}
                      {task._count.comments > 0 && (
                        <span
                          className="flex items-center gap-0.5 text-[10px]"
                          title="Comments"
                        >
                          <MessageSquare className="h-3 w-3" />
                          {task._count.comments}
                        </span>
                      )}
                      {task._count.attachments > 0 && (
                        <span
                          className="flex items-center gap-0.5 text-[10px]"
                          title="Attachments"
                        >
                          <Paperclip className="h-3 w-3" />
                          {task._count.attachments}
                        </span>
                      )}
                    </div>
                    <div>
                      {task.assignees.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <div className="flex -space-x-1.5">
                            {task.assignees.slice(0, 3).map((a) => (
                              <AvatarInitials
                                key={a.id}
                                name={a.name}
                                className="h-6 w-6 text-[10px] ring-1.5 ring-white"
                              />
                            ))}
                            {task.assignees.length > 3 && (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[9px] font-medium text-gray-600 ring-1.5 ring-white">
                                +{task.assignees.length - 3}
                              </div>
                            )}
                          </div>
                          {task.assignees.length === 1 && (
                            <span className="text-xs text-muted-foreground truncate max-w-[60px]">
                              {task.assignees[0].name.split(" ")[0]}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>
                  {/* Mobile card */}
                  <div className="md:hidden space-y-2">
                    <p className="text-sm font-medium text-[#021024]">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority} />
                      {taskOverdue && (
                        <span className="text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          Overdue
                        </span>
                      )}
                      {taskDueSoon && !taskOverdue && (
                        <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          Soon
                        </span>
                      )}
                      {task.dueDate && !taskOverdue && !taskDueSoon && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(task.dueDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        {task._count.subtasks > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px]">
                            <ListChecks className="h-3 w-3" />
                            {task._count.subtasks}
                          </span>
                        )}
                        {task._count.comments > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px]">
                            <MessageSquare className="h-3 w-3" />
                            {task._count.comments}
                          </span>
                        )}
                        {task._count.attachments > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px]">
                            <Paperclip className="h-3 w-3" />
                            {task._count.attachments}
                          </span>
                        )}
                      </div>
                      {task.assignees.length > 0 && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <div className="flex -space-x-1">
                            {task.assignees.slice(0, 2).map((a) => (
                              <AvatarInitials
                                key={a.id}
                                name={a.name}
                                className="h-5 w-5 text-[10px] ring-1 ring-white"
                              />
                            ))}
                            {task.assignees.length > 2 && (
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[8px] font-medium text-gray-600 ring-1 ring-white">
                                +{task.assignees.length - 2}
                              </div>
                            )}
                          </div>
                          {task.assignees.length === 1 && (
                            <span className="text-muted-foreground">
                              {task.assignees[0].name}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <TaskDetailDialog
        taskId={selectedTaskId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onTaskUpdated={loadTasks}
      />

      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={loadTasks}
        defaultType="GENERAL_TASK"
      />
    </div>
  );
}
