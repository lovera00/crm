'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, CardContent, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  ChevronLeft, ChevronRight, Calendar, Phone, User, DollarSign, AlertCircle,
  TrendingUp, TrendingDown, Users, Clock, CheckCircle
} from 'lucide-react';

interface AgendaItem {
  personaId: number;
  nombres: string;
  apellidos: string;
  documento: string;
  telefono: string | null;
  totalDeuda: number;
  estadoDeuda: string;
  fechaProximo: string | null;
  estadoProximo: 'vencido' | 'hoy' | 'futuro';
}

interface Resumen {
  vencidos: number;
  hoy: number;
  futuro: number;
  total: number;
}

interface EstadosDeuda {
  id: number;
  nombre: string;
}

interface MetricasGestor {
  totalDeudas: number;
  enGestion: number;
  conAcuerdo: number;
  promedioMora: number;
  carteraTotal: number;
  seguimientosUltimaSemana: number;
  solicitudesPendientes: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-PY', {
    day: '2-digit',
    month: 'short',
  });
}

function getFechaLabel(fechaStr: string): string {
  const fecha = new Date(fechaStr);
  fecha.setHours(0, 0, 0, 0);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const diff = Math.floor((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diff < 0) return 'Vencido';
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  return formatDate(fechaStr);
}

export default function DashboardClient({ 
  user, 
  role 
}: { 
  user: { name?: string | null; email?: string | null; role: string };
  role: 'gestor' | 'supervisor' | 'administrador';
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Métricas del gestor
  const [metricas, setMetricas] = useState<MetricasGestor | null>(null);
  
  // Agenda
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [resumen, setResumen] = useState<Resumen>({ vencidos: 0, hoy: 0, futuro: 0, total: 0 });
  const [conteoPorDia, setContePorDia] = useState<Record<string, number>>({});
  const [estados, setEstados] = useState<EstadosDeuda[]>([]);
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');

  useEffect(() => {
    async function fetchEstados() {
      try {
        const res = await fetch('/api/estados-deuda', { credentials: 'include' });
        const data = await res.json();
        setEstados(data.estados || []);
      } catch (err) {
        console.error('Error fetching estados:', err);
      }
    }
    fetchEstados();
  }, []);

  useEffect(() => {
    async function fetchMetricas() {
      if (role !== 'gestor') return;
      
      try {
        const res = await fetch('/api/dashboard/stats', { credentials: 'include' });
        const data = await res.json();
        if (data.metricas) {
          setMetricas(data.metricas);
        }
      } catch (err) {
        console.error('Error fetching metricas:', err);
      }
    }
    fetchMetricas();
  }, [role]);

  useEffect(() => {
    async function fetchAgenda() {
      setLoading(true);
      setError(null);
      
      try {
        let url = `/api/agenda?fecha=${fecha}`;
        if (estadoFilter) url += `&estadoId=${estadoFilter}`;
        if (searchFilter) url += `&search=${encodeURIComponent(searchFilter)}`;
        
        const res = await fetch(url, { credentials: 'include' });
        
        if (!res.ok) {
          if (res.status === 403) {
            setError('No tienes acceso a la agenda');
            return;
          }
          throw new Error('Error al cargar agenda');
        }
        
        const data = await res.json();
        setItems(data.items || []);
        setResumen(data.resumen || { vencidos: 0, hoy: 0, futuro: 0, total: 0 });
        setContePorDia(data.conteoPorDia || {});
      } catch (err: any) {
        setError(err.message || 'Error al cargar');
      } finally {
        setLoading(false);
      }
    }
    
    if (role === 'gestor') {
      fetchAgenda();
    } else {
      setLoading(false);
    }
  }, [fecha, estadoFilter, searchFilter, role]);

  const changeFecha = (dias: number) => {
    const current = new Date(fecha);
    current.setDate(current.getDate() + dias);
    setFecha(current.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    setFecha(new Date().toISOString().split('T')[0]);
  };

  const formatFechaDisplay = (fechaStr: string) => {
    const date = new Date(fechaStr + 'T00:00:00');
    return date.toLocaleDateString('es-PY', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const getMiniCalendario = () => {
    const dias = [];
    const fechaSeleccionada = new Date(fecha + 'T00:00:00');
    for (let i = -1; i <= 2; i++) {
      const d = new Date(fechaSeleccionada);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      dias.push({
        fecha: key,
        label: d.toLocaleDateString('es-PY', { weekday: 'short' }),
        num: d.getDate(),
        count: conteoPorDia[key] || 0,
      });
    }
    return dias;
  };

  const renderAgendaGestor = () => {
    if (error) {
      return (
        <div className="p-4 text-red-600 bg-red-50 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {/* Navegador de fecha */}
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => changeFecha(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="text-center">
                <div className="font-semibold">{formatFechaDisplay(fecha)}</div>
                <Button variant="link" size="sm" onClick={goToToday} className="h-5 text-xs">
                  Hoy
                </Button>
              </div>
              
              <Button variant="outline" size="sm" onClick={() => changeFecha(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mini calendario */}
        <Card>
          <CardContent className="p-2">
            <div className="grid grid-cols-4 gap-1">
              {getMiniCalendario().map((dia) => (
                <div 
                  key={dia.fecha}
                  className={`text-center p-2 rounded cursor-pointer transition-colors ${
                    dia.fecha === fecha ? 'bg-blue-100 border-blue-300 border' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setFecha(dia.fecha)}
                >
                  <div className="text-xs text-gray-500">{dia.label} {dia.num}</div>
                  <div className={`text-lg font-bold ${dia.count > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                    {dia.count}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filtros */}
        <Card>
          <CardContent className="p-3">
            <div className="flex gap-2">
              <Select value={estadoFilter || "all"} onValueChange={(v) => setEstadoFilter(v === "all" ? "" : v)}>
                <SelectTrigger className="h-8 text-sm w-40">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {estados.map(e => (
                    <SelectItem key={e.id} value={e.id.toString()}>{e.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input
                placeholder="Buscar nombre/doc..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="h-8 text-sm"
              />
              
              {(estadoFilter || searchFilter) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => { setEstadoFilter(''); setSearchFilter(''); }}
                  className="h-8 text-xs"
                >
                  Limpiar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resumen */}
        <div className="flex gap-2 text-xs">
          <Badge className="bg-red-100 text-red-800">{resumen.vencidos} vencidos</Badge>
          <Badge className="bg-yellow-100 text-yellow-800">{resumen.hoy} hoy</Badge>
          <Badge className="bg-green-100 text-green-800">{resumen.futuro} futuros</Badge>
        </div>

        {/* Lista de deudores */}
        <Card>
          <CardHeader className="py-2 px-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">
              DEUDORES A GESTIONAR: {items.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Cargando...</div>
            ) : items.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No hay deudores para esta fecha
              </div>
            ) : (
              <div className="divide-y max-h-[calc(100vh-400px)] overflow-y-auto">
                {items.map((item) => (
                  <div 
                    key={item.personaId} 
                    className="p-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/dashboard/personas/${item.personaId}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          item.estadoProximo === 'vencido' ? 'bg-red-500' :
                          item.estadoProximo === 'hoy' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <div>
                          <div className="font-medium text-sm">
                            {item.nombres} {item.apellidos}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.documento} • {item.estadoDeuda}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-600 text-sm">
                          {formatCurrency(item.totalDeuda)}
                        </div>
                        <div className={`text-xs ${
                          item.estadoProximo === 'vencido' ? 'text-red-600 font-medium' :
                          item.estadoProximo === 'hoy' ? 'text-yellow-600 font-medium' : 'text-green-600'
                        }`}>
                          📅 {getFechaLabel(item.fechaProximo || '')}
                        </div>
                      </div>
                    </div>
                    {item.telefono && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                        <Phone className="h-3 w-3" />
                        {item.telefono}
                      </div>
                    )}
                    <div className="mt-2 flex gap-2">
                      <Button 
                        size="sm" 
                        className="h-6 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/personas/${item.personaId}`);
                        }}
                      >
                        Gestionar
                      </Button>
                      {item.telefono && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-6 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`tel:${item.telefono}`);
                          }}
                        >
                          📞 Llamar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderGestorDashboard = () => {
    return (
      <div className="space-y-4">
        {/* Métricas del Gestor */}
        {metricas && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-700">Cartera Total</p>
                    <p className="text-lg font-bold text-blue-800">{formatCurrency(metricas.carteraTotal)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-300" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-amber-700">En Gestión</p>
                    <p className="text-lg font-bold text-amber-800">{metricas.enGestion}</p>
                  </div>
                  <Clock className="h-8 w-8 text-amber-300" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-green-700">Con Acuerdo</p>
                    <p className="text-lg font-bold text-green-800">{metricas.conAcuerdo}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-300" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-red-700">Prom. Mora</p>
                    <p className="text-lg font-bold text-red-800">{Math.round(metricas.promedioMora)} días</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-red-300" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Resumen rápido */}
        {metricas && (
          <div className="flex gap-3 text-xs">
            <Badge className="bg-blue-100 text-blue-800">{metricas.totalDeudas} total deudas</Badge>
            <Badge className="bg-purple-100 text-purple-800">{metricas.seguimientosUltimaSemana} gestions/semana</Badge>
            {metricas.solicitudesPendientes > 0 && (
              <Badge className="bg-yellow-100 text-yellow-800">{metricas.solicitudesPendientes} auths pendientes</Badge>
            )}
          </div>
        )}
        
        {renderAgendaGestor()}
      </div>
    );
  };

  const renderSupervisorDashboard = () => {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Vista de Supervisor</h2>
            <p className="text-gray-500">
              Los supervisores pueden ver la agenda de todos los gestores en la sección correspondiente.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderAdminDashboard = () => {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Vista de Administrador</h2>
            <p className="text-gray-500">
              Accede a la configuración del sistema desde el menú lateral.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const getTitle = () => {
    switch (role) {
      case 'gestor': return 'Mi Agenda';
      case 'supervisor': return 'Dashboard - Supervisor';
      case 'administrador': return 'Dashboard - Administrador';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{getTitle()}</h1>
          <p className="text-sm text-gray-500">{user.name}</p>
        </div>
        {role === 'gestor' && (
          <Badge className="bg-blue-100 text-blue-800">Gestor</Badge>
        )}
      </div>

      {/* Dashboard según rol */}
      {role === 'gestor' && renderGestorDashboard()}
      {role === 'supervisor' && renderSupervisorDashboard()}
      {role === 'administrador' && renderAdminDashboard()}
    </div>
  );
}
