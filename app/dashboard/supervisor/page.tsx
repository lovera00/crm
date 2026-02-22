"use client";

import { useState, useEffect } from "react";
import { DollarSign, Users, AlertCircle, CheckCircle, Clock, TrendingUp, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface GestorMetrics {
  id: number;
  nombre: string;
  totalDeudas: number;
  enGestion: number;
  conAcuerdo: number;
  canceladas: number;
  promedioMora: number;
  carteraTotal: number;
}

interface DashboardData {
  tipo: string;
  metricas: {
    totalDeudas?: number;
    totalGestores?: number;
    solicitudesPendientes?: number;
    solicitudesHoy?: number;
    gestors?: GestorMetrics[];
    estados?: Array<{ nombre: string; _count: { deudas: number } }>;
  };
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function DashboardSupervisorPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/dashboard/metrics");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setError("Error al cargar dashboard");
      }
    } catch (err) {
      setError("Error al cargar dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2">Cargando dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
        <p>{error || "Error al cargar datos"}</p>
        <Button onClick={fetchDashboard} className="mt-4">Reintentar</Button>
      </div>
    );
  }

  const { metricas } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard del Supervisor</h1>
        <p className="text-gray-500">Resumen de la gestión de cobranzas</p>
      </div>

      {/* Métricas generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Deudas</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas.totalDeudas || 0}</div>
            <p className="text-xs text-gray-500">En el sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gestores Activos</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas.totalGestores || 0}</div>
            <p className="text-xs text-gray-500">Gestores asignados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Solicitudes Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas.solicitudesPendientes || 0}</div>
            <p className="text-xs text-gray-500">Esperando autorización</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Solicitudes Hoy</CardTitle>
            <AlertCircle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas.solicitudesHoy || 0}</div>
            <p className="text-xs text-gray-500">Nuevas hoy</p>
          </CardContent>
        </Card>
      </div>

      {/* Estados de deudas */}
      <Card>
        <CardHeader>
          <CardTitle>Deudas por Estado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metricas.estados?.map((estado) => (
              <div key={estado.nombre} className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold">{estado._count.deudas}</div>
                <p className="text-sm text-gray-500">{estado.nombre}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabla de gestores */}
      <Card>
        <CardHeader>
          <CardTitle>Rendimiento por Gestor</CardTitle>
          <CardDescription>Resumen de la cartera de cada gestor</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gestor</TableHead>
                <TableHead className="text-right">Total Deudas</TableHead>
                <TableHead className="text-right">En Gestión</TableHead>
                <TableHead className="text-right">Con Acuerdo</TableHead>
                <TableHead className="text-right">Canceladas</TableHead>
                <TableHead className="text-right">Prom. Mora</TableHead>
                <TableHead className="text-right">Cartera Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metricas.gestors?.map((gestor) => (
                <TableRow key={gestor.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {gestor.nombre}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{gestor.totalDeudas}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">{gestor.enGestion}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">{gestor.conAcuerdo}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="default">{gestor.canceladas}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{gestor.promedioMora.toFixed(0)} días</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(gestor.carteraTotal)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
