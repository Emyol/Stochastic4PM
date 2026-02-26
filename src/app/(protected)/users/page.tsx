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
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Key } from "lucide-react";
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

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    loadUsers();
  }, [session, router]);

  const loadUsers = async () => {
    const res = await fetch("/api/users");
    if (res.ok) setUsers(await res.json());
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
      toast.success("Password reset");
      setDialogMode(null);
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to reset password");
    }
  };

  const deleteUser = async (user: User) => {
    if (!confirm(`Delete user "${user.name}"?`)) return;
    const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("User deleted");
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
        <h1 className="text-2xl font-bold text-[#0A2342]">Users</h1>
        <Button
          onClick={openCreate}
          className="bg-[#0F4C8A] hover:bg-[#0D3B73]"
        >
          <Plus className="h-4 w-4 mr-1" />
          User
        </Button>
      </div>

      <div className="grid gap-3">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-4 flex items-center gap-4">
              <AvatarInitials name={user.name} className="h-10 w-10 text-sm" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{user.name}</h3>
                  <Badge
                    variant={user.role === "ADMIN" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {user.role}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => openEdit(user)}
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => openResetPassword(user)}
                  title="Reset password"
                >
                  <Key className="h-4 w-4" />
                </Button>
                {user.id !== session?.user?.id && (
                  <Button
                    size="icon"
                    variant="outline"
                    className="text-red-600"
                    onClick={() => deleteUser(user)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
    </div>
  );
}
