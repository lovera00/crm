import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, User, Briefcase, Home, FileText } from "lucide-react";
import Link from "next/link";

interface PersonaDetailsPageProps {
  params: Promise<{ id: string }>;
}

async function getPersona(id: number) {
  // TODO: Reemplazar con llamada a API interna (server-side)
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/personas/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Error al cargar persona");
  }
  return res.json();
}

export default async function PersonaDetailsPage({ params }: PersonaDetailsPageProps) {
  const { id } = await params;
  const personaId = parseInt(id, 10);
  
  if (isNaN(personaId)) {
    notFound();
  }
  
  const persona = await getPersona(personaId);
  
  if (!persona) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Detalles de Persona</h1>
          <p className="text-gray-600">
            Información completa de la persona y sus contactos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/personas">
              Volver a Búsqueda
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/seguimientos/nuevo?personaId=${persona.id}`}>
              <FileText className="mr-2 h-4 w-4" />
              Crear Seguimiento
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: Información básica */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>Datos básicos de la persona</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Nombres</p>
                  <p className="text-lg">{persona.nombres}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Apellidos</p>
                  <p className="text-lg">{persona.apellidos}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">Documento</p>
                  <code className="bg-gray-100 px-3 py-1 rounded text-lg">{persona.documento}</code>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Atributos Especiales</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={persona.funcionarioPublico === "SI" ? "default" : "secondary"}>
                    <User className="mr-1 h-3 w-3" />
                    Func. Público: {persona.funcionarioPublico}
                  </Badge>
                  <Badge variant={persona.jubilado === "SI" ? "default" : "secondary"}>
                    <Home className="mr-1 h-3 w-3" />
                    Jubilado: {persona.jubilado}
                  </Badge>
                  <Badge variant={persona.ipsActivo === "SI" ? "default" : "secondary"}>
                    <Briefcase className="mr-1 h-3 w-3" />
                    IPS Activo: {persona.ipsActivo}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deudas asociadas (placeholder) */}
          <Card>
            <CardHeader>
              <CardTitle>Deudas Asociadas</CardTitle>
              <CardDescription>Obligaciones financieras de esta persona</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <p>Funcionalidad en desarrollo</p>
                <p className="text-sm">Próximamente: Lista de deudas asociadas a esta persona</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha: Contactos */}
        <div className="space-y-6">
          {/* Teléfonos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Teléfonos
              </CardTitle>
              <CardDescription>Números de contacto</CardDescription>
            </CardHeader>
            <CardContent>
              {persona.telefonos.length > 0 ? (
                <ul className="space-y-2">
                  {persona.telefonos.map((telefono: any) => (
                    <li key={telefono.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{telefono.numero}</p>
                        <Badge variant="outline" className="text-xs">
                          {telefono.estado}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="sm">
                        Llamar
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-center py-4">No hay teléfonos registrados</p>
              )}
            </CardContent>
          </Card>

          {/* Emails */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Correos Electrónicos
              </CardTitle>
              <CardDescription>Direcciones de email</CardDescription>
            </CardHeader>
            <CardContent>
              {persona.emails.length > 0 ? (
                <ul className="space-y-2">
                  {persona.emails.map((email: any) => (
                    <li key={email.id} className="p-2 bg-gray-50 rounded">
                      <p className="font-medium">{email.email}</p>
                      <Badge variant="outline" className="text-xs">
                        {email.estado}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-center py-4">No hay emails registrados</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Seguimientos recientes (placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle>Seguimientos Recientes</CardTitle>
          <CardDescription>Historial de gestiones con esta persona</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>Funcionalidad en desarrollo</p>
            <p className="text-sm">Próximamente: Lista de seguimientos realizados</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}