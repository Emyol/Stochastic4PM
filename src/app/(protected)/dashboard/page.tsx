"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  StatusBadge,
  PriorityBadge,
  AvatarInitials,
} from "@/components/shared/badges";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { Zap, Calendar, ListTodo, Target } from "lucide-react";

interface DashboardTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  type: string;
  assignee: { id: string; name: string } | null;
  sprint: { id: string; name: string } | null;
}

interface DashboardSprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  _count: { tasks: number };
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [myTasks, setMyTasks] = useState<DashboardTask[]>([]);
  const [dueSoon, setDueSoon] = useState<DashboardTask[]>([]);
  const [activeSprint, setActiveSprint] = useState<DashboardSprint | null>(
    null,
  );
  const [stats, setStats] = useState({ total: 0, done: 0, inProgress: 0 });
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, [session]);

  const loadDashboard = async () => {
    if (!session?.user) return;

    // Fetch my tasks
    const myRes = await fetch(
      `/api/tasks?assigneeId=${session.user.id}&parentId=null`,
    );
    if (myRes.ok) {
      const tasks = await myRes.json();
      setMyTasks(tasks.slice(0, 10));
      setStats({
        total: tasks.length,
        done: tasks.filter((t: DashboardTask) => t.status === "DONE").length,
        inProgress: tasks.filter(
          (t: DashboardTask) => t.status === "IN_PROGRESS",
        ).length,
      });
    }

    // Fetch sprints for active sprint
    const spRes = await fetch("/api/sprints");
    if (spRes.ok) {
      const sprints: DashboardSprint[] = await spRes.json();
      const now = new Date();
      const active = sprints.find(
        (s) => new Date(s.startDate) <= now && new Date(s.endDate) >= now,
      );
      setActiveSprint(active || null);
    }

    // Fetch tasks due in next 7 days
    const allRes = await fetch(`/api/tasks?parentId=null`);
    if (allRes.ok) {
      const all: DashboardTask[] = await allRes.json();
      const now = new Date();
      const in7 = new Date();
      in7.setDate(in7.getDate() + 7);
      const upcoming = all
        .filter(
          (t) =>
            t.dueDate &&
            new Date(t.dueDate) >= now &&
            new Date(t.dueDate) <= in7 &&
            t.status !== "DONE",
        )
        .sort(
          (a, b) =>
            new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime(),
        );
      setDueSoon(upcoming);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0A2342]">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.user?.name}!
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#CFE8FF]">
              <Target className="h-6 w-6 text-[#0F4C8A]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">My Tasks</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <ListTodo className="h-6 w-6 text-green-700" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.done}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
              <Zap className="h-6 w-6 text-yellow-700" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.inProgress}</p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
              <Calendar className="h-6 w-6 text-orange-700" />
            </div>
            <div>
              <p className="text-2xl font-bold">{dueSoon.length}</p>
              <p className="text-sm text-muted-foreground">Due This Week</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Sprint */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#1366A6]" />
              Active Sprint
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeSprint ? (
              <div>
                <p className="font-medium">{activeSprint.name}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(activeSprint.startDate).toLocaleDateString()} –{" "}
                  {new Date(activeSprint.endDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeSprint._count.tasks} tasks
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">No active sprint</p>
            )}
          </CardContent>
        </Card>

        {/* Due Soon */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              Due This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dueSoon.length === 0 ? (
              <p className="text-muted-foreground">No upcoming deadlines</p>
            ) : (
              <div className="space-y-2">
                {dueSoon.slice(0, 5).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTaskId(t.id);
                      setDialogOpen(true);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-muted text-left transition-colors"
                  >
                    <StatusBadge status={t.status} />
                    <span className="flex-1 text-sm truncate">{t.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(t.dueDate!).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* My Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">My Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {myTasks.length === 0 ? (
            <p className="text-muted-foreground">No tasks assigned to you</p>
          ) : (
            <div className="space-y-2">
              {myTasks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTaskId(t.id);
                    setDialogOpen(true);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg p-3 hover:bg-muted text-left transition-colors"
                >
                  <StatusBadge status={t.status} />
                  <PriorityBadge priority={t.priority} />
                  <span className="flex-1 text-sm truncate">{t.title}</span>
                  {t.sprint && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {t.sprint.name}
                    </span>
                  )}
                  {t.dueDate && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(t.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TaskDetailDialog
        taskId={selectedTaskId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onTaskUpdated={loadDashboard}
      />
    </div>
  );
}
