"use client";

import { useEffect, useState, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";

interface CalendarTask {
  id: string;
  title: string;
  startDate: string | null;
  dueDate: string | null;
  status: string;
  type: string;
}

interface CalendarSprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    taskId?: string;
    type: "task-start" | "task-due" | "sprint-start" | "sprint-end";
  };
}

const STATUS_COLORS: Record<string, string> = {
  BACKLOG: "#9CA3AF",
  TODO: "#60A5FA",
  IN_PROGRESS: "#FBBF24",
  IN_REVIEW: "#A78BFA",
  DONE: "#34D399",
  BLOCKED: "#F87171",
};

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadEvents = useCallback(async () => {
    const [tasksRes, sprintsRes] = await Promise.all([
      fetch("/api/tasks?parentId=null"),
      fetch("/api/sprints"),
    ]);

    const calEvents: CalendarEvent[] = [];

    if (tasksRes.ok) {
      const tasks: CalendarTask[] = await tasksRes.json();
      for (const t of tasks) {
        const color = STATUS_COLORS[t.status] || "#9CA3AF";
        if (t.startDate) {
          calEvents.push({
            id: `start-${t.id}`,
            title: `Start: ${t.title}`,
            start: t.startDate,
            backgroundColor: color,
            borderColor: color,
            extendedProps: { taskId: t.id, type: "task-start" },
          });
        }
        if (t.dueDate) {
          calEvents.push({
            id: `due-${t.id}`,
            title: `Due: ${t.title}`,
            start: t.dueDate,
            backgroundColor: color,
            borderColor: color,
            extendedProps: { taskId: t.id, type: "task-due" },
          });
        }
      }
    }

    if (sprintsRes.ok) {
      const sprints: CalendarSprint[] = await sprintsRes.json();
      for (const s of sprints) {
        calEvents.push({
          id: `sprint-start-${s.id}`,
          title: `Sprint Start: ${s.name}`,
          start: s.startDate,
          backgroundColor: "#0F4C8A",
          borderColor: "#0F4C8A",
          extendedProps: { type: "sprint-start" },
        });
        calEvents.push({
          id: `sprint-end-${s.id}`,
          title: `Sprint End: ${s.name}`,
          start: s.endDate,
          backgroundColor: "#0A2342",
          borderColor: "#0A2342",
          extendedProps: { type: "sprint-end" },
        });
      }
    }

    setEvents(calEvents);
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#0A2342]">Calendar</h1>

      <div className="bg-white rounded-lg border p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          eventClick={(info) => {
            const taskId = info.event.extendedProps.taskId;
            if (taskId) {
              setSelectedTaskId(taskId);
              setDialogOpen(true);
            }
          }}
          height="auto"
          eventDisplay="block"
          dayMaxEvents={3}
        />
      </div>

      <TaskDetailDialog
        taskId={selectedTaskId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onTaskUpdated={loadEvents}
      />
    </div>
  );
}
