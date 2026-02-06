import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Navbar } from "@/components/navbar";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/login");
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={session.user} />
      <div className="flex">
        <Sidebar role={session.user.role as "gestor" | "supervisor" | "administrador"} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}