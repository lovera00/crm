import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/login");
  }
  
  const { user } = session;
  const role = user.role as "gestor" | "supervisor" | "administrador";
  
  const getDashboardTitle = () => {
    switch (role) {
      case "gestor":
        return "Dashboard - Gestor";
      case "supervisor":
        return "Dashboard - Supervisor";
      case "administrador":
        return "Dashboard - Administrador";
      default:
        return "Dashboard";
    }
  };
  
  const getDashboardContent = () => {
    switch (role) {
      case "gestor":
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">Mi Cartera</h3>
              <p className="mt-2 text-gray-600">
                Gestiona las deudas asignadas a tu cargo.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">Seguimientos Pendientes</h3>
              <p className="mt-2 text-gray-600">
                Revisa los seguimientos que requieren tu atención.
              </p>
            </div>
          </div>
        );
      case "supervisor":
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">Solicitudes de Autorización</h3>
              <p className="mt-2 text-gray-600">
                Revisa y aprueba las solicitudes de cambio de estado.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">Gestión de Carteras</h3>
              <p className="mt-2 text-gray-600">
                Asigna y reasigna deudas entre gestores.
              </p>
            </div>
          </div>
        );
      case "administrador":
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">Configuración del Sistema</h3>
              <p className="mt-2 text-gray-600">
                Configura tipos de gestión, reglas de transición y parámetros.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">Gestión de Usuarios</h3>
              <p className="mt-2 text-gray-600">
                Administra usuarios, roles y permisos del sistema.
              </p>
            </div>
          </div>
        );
    }
  };
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{getDashboardTitle()}</h1>
          <p className="mt-2 text-gray-600">
            Bienvenido, {user.name} ({user.email})
          </p>
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            Rol: {role}
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          {getDashboardContent()}
        </div>
        
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Acciones Rápidas</h3>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/dashboard/personas"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Buscar Personas
            </a>
            <a
              href="/dashboard/seguimientos/nuevo"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
            >
              Crear Seguimiento
            </a>
            <a
              href="/dashboard/autorizaciones"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700"
            >
              Ver Autorizaciones
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}