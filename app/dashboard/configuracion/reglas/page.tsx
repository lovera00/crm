"use client";

import { useState, useEffect } from "react";
import { Settings, Plus, Pencil, Trash2, ArrowLeft, AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface TipoGestion {
  id: number;
  nombre: string;
}

interface EstadoDeuda {
  id: number;
  nombre: string;
}

interface ReglaTransicion {
  id: number;
  tipoGestionId: number;
  tipoGestion?: TipoGestion;
  estadoOrigenId: number | null;
  estadoOrigen?: EstadoDeuda;
  estadoDestinoId: number | null;
  estadoDestino?: EstadoDeuda;
  requiereAutorizacion: boolean;
  mensajeUi?: string;
  prioridad: number;
  activo: boolean;
}

export default function ConfigReglasPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reglas, setReglas] = useState<ReglaTransicion[]>([]);
  const [tiposGestion, setTiposGestion] = useState<TipoGestion[]>([]);
  const [estados, setEstados] = useState<EstadoDeuda[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRegla, setEditingRegla] = useState<ReglaTransicion | null>(null);

  const [formData, setFormData] = useState({
    tipoGestionId: "",
    estadoOrigenId: "null",
    estadoDestinoId: "null",
    requiereAutorizacion: false,
    mensajeUi: "",
    prioridad: 0,
    activo: true,
  });

  useEffect(() => {
    Promise.all([fetchReglas(), fetchTiposGestion(), fetchEstados()]);
  }, []);

  const fetchReglas = async () => {
    try {
      const res = await fetch("/api/config/reglas");
      if (res.ok) {
        const data = await res.json();
        setReglas(data.reglas || []);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTiposGestion = async () => {
    try {
      const res = await fetch("/api/config/tipos-gestion?activo=true");
      if (res.ok) {
        const data = await res.json();
        setTiposGestion(data.tiposGestion || []);
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const fetchEstados = async () => {
    try {
      const res = await fetch("/api/estados-deuda");
      if (res.ok) {
        const data = await res.json();
        setEstados(data.estados || []);
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const payload = {
        tipoGestionId: parseInt(formData.tipoGestionId),
        estadoOrigenId: formData.estadoOrigenId === "null" ? null : parseInt(formData.estadoOrigenId),
        estadoDestinoId: formData.estadoDestinoId === "null" ? null : parseInt(formData.estadoDestinoId),
        requiereAutorizacion: formData.requiereAutorizacion,
        mensajeUi: formData.mensajeUi,
        prioridad: formData.prioridad,
        activo: formData.activo,
      };

      const url = editingRegla
        ? `/api/config/reglas/${editingRegla.id}`
        : "/api/config/reglas";
      const method = editingRegla ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error al guardar");
      }

      setSuccess(editingRegla ? "Regla actualizada" : "Regla creada");
      setDialogOpen(false);
      setEditingRegla(null);
      setFormData({ tipoGestionId: "", estadoOrigenId: "null", estadoDestinoId: "null", requiereAutorizacion: false, mensajeUi: "", prioridad: 0, activo: true });
      fetchReglas();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (regla: ReglaTransicion) => {
    setEditingRegla(regla);
    setFormData({
      tipoGestionId: regla.tipoGestionId.toString(),
      estadoOrigenId: regla.estadoOrigenId?.toString() || "null",
      estadoDestinoId: regla.estadoDestinoId?.toString() || "null",
      requiereAutorizacion: regla.requiereAutorizacion,
      mensajeUi: regla.mensajeUi || "",
      prioridad: regla.prioridad,
      activo: regla.activo,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar esta regla?")) return;
    try {
      const res = await fetch(`/api/config/reglas/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      setSuccess("Regla eliminada");
      fetchReglas();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  if (loading) return <div className="p-8 text-center">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Configuración de Reglas de Transición</h1>
          <p className="text-gray-500">Administra las reglas que determinan cambios de estado</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingRegla(null); setFormData({ tipoGestionId: "", estadoOrigenId: "null", estadoDestinoId: "null", requiereAutorizacion: false, mensajeUi: "", prioridad: 0, activo: true }); }}}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nueva Regla</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingRegla ? "Editar Regla" : "Nueva Regla de Transición"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Tipo de Gestión</Label>
                  <Select value={formData.tipoGestionId} onValueChange={(v) => setFormData({ ...formData, tipoGestionId: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      {tiposGestion.map((t) => <SelectItem key={t.id} value={t.id.toString()}>{t.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Estado Origen</Label>
                    <Select value={formData.estadoOrigenId} onValueChange={(v) => setFormData({ ...formData, estadoOrigenId: v })}>
                      <SelectTrigger><SelectValue placeholder="Cualquiera" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null">Cualquiera</SelectItem>
                        {estados.map((e) => <SelectItem key={e.id} value={e.id.toString()}>{e.nombre}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Estado Destino</Label>
                    <Select value={formData.estadoDestinoId} onValueChange={(v) => setFormData({ ...formData, estadoDestinoId: v })}>
                      <SelectTrigger><SelectValue placeholder="El mismo" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null">El mismo</SelectItem>
                        {estados.map((e) => <SelectItem key={e.id} value={e.id.toString()}>{e.nombre}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Prioridad</Label>
                    <Input type="number" value={formData.prioridad} onChange={(e) => setFormData({ ...formData, prioridad: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="flex items-center gap-2 mt-6">
                    <input type="checkbox" checked={formData.requiereAutorizacion} onChange={(e) => setFormData({ ...formData, requiereAutorizacion: e.target.checked })} />
                    <Label>Requiere autorización</Label>
                  </div>
                </div>
                {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                {success && <Alert><AlertDescription>{success}</AlertDescription></Alert>}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      {success && <Alert><Check className="h-4 w-4" /><AlertDescription>{success}</AlertDescription></Alert>}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo Gestión</TableHead>
                <TableHead>Estado Origen</TableHead>
                <TableHead>Estado Destino</TableHead>
                <TableHead>Requiere Auth</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reglas.map((regla) => (
                <TableRow key={regla.id}>
                  <TableCell className="font-medium">{regla.tipoGestion?.nombre || "-"}</TableCell>
                  <TableCell>{regla.estadoOrigen?.nombre || "Cualquiera"}</TableCell>
                  <TableCell>{regla.estadoDestino?.nombre || "El mismo"}</TableCell>
                  <TableCell>
                    <Badge variant={regla.requiereAutorizacion ? "default" : "secondary"}>
                      {regla.requiereAutorizacion ? "Sí" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell>{regla.prioridad}</TableCell>
                  <TableCell>
                    <Badge variant={regla.activo ? "default" : "secondary"}>
                      {regla.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(regla)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(regla.id)}><Trash2 className="h-4 w-4" /></Button>
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
