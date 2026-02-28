"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, AlertCircle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Persona {
  id: number;
  nombres: string;
  apellidos: string;
  documento: string;
}

interface Deuda {
  id: number;
  acreedor: string;
  concepto: string;
  deudaTotal: number;
  saldoCapitalTotal: number;
  diasMora: number;
  estadoActual: {
    id: number;
    nombre: string;
  };
}

interface TipoGestion {
  id: number;
  nombre: string;
  descripcion?: string;
  color?: string;
  icono?: string;
  requiereAuth?: boolean;
}

interface ReglaTransicion {
  id: number;
  estadoOrigenId?: number;
  estadoOrigenNombre?: string;
  estadoDestinoId?: number;
  estadoDestinoNombre?: string;
  requiereAutorizacion: boolean;
  mensajeUi?: string;
}

export default function NuevoSeguimientoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const personaIdParam = searchParams.get("personaId");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [tiposGestion, setTiposGestion] = useState<TipoGestion[]>([]);
  const [reglas, setReglas] = useState<ReglaTransicion[]>([]);
  const [selectedDeudas, setSelectedDeudas] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    personaId: personaIdParam ? parseInt(personaIdParam, 10) : 0,
    tipoGestionId: "",
    observacion: "",
    fechaProximoSeguimiento: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [personasRes, deudasRes, tiposRes] = await Promise.all([
          formData.personaId ? fetch(`/api/personas/${formData.personaId}`) : Promise.resolve(null),
          formData.personaId ? fetch(`/api/personas/${formData.personaId}/deudas`) : Promise.resolve(null),
          fetch("/api/config/tipos-gestion?activo=true"),
        ]);

        if (personasRes?.ok) {
          const personaData = await personasRes.json();
          setPersona(personaData);
        }

        if (deudasRes?.ok) {
          const deudasData = await deudasRes.json();
          setDeudas(deudasData.deudas || []);
        }

        if (tiposRes.ok) {
          const tiposData = await tiposRes.json();
          setTiposGestion(tiposData.tiposGestion || []);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    };

    if (formData.personaId) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [formData.personaId]);

  useEffect(() => {
    const fetchReglas = async () => {
      if (!formData.tipoGestionId || selectedDeudas.length === 0) {
        setReglas([]);
        return;
      }

      const tipoId = parseInt(formData.tipoGestionId, 10);
      const primeraDeuda = deudas.find(d => selectedDeudas.includes(d.id));
      
      if (!primeraDeuda) {
        setReglas([]);
        return;
      }

      try {
        const res = await fetch(`/api/config/reglas?tipo_gestion_id=${tipoId}&activo=true`);
        if (res.ok) {
          const data = await res.json();
          const reglasAplicables = data.reglas.filter((r: ReglaTransicion) => 
            r.estadoOrigenId === null || r.estadoOrigenId === primeraDeuda.estadoActual.id
          );
          setReglas(reglasAplicables);
        }
      } catch (err) {
        console.error("Error fetching reglas:", err);
      }
    };

    fetchReglas();
  }, [formData.tipoGestionId, selectedDeudas]);

  const handleDeudaToggle = (deudaId: number) => {
    setSelectedDeudas((prev) =>
      prev.includes(deudaId)
        ? prev.filter((id) => id !== deudaId)
        : [...prev, deudaId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.personaId) {
      setError("Debe seleccionar una persona");
      return;
    }

    if (selectedDeudas.length === 0) {
      setError("Debe seleccionar al menos una deuda");
      return;
    }

    if (!formData.tipoGestionId) {
      setError("Debe seleccionar un tipo de gestión");
      return;
    }

    if (!formData.fechaProximoSeguimiento) {
      setError("Debe ingresar la fecha de próxima gestión");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/seguimientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personaId: formData.personaId,
          deudaIds: selectedDeudas,
          tipoGestionId: parseInt(formData.tipoGestionId, 10),
          observacion: formData.observacion,
          requiereSeguimiento: true,
          fechaProximoSeguimiento: formData.fechaProximoSeguimiento,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al crear seguimiento");
      }

      setSuccess("Seguimiento creado exitosamente");
      
      setTimeout(() => {
        router.push(`/dashboard/personas/${formData.personaId}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear seguimiento");
    } finally {
      setSaving(false);
    }
  };

  const selectedTipo = tiposGestion.find(t => t.id === parseInt(formData.tipoGestionId, 10));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!personaIdParam) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Seleccione una persona</AlertTitle>
          <AlertDescription>
            Debe seleccionar una persona desde la búsqueda para crear un seguimiento.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold">Nuevo Seguimiento</h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <Check className="h-4 w-4" />
          <AlertTitle>Éxito</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Información de la Persona</CardTitle>
            </CardHeader>
            <CardContent>
              {persona ? (
                <div className="space-y-2">
                  <div>
                    <Label className="text-gray-500">Nombre completo</Label>
                    <p className="font-medium">{persona.nombres} {persona.apellidos}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Documento</Label>
                    <p className="font-medium">{persona.documento}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Persona no encontrada</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tipo de Gestión</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={formData.tipoGestionId}
                onValueChange={(value) => setFormData({ ...formData, tipoGestionId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un tipo de gestión" />
                </SelectTrigger>
                <SelectContent>
                  {tiposGestion.map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.id.toString()}>
                      <div className="flex items-center gap-2">
                        {tipo.color && (
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tipo.color }}
                          />
                        )}
                        {tipo.nombre}
                        {tipo.requiereAuth && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Requiere auth
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTipo?.descripcion && (
                <p className="mt-2 text-sm text-gray-500">{selectedTipo.descripcion}</p>
              )}
              
              {reglas.length > 0 && selectedDeudas.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Cambio de estado:</p>
                  {reglas.map((regla) => (
                    <div key={regla.id} className="mt-2 text-sm">
                      <span className="text-gray-600">
                        {regla.estadoOrigenNombre || 'Cualquiera'} → {regla.estadoDestinoNombre || 'El mismo'}
                      </span>
                      {regla.requiereAutorizacion && (
                        <Badge variant="outline" className="ml-2 text-xs bg-yellow-50">
                          Requiere autorización
                        </Badge>
                      )}
                      {regla.mensajeUi && (
                        <p className="text-xs text-gray-500 mt-1">{regla.mensajeUi}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Deudas Asociadas</CardTitle>
            <CardDescription>
              Seleccione las deudas sobre las cuales desea realizar el seguimiento
            </CardDescription>
          </CardHeader>
          <CardContent>
            {deudas.length > 0 ? (
              <div className="space-y-2">
                {deudas.map((deuda) => (
                  <div
                    key={deuda.id}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedDeudas.includes(deuda.id)
                        ? "border-blue-500 bg-blue-50"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => handleDeudaToggle(deuda.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedDeudas.includes(deuda.id)}
                        onCheckedChange={() => handleDeudaToggle(deuda.id)}
                      />
                      <div>
                        <p className="font-medium">{deuda.acreedor}</p>
                        <p className="text-sm text-gray-500">{deuda.concepto}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {new Intl.NumberFormat("es-PY", {
                          style: "currency",
                          currency: "PYG",
                        }).format(deuda.deudaTotal)}
                      </p>
                      <Badge variant={deuda.diasMora > 30 ? "destructive" : "secondary"}>
                        {deuda.diasMora} días mora
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No hay deudas asociadas a esta persona
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Detalles del Seguimiento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="observacion">Observación</Label>
              <Textarea
                id="observacion"
                placeholder="Ingrese los detalles del seguimiento..."
                value={formData.observacion}
                onChange={(e) => setFormData({ ...formData, observacion: e.target.value })}
                rows={4}
                maxLength={1200}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.observacion.length}/1200 caracteres
              </p>
            </div>

            <div>
              <Label htmlFor="fechaProximo">Fecha próxima gestión <span className="text-red-500">*</span></Label>
              <Input
                id="fechaProximo"
                type="date"
                required
                value={formData.fechaProximoSeguimiento}
                onChange={(e) =>
                  setFormData({ ...formData, fechaProximoSeguimiento: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Seguimiento
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
