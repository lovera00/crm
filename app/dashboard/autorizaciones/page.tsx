"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, Clock, AlertTriangle, Eye, ChevronLeft, ChevronRight, User, DollarSign, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale/es";
import { useRouter } from "next/navigation";

interface Solicitud {
  id: number;
  seguimientoId: number;
  deudaMaestraId: number;
  estadoOrigen: string;
  estadoDestino: string;
  gestorSolicitanteId: number;
  supervisorAsignadoId: number | null;
  estadoSolicitud: string;
  fechaSolicitud: string;
  fechaResolucion: string | null;
  comentarioSolicitante: string | null;
  comentarioSupervisor: string | null;
  prioridad: string;
}

interface SolicitudDetalle {
  solicitud: Solicitud;
  deuda: {
    id: number;
    acreedor: string;
    concepto: string;
    deudaTotal: number;
    estadoActual: string;
    diasMora: number;
    diasGestion: number;
  };
  persona: {
    id: number;
    nombres: string;
    apellidos: string;
    documento: string;
  };
  gestor: {
    id: number;
    nombre: string;
    email: string;
  };
  seguimiento: {
    id: number;
    fechaHora: string;
    tipoGestion: string;
    observacion?: string;
  };
  historialSeguimientos: Array<{
    id: number;
    fechaHora: string;
    tipoGestion: string;
    observacion?: string;
    gestor: string;
  }>;
}

interface ConteoAutorizaciones {
  pendientes: number;
  urgentes: number;
}

const PRIORIDADES = [
  { value: "all", label: "Todas las prioridades" },
  { value: "Baja", label: "Baja" },
  { value: "Media", label: "Media" },
  { value: "Alta", label: "Alta" },
  { value: "Critica", label: "Critica" },
];

export default function AutorizacionesPage() {
  const router = useRouter();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [porPagina] = useState(10);
  const [prioridadFilter, setPrioridadFilter] = useState("all");
  const [solicitudDetalle, setSolicitudDetalle] = useState<SolicitudDetalle | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [comentarioRechazo, setComentarioRechazo] = useState("");
  const [resolviendo, setResolviendo] = useState(false);
  const [conteo, setConteo] = useState<ConteoAutorizaciones>({ pendientes: 0, urgentes: 0 });

  const fetchConteo = useCallback(async () => {
    try {
      const response = await fetch("/api/autorizaciones/count");
      if (response.ok) {
        const data = await response.json();
        setConteo({ pendientes: data.count, urgentes: 0 });
      }
    } catch (error) {
      console.error("Error obteniendo conteo:", error);
    }
  }, []);

  const fetchSolicitudes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("pagina", page.toString());
      params.append("porPagina", porPagina.toString());
      if (prioridadFilter && prioridadFilter !== "all") params.append("prioridad", prioridadFilter);

      const response = await fetch(`/api/autorizaciones?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setSolicitudes(data.solicitudes || []);
        setTotalCount(data.total || 0);
      }
    } catch (error) {
      console.error("Error de red:", error);
    } finally {
      setLoading(false);
    }
  }, [page, porPagina, prioridadFilter]);

  useEffect(() => {
    fetchSolicitudes();
    fetchConteo();
  }, [fetchSolicitudes, fetchConteo]);

  const fetchDetalle = async (id: number) => {
    setLoadingDetalle(true);
    try {
      const response = await fetch(`/api/autorizaciones/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSolicitudDetalle(data);
        setModalOpen(true);
      }
    } catch (error) {
      console.error("Error obteniendo detalle:", error);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const resolverSolicitud = async (id: number, aprobar: boolean, comentario?: string) => {
    setResolviendo(true);
    try {
      const response = await fetch("/api/autorizaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          solicitudId: id,
          aprobar,
          comentarioSupervisor: comentario,
        }),
      });

      if (response.ok) {
        setModalOpen(false);
        setSolicitudDetalle(null);
        setComentarioRechazo("");
        fetchSolicitudes();
        fetchConteo();
      } else {
        const error = await response.text();
        console.error("Error resolviendo solicitud:", error);
        alert("Error al resolver la solicitud: " + error);
      }
    } catch (error) {
      console.error("Error de red:", error);
    } finally {
      setResolviendo(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: "PYG",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPrioridadBadge = (prioridad: string) => {
    switch (prioridad) {
      case "Critica":
        return <Badge variant="destructive">Critica</Badge>;
      case "Alta":
        return <Badge variant="destructive" className="bg-orange-500">Alta</Badge>;
      case "Media":
        return <Badge variant="default">Media</Badge>;
      case "Baja":
        return <Badge variant="secondary">Baja</Badge>;
      default:
        return <Badge variant="outline">{prioridad}</Badge>;
    }
  };

  const getTiempoBadge = (fechaSolicitud: string) => {
    const fecha = new Date(fechaSolicitud);
    const ahora = new Date();
    const horasTranscurridas = (ahora.getTime() - fecha.getTime()) / (1000 * 60 * 60);
    const esUrgente = horasTranscurridas > 24;

    if (esUrgente) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Urgente
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {formatDistanceToNow(fecha, { locale: es, addSuffix: true })}
      </Badge>
    );
  };

  const totalPaginas = Math.ceil(totalCount / porPagina);

  if (loading && solicitudes.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96 mt-2" />
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Solicitudes de Autorizacion</h1>
          <p className="text-gray-600">
            Gestiona las solicitudes de cambio de estado de deudas pendientes.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Card className="py-2 px-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <span className="font-medium">{conteo.pendientes}</span>
              <span className="text-sm text-gray-500">pendientes</span>
            </div>
          </Card>
          {conteo.urgentes > 0 && (
            <Card className="py-2 px-4 border-red-200 bg-red-50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span className="font-medium text-red-700">{conteo.urgentes}</span>
                <span className="text-sm text-red-600">urgentes</span>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtra las solicitudes por prioridad</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={prioridadFilter} onValueChange={(v: string) => { setPrioridadFilter(v); setPage(1); }} disabled={loading}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                {PRIORIDADES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => { setPrioridadFilter("all"); setPage(1); }} disabled={loading}>
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {solicitudes.length > 0 ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Solicitudes Pendientes ({totalCount})</CardTitle>
              <CardDescription>
                {totalCount > porPagina ? `Mostrando ${(page - 1) * porPagina + 1}-${Math.min(page * porPagina, totalCount)} de ${totalCount}` : `Mostrando ${totalCount} solicitudes`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Tiempo</TableHead>
                    <TableHead>Estado Origen</TableHead>
                    <TableHead>Estado Destino</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {solicitudes.map((solicitud) => (
                    <TableRow key={solicitud.id}>
                      <TableCell className="font-medium">#{solicitud.id}</TableCell>
                      <TableCell>{getPrioridadBadge(solicitud.prioridad)}</TableCell>
                      <TableCell>{getTiempoBadge(solicitud.fechaSolicitud)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{solicitud.estadoOrigen.replace("_", " ")}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                          <Badge variant="secondary">{solicitud.estadoDestino.replace("_", " ")}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => fetchDetalle(solicitud.id)}>
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalle
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {totalPaginas > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">Pagina {page} de {totalPaginas}</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPaginas, p + 1))} disabled={page === totalPaginas || loading}>
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-medium">No hay solicitudes pendientes</h3>
            <p className="text-gray-500 mt-2">Todas las solicitudes han sido procesadas.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}