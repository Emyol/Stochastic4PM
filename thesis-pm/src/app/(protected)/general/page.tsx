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
import { Plus, Search } from "lucide-react";

interface GeneralTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignee: { id: string; name: string; email: string } | null;
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

  const loadTasks = useCallback(async () => {
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
  }, [search, statusFilter]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <h1 className="text-2xl font-bold text-[#0A2342]">General Tasks</h1>
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
            className="bg-[#0F4C8A] hover:bg-[#0D3B73]"
          >
            <Plus className="h-4 w-4 mr-1" />
            Task
          </Button>
        </div>
      </div>

      {/* Tasks list */}
      {tasks.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No general tasks found
        </div>
      ) : (
        <div className="space-y-2">
          {/* Desktop table header */}
          <div className="hidden md:grid md:grid-cols-[1fr_120px_100px_140px_100px] gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase">
            <span>Title</span>
            <span>Status</span>
            <span>Priority</span>
            <span>Due Date</span>
            <span>Assignee</span>
          </div>
          {tasks.map((task) => (
            <Card
              key={task.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setSelectedTaskId(task.id);
                setDetailOpen(true);
              }}
            >
              <CardContent className="p-4">
                {/* Desktop row */}
                <div className="hidden md:grid md:grid-cols-[1fr_120px_100px_140px_100px] gap-4 items-center">
                  <span className="text-sm font-medium truncate">
                    {task.title}
                  </span>
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                  <span className="text-sm text-muted-foreground">
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString()
                      : "—"}
                  </span>
                  <div>
                    {task.assignee ? (
                      <AvatarInitials
                        name={task.assignee.name}
                        className="h-6 w-6 text-[10px]"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
                {/* Mobile card */}
                <div className="md:hidden space-y-2">
                  <p className="text-sm font-medium">{task.title}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={task.status} />
                    <PriorityBadge priority={task.priority} />
                    {task.dueDate && (
                      <span className="text-xs text-muted-foreground">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {task.assignee && (
                    <div className="flex items-center gap-2 text-xs">
                      <AvatarInitials
                        name={task.assignee.name}
                        className="h-5 w-5 text-[10px]"
                      />
                      <span>{task.assignee.name}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
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
