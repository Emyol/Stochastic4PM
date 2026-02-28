import useSWR, { mutate } from "swr";

// Global fetcher for SWR
const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`Fetch error: ${res.status}`);
    return res.json();
  });

// ─── Tasks ───

export interface TaskSummary {
  id: string;
  title: string;
  status: string;
  priority: string;
  type: string;
  dueDate: string | null;
  startDate: string | null;
  assignees: Array<{ id: string; name: string; email?: string }>;
  reporter?: { id: string; name: string; email?: string };
  sprint: { id: string; name: string } | null;
  _count: { subtasks: number; comments: number; attachments: number };
}

function buildTaskKey(params?: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") sp.set(k, v);
    });
  }
  const qs = sp.toString();
  return `/api/tasks${qs ? `?${qs}` : ""}`;
}

export function useTasks(params?: Record<string, string | undefined>) {
  const key = buildTaskKey(params);
  const { data, error, isLoading, mutate: boundMutate } = useSWR<TaskSummary[]>(
    key,
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 2000,
    },
  );
  return { tasks: data ?? [], error, isLoading, mutate: boundMutate, key };
}

/** Revalidate all task caches (any query params) */
export function revalidateAllTasks() {
  mutate((key) => typeof key === "string" && key.startsWith("/api/tasks"), undefined, { revalidate: true });
}

// ─── Sprints ───

export interface SprintSummary {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  _count: { tasks: number };
}

export function useSprints() {
  const { data, error, isLoading, mutate: boundMutate } = useSWR<SprintSummary[]>(
    "/api/sprints",
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 2000,
    },
  );
  return { sprints: data ?? [], error, isLoading, mutate: boundMutate };
}

export function revalidateSprints() {
  mutate("/api/sprints");
}

// ─── Users ───

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export function useUsers() {
  const { data, error, isLoading, mutate: boundMutate } = useSWR<UserSummary[]>(
    "/api/users",
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 2000,
    },
  );
  return { users: data ?? [], error, isLoading, mutate: boundMutate };
}

export function revalidateUsers() {
  mutate("/api/users");
}
