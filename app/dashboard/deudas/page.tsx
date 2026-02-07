"use client";

import { useState, useEffect } from "react";
import { Search, DollarSign, Calendar, User, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface Deuda {
  id: number;
  acreedor: string;
  concepto: string;
  estadoActual: string;
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
}

const ESTADOS_DEUDA = [
  { value: "", label: "Todos los estados" },
  { value: "NUEVO", label: "Nuevo" },
  { value: "EN_GESTION", label: "En Gestión" },
  { value: "CON_ACUERDO", label: "Con Acuerdo" },
  { value: "SUSPENDIDA", label: "Suspendida" },
  { value: "CERRADA", label: "Cerrada" },
  { value: "LEGAL", label: "Legal" },
];

export default function DeudasPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(20);

  const fetchDeudas = async (search: string, estado: string, pageOffset: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (estado) params.append("estadoId", estado);
      params.append("limit", limit.toString());
      params.append("offset", pageOffset.toString());
      
      const response = await fetch(`/api/deudas?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setDeudas(data.deudas || []);
        setTotal(data.total || 0);
      } else {
        console.error("Error cargando deudas:", await response.text());
      }
    } catch (error) {
      console.error("Error de red:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeudas("", "", 0);
  }, []);

  const handleSearch = () => {
    setPage(0);
    fetchDeudas(searchTerm, estadoFilter, 0);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handlePreviousPage = () => {
    if (page > 0) {
      const newPage = page - 1;
      setPage(newPage);
      fetchDeudas(searchTerm, estadoFilter, newPage * limit);
    }
  };

  const handleNextPage = () => {
    if ((page + 1) * limit < total) {
      const newPage = page + 1;
      setPage(newPage);
      fetchDeudas(searchTerm, estadoFilter, newPage * limit);
    }
  };

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Deudas</h1>
        <p className="text-gray-600">
          Visualiza y gestiona las deudas asignadas a tu cartera.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtrar Deudas</CardTitle>
          <CardDescription>
            Busca por acreedor, concepto o filtra por estado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Ej: Banco Continental, Préstamo personal..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
              />
            </div>
            <Select value={estadoFilter} onValueChange={setEstadoFilter} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS_DEUDA.map((estado) => (
                  <SelectItem key={estado.value} value={estado.value}>
                    {estado.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? "Buscando..." : "Buscar"}
            </Button>
            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setEstadoFilter("");
              setPage(0);
              fetchDeudas("", "", 0);
            }} disabled={loading}>
              Limpiar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : deudas.length > 0 ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Deudas ({total})</CardTitle>
              <CardDescription>
                {total > limit ? `Mostrando ${page * limit + 1}-${Math.min((page + 1) * limit, total)} de ${total} deudas` : `Mostrando ${total} deudas`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Acreedor / Concepto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Cuotas</TableHead>
                    <TableHead>Días</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deudas.map((deuda) => (
                    <TableRow key={deuda.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{deuda.acreedor}</p>
                          <p className="text-sm text-gray-500">{deuda.concepto}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>Último pago: {formatDate(deuda.fechaUltimoPago)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getEstadoBadgeVariant(deuda.estadoActual)} className="flex items-center w-fit">
                          {getEstadoIcon(deuda.estadoActual)}
                          {deuda.estadoActual.replace("_", " ")}
                        </Badge>
                        <div className="mt-1 text-xs text-gray-500">
                          {deuda.gestorAsignadoId ? (
                            <span className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              Gestor #{deuda.gestorAsignadoId}
                            </span>
                          ) : "Sin asignar"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{formatCurrency(deuda.deudaTotal)}</p>
                          <p className="text-xs text-gray-500">
                            Capital: {formatCurrency(deuda.saldoCapitalTotal)}
                          </p>
                          {deuda.montoCuota && (
                            <p className="text-xs text-gray-500">
                              Cuota: {formatCurrency(deuda.montoCuota)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm">
                            {deuda.cuotas.length} cuotas
                          </p>
                          <p className="text-xs text-gray-500">
                            {getCuotasPendientes(deuda.cuotas)} pendientes
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              Mora: {deuda.diasMora}d
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Gestión: {deuda.diasGestion}d
                            </Badge>
                          </div>
                          {deuda.fechaExpiracionAcuerdo && (
                            <p className="text-xs text-gray-500">
                              Vence: {formatDate(deuda.fechaExpiracionAcuerdo)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" size="sm">
                            Ver Detalles
                          </Button>
                          <Button size="sm">
                            Crear Seguimiento
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {total > limit && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Página {page + 1} de {Math.ceil(total / limit)}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={page === 0 || loading}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={(page + 1) * limit >= total || loading}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </>
      ) : searchTerm || estadoFilter ? (
        <Card>
          <CardContent className="py-8 text-center">
            <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">No se encontraron deudas</h3>
            <p className="text-gray-500 mt-2">
              No hay resultados para los filtros aplicados. Intenta con otros términos.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">No hay deudas cargadas</h3>
            <p className="text-gray-500 mt-2">
              Comienza creando nuevas deudas o espera a que te asignen cartera.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}