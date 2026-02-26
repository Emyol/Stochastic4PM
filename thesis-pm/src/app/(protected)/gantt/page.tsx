"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";

interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface GanttTask {
  id: string;
  title: string;
  startDate: string | null;
  dueDate: string | null;
  status: string;
  priority: string;
  assignee: { name: string } | null;
  _count: { subtasks: number };
}

const STATUS_COLORS: Record<string, string> = {
  BACKLOG: "#9CA3AF",
  TODO: "#60A5FA",
  IN_PROGRESS: "#FBBF24",
  IN_REVIEW: "#A78BFA",
  DONE: "#34D399",
  BLOCKED: "#F87171",
};

export default function GanttPage() {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState("");
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/sprints")
      .then((r) => r.json())
      .then((data: Sprint[]) => {
        setSprints(data);
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
    const res = await fetch(`/api/tasks?sprintId=${selectedSprintId}`);
    if (res.ok) {
      setTasks(await res.json());
    }
  }, [selectedSprintId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Find sprint date range
  const sprint = sprints.find((s) => s.id === selectedSprintId);
  const sprintStart = sprint ? new Date(sprint.startDate) : new Date();
  const sprintEnd = sprint ? new Date(sprint.endDate) : new Date();
  const totalDays = Math.max(
    1,
    Math.ceil(
      (sprintEnd.getTime() - sprintStart.getTime()) / (1000 * 60 * 60 * 24),
    ),
  );

  // Generate date headers
  const dates: Date[] = [];
  for (let i = 0; i <= totalDays; i++) {
    const d = new Date(sprintStart);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }

  const getBarStyle = (task: GanttTask) => {
    const start = task.startDate
      ? new Date(task.startDate)
      : task.dueDate
        ? new Date(task.dueDate)
        : sprintStart;
    const end = task.dueDate
      ? new Date(task.dueDate)
      : task.startDate
        ? new Date(task.startDate)
        : sprintStart;

    const startOffset = Math.max(
      0,
      (start.getTime() - sprintStart.getTime()) / (1000 * 60 * 60 * 24),
    );
    const duration = Math.max(
      1,
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );

    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;

    return {
      left: `${left}%`,
      width: `${Math.min(width, 100 - left)}%`,
      backgroundColor: STATUS_COLORS[task.status] || "#9CA3AF",
    };
  };

  const hasMissingDates = (task: GanttTask) => !task.startDate || !task.dueDate;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <h1 className="text-2xl font-bold text-[#0A2342]">Gantt Chart</h1>
        <div className="flex-1" />
        <Select value={selectedSprintId} onValueChange={setSelectedSprintId}>
          <SelectTrigger className="w-56">
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

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1">
            <div
              className="h-3 w-6 rounded"
              style={{ backgroundColor: color }}
            />
            <span>{status.replace(/_/g, " ")}</span>
          </div>
        ))}
      </div>

      {/* Gantt */}
      <div
        className="bg-white rounded-lg border overflow-x-auto"
        ref={containerRef}
      >
        {/* Date header */}
        <div className="flex border-b min-w-[800px]">
          <div className="w-64 flex-shrink-0 px-3 py-2 text-xs font-medium text-muted-foreground border-r bg-muted">
            Task
          </div>
          <div className="flex-1 relative">
            <div className="flex">
              {dates.map((d, i) => (
                <div
                  key={i}
                  className="flex-1 text-center text-xs py-2 border-r text-muted-foreground"
                  style={{ minWidth: "40px" }}
                >
                  {d.getDate()}/{d.getMonth() + 1}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Task rows */}
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground min-w-[800px]">
            No tasks in this sprint
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="flex border-b hover:bg-muted/30 min-w-[800px]"
            >
              <div className="w-64 flex-shrink-0 px-3 py-3 text-sm border-r flex items-center gap-2">
                <span className="truncate flex-1">{task.title}</span>
                {hasMissingDates(task) && (
                  <span title="Missing start or due date">
                    <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  </span>
                )}
              </div>
              <div className="flex-1 relative py-2 px-1">
                <div
                  className="absolute top-2 h-6 rounded-md text-xs text-white flex items-center justify-center overflow-hidden"
                  style={getBarStyle(task)}
                  title={`${task.title} (${task.status})`}
                >
                  <span className="px-2 truncate text-[10px]">
                    {task.assignee?.name || ""}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
