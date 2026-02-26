"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, PriorityBadge } from "@/components/shared/badges";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import {
  Zap,
  Calendar,
  ListTodo,
  Target,
  AlertTriangle,
  Clock,
  TrendingUp,
  CheckCircle2,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface DashboardTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  type: string;
  assignees: Array<{ id: string; name: string }>;
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
  const [overdueTasks, setOverdueTasks] = useState<DashboardTask[]>([]);
  const [activeSprint, setActiveSprint] = useState<DashboardSprint | null>(
    null,
  );
  const [sprintTasks, setSprintTasks] = useState<DashboardTask[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    done: 0,
    inProgress: 0,
    todo: 0,
    blocked: 0,
  });
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);

    try {
      // Fetch my tasks
      const myRes = await fetch(
        `/api/tasks?assigneeId=${session.user.id}&parentId=null`,
      );
      if (myRes.ok) {
        const tasks: DashboardTask[] = await myRes.json();
        setMyTasks(tasks.slice(0, 10));
        setStats({
          total: tasks.length,
          done: tasks.filter((t) => t.status === "DONE").length,
          inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
          todo: tasks.filter(
            (t) => t.status === "TODO" || t.status === "BACKLOG",
          ).length,
          blocked: tasks.filter((t) => t.status === "BLOCKED").length,
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

        // Load sprint tasks for progress
        if (active) {
          const stRes = await fetch(
            `/api/tasks?sprintId=${active.id}&parentId=null`,
          );
          if (stRes.ok) setSprintTasks(await stRes.json());
        }
      }

      // Fetch all tasks for due soon / overdue
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

        const overdue = all
          .filter(
            (t) =>
              t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE",
          )
          .sort(
            (a, b) =>
              new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime(),
          );
        setOverdueTasks(overdue);
      }
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const completionRate =
    stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  // Sprint progress
  const sprintDone = sprintTasks.filter((t) => t.status === "DONE").length;
  const sprintTotal = sprintTasks.length;
  const sprintProgress =
    sprintTotal > 0 ? Math.round((sprintDone / sprintTotal) * 100) : 0;
  const sprintDaysLeft = activeSprint
    ? Math.max(
        0,
        Math.ceil(
          (new Date(activeSprint.endDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : 0;

  const openTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setDialogOpen(true);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-100 rounded animate-pulse mt-2" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between animate-pulse">
                  <div className="space-y-2">
                    <div className="h-7 w-10 bg-gray-200 rounded" />
                    <div className="h-3 w-16 bg-gray-100 rounded" />
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-gray-200" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-4 animate-pulse">
            <div className="h-4 w-32 bg-gray-200 rounded mb-3" />
            <div className="h-3 bg-gray-100 rounded-full" />
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-3 animate-pulse">
                <div className="h-5 w-32 bg-gray-200 rounded" />
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-10 bg-gray-100 rounded" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2342]">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {session?.user?.name}!
          </p>
        </div>
        {overdueTasks.length > 0 && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium">
            <AlertTriangle className="h-4 w-4" />
            {overdueTasks.length} overdue task
            {overdueTasks.length > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#0F4C8A] to-[#1366A6]" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#0A2342]">
                  {stats.total}
                </p>
                <p className="text-xs text-muted-foreground font-medium">
                  Total Tasks
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#CFE8FF] to-[#E8F4FF] group-hover:scale-110 transition-transform duration-300">
                <Target className="h-5 w-5 text-[#0F4C8A]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-emerald-400" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-700">
                  {stats.done}
                </p>
                <p className="text-xs text-muted-foreground font-medium">
                  Completed
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-100 to-emerald-50 group-hover:scale-110 transition-transform duration-300">
                <CheckCircle2 className="h-5 w-5 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-500 to-amber-400" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-yellow-700">
                  {stats.inProgress}
                </p>
                <p className="text-xs text-muted-foreground font-medium">
                  In Progress
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-100 to-amber-50 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-5 w-5 text-yellow-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-400" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-700">
                  {dueSoon.length}
                </p>
                <p className="text-xs text-muted-foreground font-medium">
                  Due This Week
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="h-5 w-5 text-orange-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden col-span-2 lg:col-span-1 group hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-rose-400" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-700">
                  {stats.blocked}
                </p>
                <p className="text-xs text-muted-foreground font-medium">
                  Blocked
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-100 to-rose-50 group-hover:scale-110 transition-transform duration-300">
                <AlertTriangle className="h-5 w-5 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress bar */}
      {stats.total > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#0F4C8A]" />
                <span className="text-sm font-semibold text-[#0A2342]">
                  My Progress
                </span>
              </div>
              <span className="text-sm font-bold text-[#0F4C8A]">
                {completionRate}%
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#0F4C8A] to-[#1366A6]"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                {stats.done} done
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-yellow-500" />
                {stats.inProgress} in progress
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-gray-400" />
                {stats.todo} to do
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Sprint */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#1366A6]" />
              Active Sprint
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {activeSprint ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-[#0A2342]">
                    {activeSprint.name}
                  </h3>
                  <span className="text-xs bg-[#CFE8FF] text-[#0A2342] px-2 py-0.5 rounded-full font-medium">
                    {sprintDaysLeft}d left
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(activeSprint.startDate).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric" },
                  )}{" "}
                  –{" "}
                  {new Date(activeSprint.endDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">
                      {sprintDone}/{sprintTotal} tasks done
                    </span>
                    <span className="text-xs font-semibold text-[#0F4C8A]">
                      {sprintProgress}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${sprintProgress}%` }}
                    />
                  </div>
                </div>
                <Link
                  href="/board"
                  className="inline-flex items-center gap-1 text-xs text-[#1366A6] hover:text-[#0D3B73] font-medium mt-1"
                >
                  View board <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <Zap className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No active sprint
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue / Due Soon */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {overdueTasks.length > 0 ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-red-700">
                    Overdue ({overdueTasks.length})
                  </span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 text-orange-600" />
                  Due This Week
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {overdueTasks.length > 0 ? (
              <div className="space-y-1.5 mb-3">
                {overdueTasks.slice(0, 4).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => openTask(t.id)}
                    className="flex w-full items-center gap-3 rounded-lg p-2.5 hover:bg-red-50 text-left transition-colors border border-red-100"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                    <span className="flex-1 text-sm truncate font-medium">
                      {t.title}
                    </span>
                    <span className="text-[10px] text-red-600 font-medium whitespace-nowrap">
                      {new Date(t.dueDate!).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}

            {dueSoon.length > 0 ? (
              <div className="space-y-1.5">
                {overdueTasks.length > 0 && (
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-2 mb-1">
                    Due soon
                  </p>
                )}
                {dueSoon.slice(0, overdueTasks.length > 0 ? 3 : 5).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => openTask(t.id)}
                    className="flex w-full items-center gap-3 rounded-lg p-2.5 hover:bg-muted text-left transition-colors"
                  >
                    <StatusBadge status={t.status} />
                    <span className="flex-1 text-sm truncate">{t.title}</span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {new Date(t.dueDate!).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              overdueTasks.length === 0 && (
                <div className="text-center py-6">
                  <CheckCircle2 className="h-8 w-8 text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No upcoming deadlines
                  </p>
                </div>
              )
            )}
          </CardContent>
        </Card>
      </div>

      {/* My Tasks */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-[#1366A6]" />
              My Tasks
              {myTasks.length > 0 && (
                <span className="text-xs font-normal text-muted-foreground">
                  ({stats.total})
                </span>
              )}
            </CardTitle>
            <Link
              href="/general"
              className="text-xs text-[#1366A6] hover:text-[#0D3B73] font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {myTasks.length === 0 ? (
            <div className="text-center py-8">
              <ListTodo className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No tasks assigned to you
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {myTasks.map((t) => {
                const taskIsOverdue =
                  t.dueDate &&
                  new Date(t.dueDate) < new Date() &&
                  t.status !== "DONE";
                return (
                  <button
                    key={t.id}
                    onClick={() => openTask(t.id)}
                    className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors ${
                      taskIsOverdue
                        ? "hover:bg-red-50 border border-red-100"
                        : "hover:bg-muted"
                    }`}
                  >
                    <StatusBadge status={t.status} />
                    <PriorityBadge priority={t.priority} />
                    <span className="flex-1 text-sm truncate font-medium">
                      {t.title}
                    </span>
                    {t.sprint && (
                      <span className="hidden sm:inline text-[10px] text-[#0F4C8A] bg-[#CFE8FF] px-2 py-0.5 rounded-full font-medium">
                        {t.sprint.name}
                      </span>
                    )}
                    {taskIsOverdue && (
                      <span className="text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        Overdue
                      </span>
                    )}
                    {t.dueDate && !taskIsOverdue && (
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {new Date(t.dueDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </button>
                );
              })}
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
