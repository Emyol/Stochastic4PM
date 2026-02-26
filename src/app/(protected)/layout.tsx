import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
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
    <div className="min-h-screen bg-gradient-to-br from-[#F1F5F9] via-[#F8FAFC] to-[#EEF2F7]">
      <Sidebar />
      <div className="md:pl-64">
        <main className="p-4 md:p-6 pb-20 md:pb-6 animate-fade-in">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
