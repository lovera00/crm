"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavbarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
}

interface SearchResult {
  id: number;
  nombres?: string;
  apellidos?: string;
  documento?: string;
  acreedor?: string;
  concepto?: string;
  saldoCapitalTotal?: number;
  estadoActual?: { nombre: string };
  personaId?: number;
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const [pendientes, setPendientes] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ personas: SearchResult[]; deudas: SearchResult[] }>({ personas: [], deudas: [] });
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const role = user?.role || 'gestor';

  useEffect(() => {
    async function fetchPendientes() {
      try {
        const res = await fetch('/api/autorizaciones/count', { credentials: 'include' });
        const data = await res.json();
        setPendientes(data.count || 0);
      } catch (err) {
        console.error('Error fetching count:', err);
      }
    }
    
    fetchPendientes();
    const interval = setInterval(fetchPendientes, 60000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearching(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const search = async () => {
      if (searchQuery.length < 2) {
        setSearchResults({ personas: [], deudas: [] });
        return;
      }
      try {
        const res = await fetch(`/api/buscar?q=${encodeURIComponent(searchQuery)}`, { credentials: 'include' });
        const data = await res.json();
        setSearchResults(data);
      } catch (err) {
        console.error('Search error:', err);
      }
    };
    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handlePersonaClick = (id: number) => {
    setIsSearching(false);
    setSearchQuery("");
    router.push(`/dashboard/personas/${id}`);
  };

  const handleDeudaClick = (personaId: number) => {
    setIsSearching(false);
    setSearchQuery("");
    router.push(`/dashboard/personas/${personaId}`);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold text-blue-700">CRM Cobranzas</div>
          <div className="relative hidden md:block" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="search"
              placeholder="Buscar personas, deudas..."
              className="pl-10 pr-4 py-2 w-96 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearching(true);
              }}
              onFocus={() => setIsSearching(true)}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults({ personas: [], deudas: [] });
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {isSearching && (searchResults.personas.length > 0 || searchResults.deudas.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                {searchResults.personas.length > 0 && (
                  <div className="p-2">
                    <p className="text-xs font-semibold text-gray-500 px-2 py-1">Personas</p>
                    {searchResults.personas.map((p) => (
                      <button
                        key={`persona-${p.id}`}
                        onClick={() => handlePersonaClick(p.id)}
                        className="w-full text-left px-2 py-2 hover:bg-gray-100 rounded flex justify-between items-center"
                      >
                        <span>{p.nombres} {p.apellidos}</span>
                        <span className="text-xs text-gray-500">{p.documento}</span>
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.deudas.length > 0 && (
                  <div className="p-2 border-t">
                    <p className="text-xs font-semibold text-gray-500 px-2 py-1">Deudas</p>
                    {searchResults.deudas.map((d) => (
                      <button
                        key={`deuda-${d.id}`}
                        onClick={() => d.personaId && handleDeudaClick(d.personaId)}
                        disabled={!d.personaId}
                        className="w-full text-left px-2 py-2 hover:bg-gray-100 rounded flex justify-between items-center disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span>{d.acreedor} - {d.concepto}</span>
                        <span className="text-xs text-gray-500">${d.saldoCapitalTotal?.toLocaleString('es-PY')}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
            onClick={() => router.push('/dashboard/autorizaciones')}
          >
            <Bell className="h-5 w-5" />
            {pendientes > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {pendientes > 9 ? '9+' : pendientes}
              </span>
            )}
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900">{user?.name || "Usuario"}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role || "Rol"}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}