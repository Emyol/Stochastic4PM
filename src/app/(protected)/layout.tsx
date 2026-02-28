import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar, MobileNav } from "@/components/layout/navigation";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f4f8] via-[#f5f8fc] to-[#eaf0f7] relative">
      {/* Subtle background texture */}
      <div className="fixed inset-0 grid-pattern opacity-30 pointer-events-none" />

      <Sidebar />
      <div className="md:pl-64 relative">
        <main className="p-4 md:p-6 lg:p-8 pb-20 md:pb-8 max-w-7xl mx-auto animate-fade-in">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
