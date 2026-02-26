"use client";

import { useEffect, useState, useCallback } from "react";
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
import {
  StatusBadge,
  PriorityBadge,
  AvatarInitials,
} from "@/components/shared/badges";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface BoardTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignee: { id: string; name: string; email: string } | null;
  _count: { subtasks: number; comments: number; attachments: number };
}

const COLUMNS = [
  { key: "BACKLOG", label: "Backlog", color: "bg-gray-200" },
  { key: "TODO", label: "To Do", color: "bg-blue-200" },
  { key: "IN_PROGRESS", label: "In Progress", color: "bg-yellow-200" },
  { key: "IN_REVIEW", label: "In Review", color: "bg-purple-200" },
  { key: "DONE", label: "Done", color: "bg-green-200" },
  { key: "BLOCKED", label: "Blocked", color: "bg-red-200" },
];

export default function BoardPage() {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<string>("");
  const [tasks, setTasks] = useState<BoardTask[]>([]);
  const [search, setSearch] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sprints")
      .then((r) => r.json())
      .then((data: Sprint[]) => {
        setSprints(data);
        // Default to active sprint
        const now = new Date();
        const active = data.find(
          (s) => new Date(s.startDate) <= now && new Date(s.endDate) >= now,
        );
        if (active) setSelectedSprintId(active.id);
        else if (data.length > 0) setSelectedSprintId(data[0].id);
      });
  }, []);

  const loadTasks = useCallback(async () => {
    if (!selectedSprintId) return;
    setLoading(true);
    const params = new URLSearchParams({
      sprintId: selectedSprintId,
      parentId: "null",
    });
    if (search) params.set("q", search);
    const res = await fetch(`/api/tasks?${params}`);
    if (res.ok) {
      setTasks(await res.json());
    }
    setLoading(false);
  }, [selectedSprintId, search]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      toast.success("Status updated");
      loadTasks();
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to update");
    }
  };

  const getColumnTasks = (status: string) =>
    tasks.filter((t) => t.status === status);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <h1 className="text-2xl font-bold text-[#0A2342]">Board</h1>
        <div className="flex-1" />
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks…"
              className="pl-8 w-48"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={selectedSprintId} onValueChange={setSelectedSprintId}>
            <SelectTrigger className="w-48">
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
            className="bg-[#0F4C8A] hover:bg-[#0D3B73]"
          >
            <Plus className="h-4 w-4 mr-1" />
            Task
          </Button>
        </div>
      </div>

      {/* Board columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colTasks = getColumnTasks(col.key);
          return (
            <div key={col.key} className="flex-shrink-0 w-72">
              <div className="flex items-center gap-2 mb-3">
                <div className={`h-3 w-3 rounded-full ${col.color}`} />
                <h3 className="font-semibold text-sm text-[#0A2342]">
                  {col.label}
                </h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {colTasks.length}
                </span>
              </div>
              <div className="space-y-2 min-h-[200px]">
                {colTasks.map((task) => (
                  <Card
                    key={task.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      setSelectedTaskId(task.id);
                      setDetailOpen(true);
                    }}
                  >
                    <CardContent className="p-3 space-y-2">
                      <p className="text-sm font-medium leading-tight">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <PriorityBadge priority={task.priority} />
                        {task.dueDate && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {task._count.subtasks > 0 && (
                            <span>📋{task._count.subtasks}</span>
                          )}
                          {task._count.comments > 0 && (
                            <span>💬{task._count.comments}</span>
                          )}
                          {task._count.attachments > 0 && (
                            <span>📎{task._count.attachments}</span>
                          )}
                        </div>
                        {task.assignee && (
                          <AvatarInitials
                            name={task.assignee.name}
                            className="h-6 w-6 text-[10px]"
                          />
                        )}
                      </div>
                      {/* Status change dropdown */}
                      <Select
                        value={task.status}
                        onValueChange={(v) => {
                          handleStatusChange(task.id, v);
                        }}
                      >
                        <SelectTrigger
                          className="h-7 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COLUMNS.map((c) => (
                            <SelectItem key={c.key} value={c.key}>
                              {c.label}
                            </SelectItem>
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
        defaultType="SPRINT_TASK"
        defaultSprintId={selectedSprintId}
      />
    </div>
  );
}
