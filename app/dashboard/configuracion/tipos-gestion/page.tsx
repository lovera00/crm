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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface TipoGestion {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  orden: number;
  color?: string;
  icono?: string;
}

export default function ConfigTiposGestionPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tiposGestion, setTiposGestion] = useState<TipoGestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoGestion | null>(null);

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    activo: true,
    orden: 0,
    color: "#3B82F6",
  });

  useEffect(() => {
    fetchTiposGestion();
  }, []);

  const fetchTiposGestion = async () => {
    try {
      const res = await fetch("/api/config/tipos-gestion");
      if (res.ok) {
        const data = await res.json();
        setTiposGestion(data.tiposGestion || []);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const url = editingTipo
        ? `/api/config/tipos-gestion/${editingTipo.id}`
        : "/api/config/tipos-gestion";
      const method = editingTipo ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error al guardar");
      }

      setSuccess(editingTipo ? "Tipo de gestión actualizado" : "Tipo de gestión creado");
      setDialogOpen(false);
      setEditingTipo(null);
      setFormData({ nombre: "", descripcion: "", activo: true, orden: 0, color: "#3B82F6" });
      fetchTiposGestion();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (tipo: TipoGestion) => {
    setEditingTipo(tipo);
    setFormData({
      nombre: tipo.nombre,
      descripcion: tipo.descripcion || "",
      activo: tipo.activo,
      orden: tipo.orden,
      color: tipo.color || "#3B82F6",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar este tipo de gestión?")) return;

    try {
      const res = await fetch(`/api/config/tipos-gestion/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error al eliminar");
      }
      setSuccess("Tipo de gestión eliminado");
      fetchTiposGestion();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Configuración de Tipos de Gestión</h1>
          <p className="text-gray-500">Administra los tipos de gestión del sistema</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingTipo(null); setFormData({ nombre: "", descripcion: "", activo: true, orden: 0, color: "#3B82F6" }); }}}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Tipo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingTipo ? "Editar Tipo de Gestión" : "Nuevo Tipo de Gestión"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Nombre</Label>
                  <Input
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Descripción</Label>
                  <Textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Orden</Label>
                    <Input
                      type="number"
                      value={formData.orden}
                      onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Color</Label>
                    <Input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    />
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
                <TableHead>Color</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Orden</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tiposGestion.map((tipo) => (
                <TableRow key={tipo.id}>
                  <TableCell>
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: tipo.color || "#3B82F6" }} />
                  </TableCell>
                  <TableCell className="font-medium">{tipo.nombre}</TableCell>
                  <TableCell>{tipo.descripcion || "-"}</TableCell>
                  <TableCell>{tipo.orden}</TableCell>
                  <TableCell>
                    <Badge variant={tipo.activo ? "default" : "secondary"}>
                      {tipo.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(tipo)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(tipo.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
