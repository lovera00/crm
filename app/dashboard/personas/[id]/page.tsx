import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, User, Briefcase, Home, FileText, DollarSign, Clock, Calendar } from "lucide-react";
import Link from "next/link";

interface PersonaDetailsPageProps {
  params: Promise<{ id: string }>;
}

async function getPersona(id: number) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/personas/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Error al cargar persona");
  }
  return res.json();
}

async function getDeudasPersona(id: number) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/personas/${id}/deudas`, {
    cache: "no-store",
  });
  if (!res.ok) return { deudas: [] };
  return res.json();
}

async function getSeguimientosPersona(id: number) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/personas/${id}/seguimientos`, {
    cache: "no-store",
  });
  if (!res.ok) return { seguimientos: [] };
  return res.json();
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string | null) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function PersonaDetailsPage({ params }: PersonaDetailsPageProps) {
  const { id } = await params;
  const personaId = parseInt(id, 10);
  
  if (isNaN(personaId)) {
    notFound();
  }
  
  const [persona, debtsData, seguimientosData] = await Promise.all([
    getPersona(personaId),
    getDeudasPersona(personaId),
    getSeguimientosPersona(personaId),
  ]);
  
  if (!persona) {
    notFound();
  }

  const { deudas = [] } = debtsData;
  const { seguimientos = [] } = seguimientosData;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {persona.nombres} {persona.apellidos}
          </h1>
          <p className="text-gray-600">Documento: {persona.documento}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/personas">Volver</Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/seguimientos/nuevo?personaId=${persona.id}`}>
              <FileText className="mr-2 h-4 w-4" />
              Nuevo Seguimiento
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Atributos Especiales */}
          <Card>
            <CardHeader>
              <CardTitle>Atributos Especiales</CardTitle>
            </CardHeader>
            <CardContent>
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
                  IPS: {persona.ipsActivo}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Deudas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Deudas Asociadas ({deudas.length})
              </CardTitle>
              <CardDescription>Obligaciones financieras de esta persona</CardDescription>
            </CardHeader>
            <CardContent>
              {deudas.length > 0 ? (
                <div className="space-y-3">
                  {deudas.map((deuda: any) => (
                    <div key={deuda.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{deuda.acreedor}</p>
                        <p className="text-sm text-gray-500">{deuda.concepto}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(deuda.deudaTotal)}</p>
                        <Badge variant={deuda.diasMora > 30 ? "destructive" : "secondary"}>
                          {deuda.diasMora} días mora
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No hay deudas asociadas</p>
              )}
            </CardContent>
          </Card>

          {/* Seguimientos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Seguimientos Recientes ({seguimientos.length})
              </CardTitle>
              <CardDescription>Historial de gestiones</CardDescription>
            </CardHeader>
            <CardContent>
              {seguimientos.length > 0 ? (
                <div className="space-y-3">
                  {seguimientos.slice(0, 10).map((seg: any) => (
                    <div key={seg.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {seg.tipoGestion.color && (
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: seg.tipoGestion.color }}
                            />
                          )}
                          <span className="font-medium">{seg.tipoGestion.nombre}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(seg.fechaHora)}
                        </span>
                      </div>
                      {seg.observacion && (
                        <p className="text-sm text-gray-600 mb-2">{seg.observacion}</p>
                      )}
                      <div className="text-xs text-gray-500">
                        Gestor: {seg.gestor?.nombre || "N/A"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No hay seguimientos registrados</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha: Contactos */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Teléfonos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {persona.telefonos?.length > 0 ? (
                <ul className="space-y-2">
                  {persona.telefonos.map((telefono: any) => (
                    <li key={telefono.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{telefono.numero}</p>
                        <Badge variant="outline" className="text-xs">
                          {telefono.estado}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-center py-4">No hay teléfonos</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Correos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {persona.emails?.length > 0 ? (
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
                <p className="text-gray-500 text-center py-4">No hay emails</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Referencias</CardTitle>
            </CardHeader>
            <CardContent>
              {persona.referenciasPersonales?.length > 0 || persona.referenciasLaborales?.length > 0 ? (
                <div className="space-y-2">
                  {persona.referenciasPersonales?.map((ref: any) => (
                    <div key={ref.id} className="p-2 bg-gray-50 rounded">
                      <p className="font-medium">{ref.nombre}</p>
                      <p className="text-sm text-gray-500">{ref.parentesco} - {ref.telefono}</p>
                    </div>
                  ))}
                  {persona.referenciasLaborales?.map((ref: any) => (
                    <div key={ref.id} className="p-2 bg-gray-50 rounded">
                      <p className="font-medium">{ref.nombre}</p>
                      <p className="text-sm text-gray-500">{ref.empresa} - {ref.telefono}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No hay referencias</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
