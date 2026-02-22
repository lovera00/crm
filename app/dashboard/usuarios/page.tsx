"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Pencil, Trash2, AlertCircle, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Usuario {
  id: number;
  username: string;
  email: string;
  nombre: string;
  rol: string;
  activo: boolean;
  fechaCreacion: string;
}

export default function GestionUsuariosPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    nombre: "",
    rol: "gestor",
    password: "",
    activo: true,
  });

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const res = await fetch("/api/usuarios");
      if (res.ok) {
        const data = await res.json();
        setUsuarios(data.usuarios || []);
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
      const url = editingUsuario
        ? `/api/usuarios/${editingUsuario.id}`
        : "/api/usuarios";
      const method = editingUsuario ? "PUT" : "POST";

      const payload = editingUsuario
        ? { ...formData, password: formData.password || undefined }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error al guardar");
      }

      setSuccess(editingUsuario ? "Usuario actualizado" : "Usuario creado");
      setDialogOpen(false);
      setEditingUsuario(null);
      setFormData({ username: "", email: "", nombre: "", rol: "gestor", password: "", activo: true });
      fetchUsuarios();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingUsuario(usuario);
    setFormData({
      username: usuario.username,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
      password: "",
      activo: usuario.activo,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de desactivar este usuario?")) return;
    try {
      const res = await fetch(`/api/usuarios/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al desactivar");
      setSuccess("Usuario desactivado");
      fetchUsuarios();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const filteredUsuarios = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRolBadge = (rol: string) => {
    switch (rol) {
      case "administrador": return "default";
      case "supervisor": return "outline";
      default: return "secondary";
    }
  };

  if (loading) return <div className="p-8 text-center">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
          <p className="text-gray-500">Administra los usuarios del sistema</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingUsuario(null); setFormData({ username: "", email: "", nombre: "", rol: "gestor", password: "", activo: true }); }}}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nuevo Usuario</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingUsuario ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Nombre</Label>
                  <Input value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required />
                </div>
                <div>
                  <Label>Username</Label>
                  <Input value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required disabled={!!editingUsuario} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                </div>
                <div>
                  <Label>Rol</Label>
                  <Select value={formData.rol} onValueChange={(v) => setFormData({ ...formData, rol: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gestor">Gestor</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="administrador">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{editingUsuario ? "Nueva Contraseña (opcional)" : "Contraseña"}</Label>
                  <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!editingUsuario} minLength={6} />
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
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Creación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsuarios.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell className="font-medium">{usuario.nombre}</TableCell>
                  <TableCell>{usuario.username}</TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRolBadge(usuario.rol)}>
                      {usuario.rol}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={usuario.activo ? "default" : "secondary"}>
                      {usuario.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(usuario.fechaCreacion).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(usuario)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(usuario.id)}>
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
