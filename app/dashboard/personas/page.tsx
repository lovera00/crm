"use client";

import { useState } from "react";
import { Search, User, Phone, Mail, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Persona {
  id: number;
  nombres: string;
  apellidos: string;
  documento: string;
  funcionarioPublico: string;
  jubilado: string;
  ipsActivo: string;
}

export default function PersonasPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [total, setTotal] = useState(0);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      // TODO: Implementar llamada a API
      const response = await fetch(`/api/personas?search=${encodeURIComponent(searchTerm)}&limit=20&offset=0`);
      if (response.ok) {
        const data = await response.json();
        setPersonas(data.personas || []);
        setTotal(data.total || 0);
      } else {
        console.error("Error en búsqueda:", await response.text());
      }
    } catch (error) {
      console.error("Error de red:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Búsqueda de Personas</h1>
        <p className="text-gray-600">
          Busca personas por nombre, apellido o documento para gestionar deudas y seguimientos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar Personas</CardTitle>
          <CardDescription>
            Ingresa nombre, apellido o documento (cédula, DNI, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Ej: Juan Pérez, 12345678..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? "Buscando..." : "Buscar"}
            </Button>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            <p>Tip: Puedes buscar por nombres, apellidos o número de documento.</p>
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
      ) : personas.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Resultados ({total})</CardTitle>
            <CardDescription>
              {total > 20 ? `Mostrando 20 de ${total} resultados` : `Mostrando ${total} resultados`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Persona</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {personas.map((persona) => (
                  <TableRow key={persona.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{persona.nombres} {persona.apellidos}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Phone className="h-3 w-3" />
                            <span>Teléfonos</span>
                            <Mail className="h-3 w-3 ml-2" />
                            <span>Emails</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">{persona.documento}</code>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={persona.funcionarioPublico === "SI" ? "default" : "secondary"} className="text-xs">
                            Func. Público: {persona.funcionarioPublico}
                          </Badge>
                          <Badge variant={persona.jubilado === "SI" ? "default" : "secondary"} className="text-xs">
                            Jubilado: {persona.jubilado}
                          </Badge>
                        </div>
                        <Badge variant={persona.ipsActivo === "SI" ? "default" : "secondary"} className="text-xs">
                          IPS Activo: {persona.ipsActivo}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
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
      ) : searchTerm ? (
        <Card>
          <CardContent className="py-8 text-center">
            <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">No se encontraron personas</h3>
            <p className="text-gray-500 mt-2">
              No hay resultados para "{searchTerm}". Intenta con otros términos.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}