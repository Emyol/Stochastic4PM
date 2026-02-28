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
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-40 bg-gradient-to-b from-[#021024] via-[#052659] to-[#021024] text-[#f0f4f8]">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-[#052659]/60">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-white/95 to-white/80 shadow-lg shadow-black/20">
            <img
              src="/logo.png"
              alt="Stochastic4"
              className="h-6 w-6 object-contain"
            />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-[#C1E8FF] bg-clip-text text-transparent">
            Stochastic4
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative overflow-hidden",
              pathname === item.href
                ? "bg-gradient-to-r from-[#5483B3]/40 to-[#5483B3]/20 text-white shadow-lg shadow-[#5483B3]/10"
                : "text-[#7DA0CA] hover:bg-white/5 hover:text-white hover:translate-x-0.5",
            )}
          >
            {pathname === item.href && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-[#7DA0CA] to-[#5483B3] rounded-r-full" />
            )}
            <item.icon
              className={cn(
                "h-5 w-5 transition-all duration-200",
                pathname === item.href
                  ? "text-[#7DA0CA]"
                  : "group-hover:text-[#7DA0CA]",
              )}
            />
            {item.label}
          </Link>
        ))}

        {isAdmin && (
          <>
            <div className="pt-5 pb-2 px-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#7DA0CA]/70">
                Admin
              </p>
            </div>
            {adminItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative overflow-hidden",
                  pathname === item.href
                    ? "bg-gradient-to-r from-[#5483B3]/40 to-[#5483B3]/20 text-white shadow-lg shadow-[#5483B3]/10"
                    : "text-[#7DA0CA] hover:bg-white/5 hover:text-white hover:translate-x-0.5",
                )}
              >
                {pathname === item.href && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-[#7DA0CA] to-[#5483B3] rounded-r-full" />
                )}
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-all duration-200",
                    pathname === item.href
                      ? "text-[#7DA0CA]"
                      : "group-hover:text-[#7DA0CA]",
                  )}
                />
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Bottom */}
      <div className="border-t border-[#052659]/60 p-3 space-y-1">
        {session?.user && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#5483B3] to-[#7DA0CA] text-[10px] font-bold text-white shadow-md">
              {session.user.name
                ?.split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {session.user.name}
              </p>
              <p className="text-[10px] text-[#7DA0CA]/60 truncate">
                {session.user.role === "ADMIN" ? "Administrator" : "Member"}
              </p>
            </div>
          </div>
        )}
        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              pathname === item.href
                ? "bg-gradient-to-r from-[#5483B3]/40 to-[#5483B3]/20 text-white"
                : "text-[#7DA0CA] hover:bg-white/5 hover:text-white",
            )}
          >
            <item.icon className="h-5 w-5 transition-all duration-200 group-hover:text-[#7DA0CA]" />
            {item.label}
          </Link>
        ))}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#7DA0CA] hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 group"
        >
          <LogOut className="h-5 w-5 transition-all duration-200 group-hover:text-red-400" />
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden border-t border-gray-200/80 bg-white/95 backdrop-blur-lg shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
      {mobileItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-all duration-200 relative",
            pathname === item.href
              ? "text-[#052659]"
              : "text-[#64748B] hover:text-[#052659]",
          )}
        >
          {pathname === item.href && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-gradient-to-r from-[#5483B3] to-[#7DA0CA] rounded-b-full" />
          )}
          <item.icon
            className={cn(
              "h-5 w-5 transition-all duration-200",
              pathname === item.href ? "scale-110" : "",
            )}
          />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
