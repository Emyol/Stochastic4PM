"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Key,
  Users,
  Shield,
  UserCircle,
} from "lucide-react";
import { AvatarInitials } from "@/components/shared/badges";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function UsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [dialogMode, setDialogMode] = useState<
    "create" | "edit" | "reset" | null
  >(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Delete confirmation
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    loadUsers();
  }, [session, router]);

  const loadUsers = async () => {
    setPageLoading(true);
    const res = await fetch("/api/users");
    if (res.ok) setUsers(await res.json());
    setPageLoading(false);
  };

  const openCreate = () => {
    setDialogMode("create");
    setSelectedUser(null);
    setName("");
    setEmail("");
    setRole("MEMBER");
    setPassword("");
  };

  const openEdit = (user: User) => {
    setDialogMode("edit");
    setSelectedUser(user);
    setName(user.name);
    setRole(user.role);
  };

  const openResetPassword = (user: User) => {
    setDialogMode("reset");
    setSelectedUser(user);
    setPassword("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("User created");
      setDialogMode(null);
      loadUsers();
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to create user");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setLoading(true);
    const res = await fetch(`/api/users/${selectedUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, role }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("User updated");
      setDialogMode(null);
      loadUsers();
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to update user");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setLoading(true);
    const res = await fetch(`/api/users/${selectedUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Password reset successfully");
      setDialogMode(null);
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to reset password");
    }
  };

  const confirmDeleteUser = (user: User) => {
    setDeletingUser(user);
    setConfirmDeleteOpen(true);
  };

  const deleteUser = async () => {
    if (!deletingUser) return;
    setDeleteLoading(true);
    const res = await fetch(`/api/users/${deletingUser.id}`, {
      method: "DELETE",
    });
    setDeleteLoading(false);
    if (res.ok) {
      toast.success("User deleted");
      setConfirmDeleteOpen(false);
      setDeletingUser(null);
      loadUsers();
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to delete user");
    }
  };

  if (session?.user?.role !== "ADMIN") return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-[#0F4C8A]" />
          <h1 className="text-2xl font-bold text-[#0A2342]">Users</h1>
          {!pageLoading && (
            <span className="text-sm text-muted-foreground">
              ({users.length})
            </span>
          )}
        </div>
        <Button
          onClick={openCreate}
          className="bg-[#0F4C8A] hover:bg-[#0D3B73]"
        >
          <Plus className="h-4 w-4 mr-1" />
          User
        </Button>
      </div>

      {pageLoading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-gray-200 rounded" />
                    <div className="h-3 w-48 bg-gray-100 rounded" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 w-8 bg-gray-100 rounded" />
                    <div className="h-8 w-8 bg-gray-100 rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-3">
          {users.map((user) => (
            <Card key={user.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <AvatarInitials
                  name={user.name}
                  className="h-10 w-10 text-sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-[#0A2342]">
                      {user.name}
                    </h3>
                    <Badge
                      variant={user.role === "ADMIN" ? "default" : "secondary"}
                      className={`text-[10px] ${user.role === "ADMIN" ? "bg-[#0F4C8A]" : ""}`}
                    >
                      {user.role === "ADMIN" ? (
                        <span className="flex items-center gap-1">
                          <Shield className="h-2.5 w-2.5" /> Admin
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <UserCircle className="h-2.5 w-2.5" /> Member
                        </span>
                      )}
                    </Badge>
                    {user.id === session?.user?.id && (
                      <span className="text-[10px] text-[#0F4C8A] bg-[#CFE8FF] px-1.5 py-0.5 rounded-full font-medium">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {user.email}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Joined{" "}
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => openEdit(user)}
                    title="Edit"
                    className="h-8 w-8"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => openResetPassword(user)}
                    title="Reset password"
                    className="h-8 w-8"
                  >
                    <Key className="h-3.5 w-3.5" />
                  </Button>
                  {user.id !== session?.user?.id && (
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => confirmDeleteUser(user)}
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog
        open={dialogMode === "create"}
        onOpenChange={(open) => !open && setDialogMode(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MEMBER">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Temporary Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
                minLength={8}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogMode(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#0F4C8A] hover:bg-[#0D3B73]"
              >
                {loading ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={dialogMode === "edit"}
        onOpenChange={(open) => !open && setDialogMode(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MEMBER">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogMode(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#0F4C8A] hover:bg-[#0D3B73]"
              >
                {loading ? "Saving…" : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={dialogMode === "reset"}
        onOpenChange={(open) => !open && setDialogMode(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password for {selectedUser?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
                minLength={8}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogMode(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#0F4C8A] hover:bg-[#0D3B73]"
              >
                {loading ? "Resetting…" : "Reset Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Delete user"
        description={`Are you sure you want to delete "${deletingUser?.name}"? All tasks assigned to this user will be unassigned. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteLoading}
        onConfirm={deleteUser}
      />
    </div>
  );
}
