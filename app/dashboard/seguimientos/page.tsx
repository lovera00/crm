"use client";

import { useState, useEffect } from "react";
import { FileText, Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface Seguimiento {
  id: number;
  fechaHora: string;
  observacion: string;
  requiereSeguimiento: boolean;
  fechaProximoSeguimiento: string | null;
  gestor: {
    nombre: string;
  };
  tipoGestion: {
    nombre: string;
    color: string;
  };
}

export default function SeguimientosPage() {
  const [loading, setLoading] = useState(true);
  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchSeguimientos();
  }, []);

  const fetchSeguimientos = async () => {
    try {
      const res = await fetch("/api/seguimientos");
      if (res.ok) {
        const data = await res.json();
        setSeguimientos(data.seguimientos || []);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-PY", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredSeguimientos = seguimientos.filter((s) =>
    s.observacion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.gestor?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.tipoGestion?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Seguimientos</h1>
          <p className="text-gray-500">Historial de gestión de cobranzas</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/seguimientos/nuevo">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Seguimiento
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar seguimientos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredSeguimientos.length > 0 ? (
        <div className="space-y-3">
          {filteredSeguimientos.map((seguimiento) => (
            <Card key={seguimiento.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: seguimiento.tipoGestion?.color || "#3B82F6" }}
                      />
                      <span className="font-medium">
                        {seguimiento.tipoGestion?.nombre || "Gestión"}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {seguimiento.gestor?.nombre || "Gestor"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {seguimiento.observacion || "Sin observación"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDate(seguimiento.fechaHora)}
                    </p>
                  </div>
                  {seguimiento.requiereSeguimiento && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Seguimiento
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">No hay seguimientos</h3>
            <p className="text-gray-500 mt-2">
              Los seguimientos aparecerán aquí una vez que sean creados.
            </p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/seguimientos/nuevo">
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Seguimiento
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
