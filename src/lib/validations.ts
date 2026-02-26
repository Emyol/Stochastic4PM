import { z } from "zod";

// ---------- Auth ----------
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ---------- Users ----------
export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(["ADMIN", "MEMBER"]).optional(),
  password: z.string().min(8).optional(),
});

// ---------- Sprints ----------
export const createSprintSchema = z.object({
  name: z.string().min(1, "Sprint name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

export const updateSprintSchema = z.object({
  name: z.string().min(1).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// ---------- Tasks ----------
export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["SPRINT_TASK", "GENERAL_TASK"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  status: z
    .enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "BLOCKED"])
    .optional(),
  startDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  sprintId: z.string().nullable().optional(),
  assigneeIds: z.array(z.string()).optional(),
  parentId: z.string().nullable().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z
    .enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "BLOCKED"])
    .optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  startDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  sprintId: z.string().nullable().optional(),
  assigneeIds: z.array(z.string()).optional(),
});

// ---------- Comments ----------
export const createCommentSchema = z.object({
  body: z.string().min(1, "Comment cannot be empty"),
});

// ---------- Change password ----------
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

// Allowed attachment extensions
export const ALLOWED_EXTENSIONS = [
  "pdf",
  "docx",
  "pptx",
  "xlsx",
  "png",
  "jpg",
  "jpeg",
  "txt",
  "md",
  "zip",
];
export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
