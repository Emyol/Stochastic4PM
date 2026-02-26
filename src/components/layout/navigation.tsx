"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Columns3,
  BarChart3,
  Calendar,
  ListTodo,
  Users,
  Zap,
  User,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/board", label: "Board", icon: Columns3 },
  { href: "/gantt", label: "Gantt", icon: BarChart3 },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/general", label: "General Tasks", icon: ListTodo },
];

const adminItems = [
  { href: "/users", label: "Users", icon: Users },
  { href: "/sprints", label: "Sprints", icon: Zap },
];

const bottomItems = [{ href: "/account", label: "Account", icon: User }];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-[#0A2342] text-[#F1F5F9]">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-[#0D3B73]">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white">
            <img
              src="/logo.png"
              alt="Stochastic4"
              className="h-6 w-6 object-contain"
            />
          </div>
          <span className="font-semibold text-lg">Stochastic4</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-[#0B2E59] text-white"
                : "text-[#8CC1F0] hover:bg-[#0B2E59] hover:text-white",
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}

        {isAdmin && (
          <>
            <div className="pt-4 pb-2 px-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#4DA0E0]">
                Admin
              </p>
            </div>
            {adminItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-[#0B2E59] text-white"
                    : "text-[#8CC1F0] hover:bg-[#0B2E59] hover:text-white",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Bottom */}
      <div className="border-t border-[#0D3B73] p-3 space-y-1">
        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-[#0B2E59] text-white"
                : "text-[#8CC1F0] hover:bg-[#0B2E59] hover:text-white",
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#8CC1F0] hover:bg-[#0B2E59] hover:text-white transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  const mobileItems = [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/board", label: "Board", icon: Columns3 },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/general", label: "Tasks", icon: ListTodo },
    { href: "/account", label: "Account", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden border-t bg-white">
      {mobileItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors",
            pathname === item.href
              ? "text-[#0F4C8A]"
              : "text-[#64748B] hover:text-[#0F4C8A]",
          )}
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
