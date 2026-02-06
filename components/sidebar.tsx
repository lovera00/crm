"use client";

import { signOut } from "next-auth/react";
import { Home, Users, FileText, CheckSquare, Settings, LogOut, BarChart, UserCheck, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  role: "gestor" | "supervisor" | "administrador";
}

const navigation = {
  gestor: [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Personas", href: "/dashboard/personas", icon: Users },
    { name: "Seguimientos", href: "/dashboard/seguimientos", icon: FileText },
    { name: "Autorizaciones", href: "/dashboard/autorizaciones", icon: CheckSquare },
  ],
  supervisor: [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Personas", href: "/dashboard/personas", icon: Users },
    { name: "Seguimientos", href: "/dashboard/seguimientos", icon: FileText },
    { name: "Autorizaciones", href: "/dashboard/autorizaciones", icon: CheckSquare },
    { name: "Carteras", href: "/dashboard/carteras", icon: BarChart },
  ],
  administrador: [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Personas", href: "/dashboard/personas", icon: Users },
    { name: "Seguimientos", href: "/dashboard/seguimientos", icon: FileText },
    { name: "Autorizaciones", href: "/dashboard/autorizaciones", icon: CheckSquare },
    { name: "Carteras", href: "/dashboard/carteras", icon: BarChart },
    { name: "Usuarios", href: "/dashboard/usuarios", icon: UserCheck },
    { name: "Configuración", href: "/dashboard/configuracion", icon: Settings },
    { name: "Administración", href: "/dashboard/admin", icon: Shield },
  ],
};

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const links = navigation[role];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)]">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-800">Navegación</h2>
        <nav className="mt-6 space-y-2">
          {links.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600 pl-2.5"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="mt-12">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Sistema</h3>
          <div className="mt-4 space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:text-red-700 hover:bg-red-50"
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}