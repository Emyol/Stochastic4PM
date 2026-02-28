"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PriorityBadge, AvatarInitials } from "@/components/shared/badges";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import {
  Plus,
  Search,
  Columns3,
  AlertTriangle,
  Clock,
  Paperclip,
} from "lucide-react";
import { toast } from "sonner";
import { useTasks, useSprints, revalidateAllTasks } from "@/hooks/use-data";

const COLUMNS = [
  { key: "BACKLOG", label: "Backlog", dot: "bg-gray-400", bg: "bg-gray-50" },
  { key: "TODO", label: "To Do", dot: "bg-blue-400", bg: "bg-blue-50" },
  { key: "IN_PROGRESS", label: "In Progress", dot: "bg-yellow-400", bg: "bg-yellow-50" },
  { key: "IN_REVIEW", label: "In Review", dot: "bg-purple-400", bg: "bg-purple-50" },
  { key: "DONE", label: "Done", dot: "bg-green-400", bg: "bg-green-50" },
  { key: "BLOCKED", label: "Blocked", dot: "bg-red-400", bg: "bg-red-50" },
];

export default function BoardPage() {
  const [selectedSprintId, setSelectedSprintId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  // SWR hooks — parallel, cached, deduplicated
  const { sprints } = useSprints();

  // Auto-select active sprint
  const effectiveSprintId = useMemo(() => {
    if (selectedSprintId) return selectedSprintId;
    const now = new Date();
    const active = sprints.find(
      (s) => new Date(s.startDate) <= now && new Date(s.endDate) >= now,
    );
    return active?.id || sprints[0]?.id || "";
  }, [sprints, selectedSprintId]);

  const taskParams = useMemo(() => {
    if (!effectiveSprintId) return undefined;
    const p: Record<string, string> = { sprintId: effectiveSprintId, parentId: "null" };
    if (search) p.q = search;
    return p;
  }, [effectiveSprintId, search]);

  const { tasks, isLoading: loading, mutate: mutateTasks } = useTasks(taskParams);

  // Optimistic status change
  const handleStatusChange = useCallback(async (taskId: string, newStatus: string) => {
    // Optimistic: update cache instantly
    const prevTasks = tasks;
    mutateTasks(
      tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
      false, // don't revalidate yet
    );

    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      toast.success("Status updated");
      mutateTasks(); // revalidate from server
      revalidateAllTasks(); // update other caches too
    } else {
      // Rollback on error
      mutateTasks(prevTasks, false);
      const err = await res.json();
      toast.error(err.error || "Failed to update");
    }
  }, [tasks, mutateTasks]);

  const getColumnTasks = (status: string) => tasks.filter((t) => t.status === status);

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#C1E8FF] to-[#e0f3ff]">
            <Columns3 className="h-4 w-4 text-[#052659]" />
          </div>
          <h1 className="text-2xl font-bold text-[#021024] tracking-tight">Board</h1>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks…"
              className="pl-8 w-48 rounded-xl border-gray-200/80 bg-white/80 backdrop-blur-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={effectiveSprintId} onValueChange={setSelectedSprintId}>
            <SelectTrigger className="w-48 rounded-xl border-gray-200/80 bg-white/80 backdrop-blur-sm">
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
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-gradient-to-r from-[#052659] to-[#5483B3] hover:from-[#021024] hover:to-[#052659] shadow-md shadow-[#052659]/20 hover:shadow-lg hover:shadow-[#052659]/30 transition-all duration-300 rounded-xl"
          >
            <Plus className="h-4 w-4 mr-1" />
            Task
          </Button>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <div key={col.key} className="flex-shrink-0 w-72">
              <div className="flex items-center gap-2 mb-3">
                <div className={`h-3 w-3 rounded-full ${col.dot}`} />
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white rounded-xl border p-4 space-y-3 animate-pulse">
                    <div className="h-4 w-3/4 bg-gray-200 rounded" />
                    <div className="h-3 w-1/2 bg-gray-100 rounded" />
                    <div className="h-6 w-16 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Board columns */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colTasks = getColumnTasks(col.key);
            return (
              <div key={col.key} className="flex-shrink-0 w-72">
                {/* Column header */}
                <div className={`flex items-center gap-2 mb-3 px-2 py-1.5 rounded-lg ${col.bg}`}>
                  <div className={`h-2.5 w-2.5 rounded-full ${col.dot}`} />
                  <h3 className="font-semibold text-sm text-[#021024]">{col.label}</h3>
                  <span className="text-xs font-medium text-muted-foreground bg-white/80 px-1.5 py-0.5 rounded-full ml-auto">
                    {colTasks.length}
                  </span>
                </div>

                {/* Column cards */}
                <div className="space-y-2 min-h-[200px]">
                  {colTasks.length === 0 && (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                      <p className="text-xs text-muted-foreground">No tasks</p>
                    </div>
                  )}
                  {colTasks.map((task) => (
                    <Card
                      key={task.id}
                      className="cursor-pointer hover:shadow-lg hover:border-[#5483B3]/30 transition-all duration-200 rounded-xl border-gray-200/60 glass-card card-hover-lift"
                      onClick={() => {
                        setSelectedTaskId(task.id);
                        setDetailOpen(true);
                      }}
                    >
                      <CardContent className="p-3.5 space-y-2.5">
                        <p className="text-sm font-medium leading-tight text-[#021024] line-clamp-2">{task.title}</p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <PriorityBadge priority={task.priority} />
                          {isOverdue(task.dueDate, task.status) && (
                            <span className="text-[10px] font-medium text-red-700 bg-red-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <AlertTriangle className="h-3 w-3" />Overdue
                            </span>
                          )}
                          {isDueSoon(task.dueDate, task.status) && (
                            <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Clock className="h-3 w-3" />Soon
                            </span>
                          )}
                          {task.dueDate && !isOverdue(task.dueDate, task.status) && !isDueSoon(task.dueDate, task.status) && (
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {task._count.subtasks > 0 && (
                              <span className="flex items-center gap-0.5" title="Subtasks">
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                {task._count.subtasks}
                              </span>
                            )}
                            {task._count.comments > 0 && (
                              <span className="flex items-center gap-0.5" title="Comments">
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                {task._count.comments}
                              </span>
                            )}
                            {task._count.attachments > 0 && (
                              <span className="flex items-center gap-0.5" title="Attachments">
                                <Paperclip className="h-3.5 w-3.5" />
                                {task._count.attachments}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {task.assignees.length > 0 && (
                              <div className="flex -space-x-1.5">
                                {task.assignees.slice(0, 3).map((a) => (
                                  <AvatarInitials key={a.id} name={a.name} className="h-6 w-6 text-[10px] ring-1.5 ring-white" />
                                ))}
                                {task.assignees.length > 3 && (
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[9px] font-medium text-gray-600 ring-1.5 ring-white">
                                    +{task.assignees.length - 3}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Status quick-switch */}
                        <Select
                          value={task.status}
                          onValueChange={(v) => handleStatusChange(task.id, v)}
                        >
                          <SelectTrigger className="h-7 text-xs rounded-lg" onClick={(e) => e.stopPropagation()}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {COLUMNS.map((c) => (
                              <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TaskDetailDialog
        taskId={selectedTaskId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onTaskUpdated={() => { mutateTasks(); revalidateAllTasks(); }}
      />

      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => { mutateTasks(); revalidateAllTasks(); }}
        defaultType="SPRINT_TASK"
        defaultSprintId={effectiveSprintId}
      />
    </div>
  );
}
