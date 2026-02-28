"use client";

import { useSession } from "next-auth/react";
import { useTasks, useSprints, revalidateAllTasks } from "@/hooks/use-data";
import type { TaskSummary, SprintSummary } from "@/hooks/use-data";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { useState, useMemo } from "react";
import {
  Zap,
  Calendar,
  ListTodo,
  Target,
  AlertTriangle,
  Clock,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

/* Circular progress ring */
function ProgressRing({
  progress,
  size = 90,
  strokeWidth = 7,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e0f3ff" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#052659" />
            <stop offset="100%" stopColor="#5483B3" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-[#021024]">{progress}%</span>
        <span className="text-[10px] text-[#64748b] font-medium">done</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  // 3 PARALLEL SWR calls (was 4 sequential fetches)
  const { tasks: myTasks, isLoading: loadingMy } = useTasks(
    userId ? { assigneeId: userId, parentId: "null" } : undefined,
  );
  const { sprints, isLoading: loadingSprints } = useSprints();
  const { tasks: allTasks, isLoading: loadingAll } = useTasks({ parentId: "null" });

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loading = !userId || loadingMy || loadingSprints || loadingAll;

  // Derived stats (computed from cached data, not separate fetches)
  const stats = useMemo(() => {
    return {
      total: myTasks.length,
      done: myTasks.filter((t) => t.status === "DONE").length,
      inProgress: myTasks.filter((t) => t.status === "IN_PROGRESS").length,
      todo: myTasks.filter((t) => t.status === "TODO" || t.status === "BACKLOG").length,
      blocked: myTasks.filter((t) => t.status === "BLOCKED").length,
    };
  }, [myTasks]);

  const completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  // Active sprint (derived from sprints cache)
  const activeSprint = useMemo(() => {
    const now = new Date();
    return sprints.find((s) => new Date(s.startDate) <= now && new Date(s.endDate) >= now) ?? null;
  }, [sprints]);

  // Sprint tasks (derived from allTasks cache — no extra fetch!)
  const sprintTasks = useMemo(() => {
    if (!activeSprint) return [];
    return allTasks.filter((t) => t.sprint?.id === activeSprint.id);
  }, [allTasks, activeSprint]);

  const sprintDone = sprintTasks.filter((t) => t.status === "DONE").length;
  const sprintTotal = sprintTasks.length;
  const sprintProgress = sprintTotal > 0 ? Math.round((sprintDone / sprintTotal) * 100) : 0;
  const sprintDaysLeft = activeSprint
    ? Math.max(0, Math.ceil((new Date(activeSprint.endDate).getTime() - Date.now()) / 86400000))
    : 0;

  // Overdue + due soon (derived from allTasks cache)
  const { overdueTasks, dueSoon } = useMemo(() => {
    const now = new Date();
    const in7 = new Date();
    in7.setDate(in7.getDate() + 7);

    const overdue = allTasks
      .filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE")
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

    const upcoming = allTasks
      .filter((t) => t.dueDate && new Date(t.dueDate) >= now && new Date(t.dueDate) <= in7 && t.status !== "DONE")
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

    return { overdueTasks: overdue, dueSoon: upcoming };
  }, [allTasks]);

  const openTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setDialogOpen(true);
  };

  const greetingTime = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  const statCards = [
    { label: "Total Tasks", value: stats.total, icon: Target, iconBg: "from-[#C1E8FF] to-[#e0f3ff]", iconColor: "text-[#052659]", textColor: "text-[#021024]" },
    { label: "Completed", value: stats.done, icon: CheckCircle2, iconBg: "from-green-100 to-emerald-50", iconColor: "text-emerald-700", textColor: "text-emerald-700" },
    { label: "In Progress", value: stats.inProgress, icon: TrendingUp, iconBg: "from-yellow-100 to-amber-50", iconColor: "text-amber-700", textColor: "text-amber-700" },
    { label: "Blocked", value: stats.blocked, icon: AlertTriangle, iconBg: "from-red-100 to-rose-50", iconColor: "text-red-700", textColor: "text-red-700" },
  ];

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse space-y-3">
          <div className="h-10 w-72 bg-gray-200/60 rounded-xl" />
          <div className="h-5 w-48 bg-gray-100/60 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-5 animate-pulse">
              <div className="h-8 w-12 bg-gray-200/60 rounded mb-2" />
              <div className="h-4 w-20 bg-gray-100/60 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome hero */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 animate-slide-up opacity-0" style={{ animationFillMode: "forwards" }}>
        <div>
          <p className="text-sm font-medium text-[#5483B3] tracking-wide uppercase mb-1">{greetingTime()}</p>
          <h1 className="text-3xl font-bold text-[#021024] tracking-tight">{session?.user?.name?.split(" ")[0]}</h1>
          <p className="text-sm text-[#64748b] mt-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        {overdueTasks.length > 0 && (
          <div className="flex items-center gap-2 bg-red-50/80 border border-red-200/60 text-red-700 px-4 py-2 rounded-xl text-sm font-medium backdrop-blur-sm">
            <AlertTriangle className="h-4 w-4" />
            {overdueTasks.length} overdue task{overdueTasks.length > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Stats row + progress ring */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className="glass-card rounded-2xl p-5 card-hover-lift gradient-border-top relative overflow-hidden animate-slide-up opacity-0"
            style={{ animationDelay: `${0.1 + i * 0.08}s`, animationFillMode: "forwards" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-3xl font-bold ${card.textColor}`}>{card.value}</p>
                <p className="text-xs text-[#64748b] font-medium mt-1">{card.label}</p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${card.iconBg} shadow-sm`}>
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
            </div>
          </div>
        ))}
        {stats.total > 0 && (
          <div className="glass-card rounded-2xl p-5 flex items-center justify-center col-span-2 lg:col-span-1 card-hover-lift animate-slide-up opacity-0" style={{ animationDelay: "0.42s", animationFillMode: "forwards" }}>
            <ProgressRing progress={completionRate} />
          </div>
        )}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Sprint */}
        <div className="glass-card rounded-2xl overflow-hidden card-hover-lift animate-slide-up opacity-0" style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}>
          <div className="p-5 border-b border-gray-100/80">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#C1E8FF] to-[#e0f3ff]">
                <Zap className="h-3.5 w-3.5 text-[#052659]" />
              </div>
              <span className="text-sm font-semibold text-[#021024]">Active Sprint</span>
            </div>
          </div>
          <div className="p-5">
            {activeSprint ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-[#021024]">{activeSprint.name}</h3>
                  <span className="text-[10px] bg-[#C1E8FF] text-[#021024] px-2.5 py-1 rounded-full font-semibold">{sprintDaysLeft}d left</span>
                </div>
                <p className="text-xs text-[#64748b]">
                  {new Date(activeSprint.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
                  {new Date(activeSprint.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-[#64748b]">{sprintDone}/{sprintTotal} tasks done</span>
                    <span className="text-xs font-bold text-[#052659]">{sprintProgress}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-700" style={{ width: `${sprintProgress}%` }} />
                  </div>
                </div>
                <Link href="/board" className="inline-flex items-center gap-1.5 text-xs text-[#5483B3] hover:text-[#052659] font-medium transition-colors group">
                  View board <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <Zap className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-[#64748b]">No active sprint</p>
              </div>
            )}
          </div>
        </div>

        {/* Overdue / Due Soon */}
        <div className="glass-card rounded-2xl overflow-hidden card-hover-lift animate-slide-up opacity-0" style={{ animationDelay: "0.6s", animationFillMode: "forwards" }}>
          <div className="p-5 border-b border-gray-100/80">
            <div className="flex items-center gap-2">
              {overdueTasks.length > 0 ? (
                <>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100"><AlertTriangle className="h-3.5 w-3.5 text-red-600" /></div>
                  <span className="text-sm font-semibold text-red-700">Overdue ({overdueTasks.length})</span>
                </>
              ) : (
                <>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100"><Clock className="h-3.5 w-3.5 text-orange-600" /></div>
                  <span className="text-sm font-semibold text-[#021024]">Due This Week</span>
                </>
              )}
            </div>
          </div>
          <div className="p-5">
            {overdueTasks.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {overdueTasks.slice(0, 4).map((t) => (
                  <button key={t.id} onClick={() => openTask(t.id)} className="flex w-full items-center gap-3 rounded-xl p-2.5 hover:bg-red-50/80 text-left transition-all duration-200 border border-red-100/60">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                    <span className="flex-1 text-sm truncate font-medium">{t.title}</span>
                    <span className="text-[10px] text-red-600 font-medium whitespace-nowrap">{new Date(t.dueDate!).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  </button>
                ))}
              </div>
            )}
            {dueSoon.length > 0 ? (
              <div className="space-y-1.5">
                {overdueTasks.length > 0 && <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.12em] mt-2 mb-1">Due soon</p>}
                {dueSoon.slice(0, overdueTasks.length > 0 ? 3 : 5).map((t) => (
                  <button key={t.id} onClick={() => openTask(t.id)} className="flex w-full items-center gap-3 rounded-xl p-2.5 hover:bg-muted/50 text-left transition-all duration-200">
                    <span className="flex-1 text-sm truncate">{t.title}</span>
                    <span className="text-[10px] text-[#64748b] whitespace-nowrap">{new Date(t.dueDate!).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  </button>
                ))}
              </div>
            ) : overdueTasks.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle2 className="h-8 w-8 text-green-300 mx-auto mb-2" />
                <p className="text-sm text-[#64748b]">No upcoming deadlines</p>
              </div>
            )}
          </div>
        </div>

        {/* Breakdown */}
        <div className="glass-card rounded-2xl overflow-hidden card-hover-lift animate-slide-up opacity-0" style={{ animationDelay: "0.7s", animationFillMode: "forwards" }}>
          <div className="p-5 border-b border-gray-100/80">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#C1E8FF] to-[#e0f3ff]"><BarChart3 className="h-3.5 w-3.5 text-[#052659]" /></div>
              <span className="text-sm font-semibold text-[#021024]">My Breakdown</span>
            </div>
          </div>
          <div className="p-5 space-y-4">
            {[
              { label: "Done", val: stats.done, color: "bg-emerald-500", pct: stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0 },
              { label: "In Progress", val: stats.inProgress, color: "bg-amber-500", pct: stats.total > 0 ? Math.round((stats.inProgress / stats.total) * 100) : 0 },
              { label: "To Do", val: stats.todo, color: "bg-[#5483B3]", pct: stats.total > 0 ? Math.round((stats.todo / stats.total) * 100) : 0 },
              { label: "Blocked", val: stats.blocked, color: "bg-red-500", pct: stats.total > 0 ? Math.round((stats.blocked / stats.total) * 100) : 0 },
            ].map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#64748b] font-medium">{item.label}</span>
                  <span className="text-xs font-bold text-[#021024]">{item.val}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full transition-all duration-700`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* My Tasks */}
      <div className="glass-card rounded-2xl overflow-hidden animate-slide-up opacity-0" style={{ animationDelay: "0.8s", animationFillMode: "forwards" }}>
        <div className="p-5 border-b border-gray-100/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#C1E8FF] to-[#e0f3ff]"><ListTodo className="h-3.5 w-3.5 text-[#052659]" /></div>
            <span className="text-sm font-semibold text-[#021024]">My Tasks</span>
            {myTasks.length > 0 && <span className="text-xs text-[#64748b]">({stats.total})</span>}
          </div>
          <Link href="/general" className="text-xs text-[#5483B3] hover:text-[#052659] font-medium flex items-center gap-1 transition-colors group">
            View all <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        <div className="p-5">
          {myTasks.length === 0 ? (
            <div className="text-center py-10">
              <ListTodo className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-[#64748b]">No tasks assigned to you</p>
            </div>
          ) : (
            <div className="space-y-1">
              {myTasks.slice(0, 10).map((t) => {
                const taskIsOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE";
                return (
                  <button
                    key={t.id}
                    onClick={() => openTask(t.id)}
                    className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all duration-200 group ${taskIsOverdue ? "hover:bg-red-50/60 border border-red-100/60" : "hover:bg-gray-50/50"}`}
                  >
                    <span className="flex-1 text-sm truncate font-medium text-[#021024] group-hover:text-[#052659] transition-colors">{t.title}</span>
                    {t.sprint && <span className="hidden sm:inline text-[10px] text-[#052659] bg-[#C1E8FF]/60 px-2 py-0.5 rounded-full font-medium">{t.sprint.name}</span>}
                    {taskIsOverdue && (
                      <span className="text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                        <AlertTriangle className="h-2.5 w-2.5" />Overdue
                      </span>
                    )}
                    {t.dueDate && !taskIsOverdue && (
                      <span className="text-[10px] text-[#64748b] whitespace-nowrap">{new Date(t.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <TaskDetailDialog taskId={selectedTaskId} open={dialogOpen} onOpenChange={setDialogOpen} onTaskUpdated={revalidateAllTasks} />
    </div>
  );
}
