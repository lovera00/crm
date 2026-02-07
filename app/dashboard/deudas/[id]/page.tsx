"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  DollarSign, 
  Calendar, 
  User, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  FileText,
  TrendingUp,
  CreditCard,
  Users,
  Phone,
  Mail,
  Home,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";

interface Cuota {
  id: number;
  numeroCuota: number;
  fechaVencimiento: string;
  capitalOriginal: number;
  saldoCapital: number;
  interesMoratorioAcumulado: number;
  interesPunitorioAcumulado: number;
  estadoCuota: string;
  fechaUltimoPago: string | null;
  montoCuota: number | null;
}

interface PersonaDeuda {
  persona: {
    id: number;
    nombres: string;
    apellidos: string;
    documento: string;
    funcionarioPublico: string;
    jubilado: string;
    ipsActivo: string;
    telefonos: Array<{
      id: number;
      numero: string;
      estado: string;
    }>;
    emails: Array<{
      id: number;
      email: string;
      estado: string;
    }>;
    referenciasPersonales: Array<{
      id: number;
      nombre: string;
      parentesco: string;
      telefono: string;
      estado: string;
    }>;
    referenciasLaborales: Array<{
      id: number;
      nombre: string;
      empresa: string | null;
      telefono: string;
      estado: string;
    }>;
  };
  esDeudorPrincipal: boolean;
}

interface Deuda {
  id: number;
  acreedor: string;
  concepto: string;
  estadoActual: string;
  estadoActualId: number;
  gestorAsignadoId: number | null;
  diasMora: number;
  diasGestion: number;
  saldoCapitalTotal: number;
  deudaTotal: number;
  gastosCobranza: number;
  interesMoratorio: number;
  interesPunitorio: number;
  fechaUltimoPago: string | null;
  montoCuota: number | null;
  fechaAsignacionGestor: string | null;
  tasaInteresMoratorio: number | null;
  tasaInteresPunitorio: number | null;
  fechaExpiracionAcuerdo: string | null;
  cuotas: Cuota[];
  personas: PersonaDeuda[];
}

export default function DeudaDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [deuda, setDeuda] = useState<Deuda | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeuda = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/deudas/${params.id}`);
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${await response.text()}`);
        }
        const data = await response.json();
        setDeuda(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
        console.error("Error cargando deuda:", err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchDeuda();
    }
  }, [params.id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: "PYG",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd/MM/yyyy", { locale: es });
  };

  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case "NUEVO":
        return "secondary";
      case "EN_GESTION":
        return "default";
      case "CON_ACUERDO":
        return "outline";
      case "SUSPENDIDA":
        return "destructive";
      case "CERRADA":
        return "default";
      case "LEGAL":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case "NUEVO":
        return <Clock className="h-4 w-4 mr-1" />;
      case "EN_GESTION":
        return <AlertCircle className="h-4 w-4 mr-1" />;
      case "CON_ACUERDO":
        return <CheckCircle className="h-4 w-4 mr-1" />;
      default:
        return <DollarSign className="h-4 w-4 mr-1" />;
    }
  };

  const getCuotasPendientes = (cuotas: Cuota[]) => {
    return cuotas.filter(c => c.estadoCuota === "Pendiente" || c.estadoCuota === "Vencida").length;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !deuda) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Error</h1>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-medium">No se pudo cargar la deuda</h3>
            <p className="text-gray-500 mt-2">
              {error || "La deuda solicitada no existe o no tienes permisos para verla."}
            </p>
            <Button className="mt-4" onClick={() => router.push("/dashboard/deudas")}>
              Volver a la lista
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const deudoresPrincipales = deuda.personas.filter(p => p.esDeudorPrincipal);
  const codeudores = deuda.personas.filter(p => !p.esDeudorPrincipal);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/dashboard/deudas")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Deuda #{deuda.id}</h1>
            <p className="text-gray-600">
              {deuda.acreedor} - {deuda.concepto}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Historial
          </Button>
          <Button>
            <TrendingUp className="h-4 w-4 mr-2" />
            Crear Seguimiento
          </Button>
        </div>
      </div>

      <Tabs defaultValue="resumen" className="space-y-4">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="cuotas">Cuotas</TabsTrigger>
          <TabsTrigger value="personas">Personas</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
        </TabsList>

        {/* Resumen Tab */}
        <TabsContent value="resumen" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Estado y Gestión */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Estado y Gestión
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Estado Actual</p>
                  <Badge variant={getEstadoBadgeVariant(deuda.estadoActual)} className="flex items-center w-fit mt-1">
                    {getEstadoIcon(deuda.estadoActual)}
                    {deuda.estadoActual.replace("_", " ")}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Días en Mora</p>
                    <p className="text-2xl font-bold">{deuda.diasMora}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Días en Gestión</p>
                    <p className="text-2xl font-bold">{deuda.diasGestion}</p>
                  </div>
                </div>
                {deuda.fechaAsignacionGestor && (
                  <div>
                    <p className="text-sm text-gray-500">Asignado desde</p>
                    <p className="font-medium">{formatDate(deuda.fechaAsignacionGestor)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Montos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Montos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Deuda Total</p>
                  <p className="text-2xl font-bold">{formatCurrency(deuda.deudaTotal)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Capital</p>
                  <p className="text-xl font-medium">{formatCurrency(deuda.saldoCapitalTotal)}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Interés Moratorio</p>
                    <p className="font-medium">{formatCurrency(deuda.interesMoratorio)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Interés Punitorio</p>
                    <p className="font-medium">{formatCurrency(deuda.interesPunitorio)}</p>
                  </div>
                </div>
                {deuda.montoCuota && (
                  <div>
                    <p className="text-sm text-gray-500">Cuota Mensual</p>
                    <p className="font-medium">{formatCurrency(deuda.montoCuota)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Información General */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Información General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Acreedor</p>
                  <p className="font-medium">{deuda.acreedor}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Concepto</p>
                  <p className="font-medium">{deuda.concepto}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Último Pago</p>
                  <p className="font-medium">{formatDate(deuda.fechaUltimoPago)}</p>
                </div>
                {deuda.fechaExpiracionAcuerdo && (
                  <div>
                    <p className="text-sm text-gray-500">Vencimiento Acuerdo</p>
                    <p className="font-medium text-red-600">{formatDate(deuda.fechaExpiracionAcuerdo)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cuotas Resumen */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Cuotas ({deuda.cuotas.length})
              </CardTitle>
              <CardDescription>
                {getCuotasPendientes(deuda.cuotas)} cuotas pendientes de {deuda.cuotas.length} totales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-gray-500">Pendientes</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {deuda.cuotas.filter(c => c.estadoCuota === "Pendiente").length}
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-gray-500">Vencidas</p>
                  <p className="text-2xl font-bold text-red-600">
                    {deuda.cuotas.filter(c => c.estadoCuota === "Vencida").length}
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-gray-500">Pagadas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {deuda.cuotas.filter(c => c.estadoCuota === "Pagada").length}
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-gray-500">En Acuerdo</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {deuda.cuotas.filter(c => c.estadoCuota === "En_Acuerdo").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cuotas Tab */}
        <TabsContent value="cuotas">
          <Card>
            <CardHeader>
              <CardTitle>Detalle de Cuotas</CardTitle>
              <CardDescription>
                Lista completa de cuotas asociadas a esta deuda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead># Cuota</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Capital Original</TableHead>
                    <TableHead>Saldo Capital</TableHead>
                    <TableHead>Intereses</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Último Pago</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deuda.cuotas.map((cuota) => (
                    <TableRow key={cuota.id}>
                      <TableCell className="font-medium">{cuota.numeroCuota}</TableCell>
                      <TableCell>{formatDate(cuota.fechaVencimiento)}</TableCell>
                      <TableCell>{formatCurrency(cuota.capitalOriginal)}</TableCell>
                      <TableCell>{formatCurrency(cuota.saldoCapital)}</TableCell>
                      <TableCell>
                        {formatCurrency(cuota.interesMoratorioAcumulado + cuota.interesPunitorioAcumulado)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          cuota.estadoCuota === "Pagada" ? "default" :
                          cuota.estadoCuota === "Vencida" ? "destructive" :
                          cuota.estadoCuota === "En_Acuerdo" ? "outline" : "secondary"
                        }>
                          {cuota.estadoCuota}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(cuota.fechaUltimoPago)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Personas Tab */}
        <TabsContent value="personas">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Deudores Principales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Deudores Principales
                </CardTitle>
                <CardDescription>
                  Personas responsables principales de la deuda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {deudoresPrincipales.length > 0 ? (
                  deudoresPrincipales.map((personaDeuda) => (
                    <div key={personaDeuda.persona.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">
                            {personaDeuda.persona.nombres} {personaDeuda.persona.apellidos}
                          </h4>
                          <p className="text-sm text-gray-500">DOC: {personaDeuda.persona.documento}</p>
                          <div className="mt-2 space-y-2">
                            {personaDeuda.persona.telefonos.map((tel) => (
                              <div key={tel.id} className="flex items-center gap-2 text-sm">
                                <Phone className="h-3 w-3" />
                                <span>{tel.numero}</span>
                                <Badge variant="outline" className="text-xs">{tel.estado}</Badge>
                              </div>
                            ))}
                            {personaDeuda.persona.emails.map((email) => (
                              <div key={email.id} className="flex items-center gap-2 text-sm">
                                <Mail className="h-3 w-3" />
                                <span>{email.email}</span>
                                <Badge variant="outline" className="text-xs">{email.estado}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                        <Badge>Principal</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No hay deudores principales registrados</p>
                )}
              </CardContent>
            </Card>

            {/* Codeudores */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Codeudores y Referencias
                </CardTitle>
                <CardDescription>
                  Personas adicionales asociadas a la deuda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {codeudores.length > 0 ? (
                  codeudores.map((personaDeuda) => (
                    <div key={personaDeuda.persona.id} className="border rounded-lg p-4">
                      <h4 className="font-medium">
                        {personaDeuda.persona.nombres} {personaDeuda.persona.apellidos}
                      </h4>
                      <p className="text-sm text-gray-500">DOC: {personaDeuda.persona.documento}</p>
                      <div className="mt-2 space-y-2">
                        {personaDeuda.persona.referenciasPersonales.map((ref) => (
                          <div key={ref.id} className="text-sm">
                            <div className="flex items-center gap-2">
                              <Home className="h-3 w-3" />
                              <span>{ref.nombre} ({ref.parentesco})</span>
                              <Badge variant="outline" className="text-xs">{ref.estado}</Badge>
                            </div>
                            <p className="text-gray-500 ml-5">Tel: {ref.telefono}</p>
                          </div>
                        ))}
                        {personaDeuda.persona.referenciasLaborales.map((ref) => (
                          <div key={ref.id} className="text-sm">
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-3 w-3" />
                              <span>{ref.nombre} {ref.empresa && `- ${ref.empresa}`}</span>
                              <Badge variant="outline" className="text-xs">{ref.estado}</Badge>
                            </div>
                            <p className="text-gray-500 ml-5">Tel: {ref.telefono}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No hay codeudores registrados</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Documentos Tab */}
        <TabsContent value="documentos">
          <Card>
            <CardHeader>
              <CardTitle>Documentos Adjuntos</CardTitle>
              <CardDescription>
                Contratos, pagarés y otros documentos relacionados con esta deuda
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium">No hay documentos adjuntos</h3>
              <p className="text-gray-500 mt-2">
                Los documentos aparecerán aquí una vez que sean cargados al sistema.
              </p>
              <Button className="mt-4" variant="outline">
                Subir Documento
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}