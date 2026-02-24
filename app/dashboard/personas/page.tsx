"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, User, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Persona {
  id: number;
  nombres: string;
  apellidos: string;
  documento: string;
  telefonos?: { numero: string }[];
  emails?: { email: string }[];
  funcionarioPublico: string;
  jubilado: string;
  ipsActivo: string;
}

export default function PersonasPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [total, setTotal] = useState(0);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/personas?search=${encodeURIComponent(searchTerm)}&limit=20&offset=0`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setPersonas(data.personas || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="space-y-3">
      {/* Buscador compacto */}
      <Card>
        <CardContent className="p-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, apellido o documento..."
                className="pl-8 h-9 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={loading}
              />
            </div>
            <Button onClick={handleSearch} disabled={loading} size="sm" className="h-9">
              {loading ? "Buscando..." : "Buscar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {loading ? (
        <Card>
          <CardContent className="p-3">
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : personas.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="py-1">
                  <TableHead className="py-2">Persona</TableHead>
                  <TableHead className="py-2 w-32">Documento</TableHead>
                  <TableHead className="py-2">Atributos</TableHead>
                  <TableHead className="py-2 w-24 text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {personas.map((persona) => (
                  <TableRow key={persona.id} className="py-1">
                    <TableCell className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{persona.nombres} {persona.apellidos}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {persona.telefonos?.[0] && (
                              <span className="flex items-center gap-0.5">
                                <Phone className="h-2.5 w-2.5" />
                                {persona.telefonos[0].numero}
                              </span>
                            )}
                            {persona.emails?.[0] && (
                              <span className="flex items-center gap-0.5">
                                <Mail className="h-2.5 w-2.5" />
                                {persona.emails[0].email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{persona.documento}</code>
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex flex-wrap gap-1">
                        {persona.funcionarioPublico === 'SI' && (
                          <Badge className="bg-blue-100 text-blue-800 text-[10px] py-0">FP</Badge>
                        )}
                        {persona.jubilado === 'SI' && (
                          <Badge className="bg-green-100 text-green-800 text-[10px] py-0">JUB</Badge>
                        )}
                        {persona.ipsActivo === 'SI' && (
                          <Badge className="bg-purple-100 text-purple-800 text-[10px] py-0">IPS</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 text-xs"
                        onClick={() => router.push(`/dashboard/personas/${persona.id}`)}
                      >
                        Gestionar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {total > 20 && (
              <div className="p-2 text-xs text-gray-500 text-center border-t">
                Mostrando 20 de {total} resultados
              </div>
            )}
          </CardContent>
        </Card>
      ) : searchTerm ? (
        <Card>
          <CardContent className="p-4 text-center text-gray-500 text-sm">
            No se encontraron personas para "{searchTerm}"
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
