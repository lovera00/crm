'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Phone, Mail, User, Briefcase, Home, FileText, DollarSign, 
  Clock, ChevronDown, ChevronUp, Plus, X, Pencil, Trash2, Users
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FechaHoraInput } from '@/components/ui/fecha-hora-input';

interface Persona {
  id: number;
  nombres: string;
  apellidos: string;
  documento: string;
  funcionarioPublico: string;
  fechaModFuncionario: string | null;
  jubilado: string;
  fechaModJubilado: string | null;
  ipsActivo: string;
  fechaModIps: string | null;
  datosVarios: Record<string, any> | null;
  fechaCreacion: string;
  creadoPor: string;
  modificadoPor: string | null;
  telefonos: { id: number; numero: string; estado: string }[];
  emails: { id: number; email: string; estado: string }[];
  referenciasPersonales: { id: number; nombre: string; parentesco: string; telefono: string }[];
  referenciasLaborales: { id: number; nombre: string; empresa: string | null; telefono: string }[];
}

interface Telefono {
  id: number;
  numero: string;
  observacion?: string | null;
  estado: string;
}

interface Email {
  id: number;
  email: string;
  observacion?: string | null;
  estado: string;
}

interface ReferenciaPersonal {
  id: number;
  nombre: string;
  parentesco: string;
  telefono: string;
  observacion?: string | null;
  estado: string;
}

interface ReferenciaLaboral {
  id: number;
  nombre: string;
  empresa: string | null;
  telefono: string;
  observacion?: string | null;
  estado: string;
}

interface Deuda {
  id: number;
  esDeudorPrincipal: boolean;
  acreedor: string;
  concepto: string;
  saldoCapitalTotal: number;
  deudaTotal: number;
  diasMora: number;
  diasGestion: number;
  estadoActual: { id: number; nombre: string; orden: number };
  montoCuota: number | null;
  fechaUltimoPago: string | null;
  gestorAsignado: { id: number; nombre: string } | null;
}

interface Seguimiento {
  id: number;
  gestor: string;
  tipoGestion: { nombre: string; color: string | null; icono: string | null };
  fechaHora: string;
  observacion: string | null;
  requiereSeguimiento: boolean;
  fechaProximoSeguimiento: string | null;
  deudas: { id: number; acreedor: string; concepto: string }[];
  solicitudAutorizacion: { id: number; estado: string; fechaSolicitud: string } | null;
}

interface TipoGestion {
  id: number;
  nombre: string;
  descripcion: string | null;
  color: string | null;
  icono: string | null;
}

interface ReglaTransicion {
  id: number;
  tipoGestionId: number;
  estadoOrigenId: number | null;
  estadoOrigenNombre: string | null;
  estadoDestinoId: number | null;
  estadoDestinoNombre: string | null;
  requiereAutorizacion: boolean;
  mensajeUi: string | null;
  prioridad: number;
}

interface Props {
  personaId: number;
  user: { role: 'gestor' | 'supervisor' | 'administrador' };
}

const ESTADO_COLORS: Record<string, string> = {
  'Nueva': 'bg-blue-100 text-blue-800',
  'En Gestión': 'bg-yellow-100 text-yellow-800',
  'Acordado': 'bg-green-100 text-green-800',
  'Pagada': 'bg-green-200 text-green-900',
  'Incobrable': 'bg-red-100 text-red-800',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('es-PY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('es-PY', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function FichaPersona({ personaId, user }: Props) {
  const [persona, setPersona] = useState<Persona | null>(null);
  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([]);
  const [tiposGestion, setTiposGestion] = useState<TipoGestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Contactos
  const [telefonos, setTelefonos] = useState<Telefono[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [referenciasPersonales, setReferenciasPersonales] = useState<ReferenciaPersonal[]>([]);
  const [referenciasLaborales, setReferenciasLaborales] = useState<ReferenciaLaboral[]>([]);

  // Modals
  const [showAddTelefono, setShowAddTelefono] = useState(false);
  const [showAddEmail, setShowAddEmail] = useState(false);
  const [showAddReferenciaPersonal, setShowAddReferenciaPersonal] = useState(false);
  const [showAddReferenciaLaboral, setShowAddReferenciaLaboral] = useState(false);
  const [showEditReferencia, setShowEditReferencia] = useState(false);
  const [editReferenciaType, setEditReferenciaType] = useState<'personal' | 'laboral'>('personal');
  const [editReferencia, setEditReferencia] = useState<ReferenciaPersonal | ReferenciaLaboral | null>(null);

  // Form states
  const [newTelefono, setNewTelefono] = useState('');
  const [newTelefonoObs, setNewTelefonoObs] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newEmailObs, setNewEmailObs] = useState('');
  const [newRefPersonal, setNewRefPersonal] = useState({ nombre: '', parentesco: '', telefono: '' });
  const [newRefPersonalObs, setNewRefPersonalObs] = useState('');
  const [newRefLaboral, setNewRefLaboral] = useState({ nombre: '', empresa: '', telefono: '' });
  const [newRefLaboralObs, setNewRefLaboralObs] = useState('');

  const [selectedDeudas, setSelectedDeudas] = useState<number[]>([]);
  const [tipoGestionId, setTipoGestionId] = useState<string>('');
  const [observacion, setObservacion] = useState('');
  const [fechaProximo, setFechaProximo] = useState('');
  const [expandedSeg, setExpandedSeg] = useState<number[]>([]);
  const [reglas, setReglas] = useState<ReglaTransicion[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [personaRes, deudasRes, seguimientosRes, tiposRes] = await Promise.all([
          fetch(`/api/personas/${personaId}`, { credentials: 'include' }),
          fetch(`/api/personas/${personaId}/deudas`, { credentials: 'include' }),
          fetch(`/api/personas/${personaId}/seguimientos?limit=100`, { credentials: 'include' }),
          fetch('/api/config/tipos-gestion?activo=true', { credentials: 'include' }),
        ]);

        const [p, d, s, tg] = await Promise.all([
          personaRes.json(),
          deudasRes.json(),
          seguimientosRes.json(),
          tiposRes.json(),
        ]);

        setPersona(p);
        setDeudas(d.deudas || []);
        setSeguimientos(s.seguimientos || []);
        setTiposGestion(tg.tiposGestion || []);

        // Cargar contactos desde la persona
        setTelefonos(p.telefonos || []);
        setEmails(p.emails || []);
        setReferenciasPersonales(p.referenciasPersonales || []);
        setReferenciasLaborales(p.referenciasLaborales || []);
      } catch (err) {
        setError('Error al cargar datos');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [personaId]);

  useEffect(() => {
    async function loadReglas() {
      if (!tipoGestionId || selectedDeudas.length === 0) {
        setReglas([]);
        return;
      }
      const primeraDeuda = deudas.find(d => selectedDeudas.includes(d.id));
      if (!primeraDeuda) {
        setReglas([]);
        return;
      }
      try {
        const res = await fetch(`/api/config/reglas?tipo_gestion_id=${tipoGestionId}&activo=true`, { credentials: 'include' });
        const data = await res.json();
        const reglasFiltradas = (data.reglas || []).filter((r: ReglaTransicion) =>
          r.estadoOrigenId === null || r.estadoOrigenId === primeraDeuda.estadoActual.id
        );
        setReglas(reglasFiltradas);
      } catch (err) {
        console.error('Error loading reglas:', err);
      }
    }
    loadReglas();
  }, [tipoGestionId, selectedDeudas, deudas]);

  const handleDeudaToggle = (deudaId: number) => {
    setSelectedDeudas(prev =>
      prev.includes(deudaId)
        ? prev.filter(id => id !== deudaId)
        : [...prev, deudaId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (selectedDeudas.length === 0) {
      setError('Seleccione al menos una deuda');
      return;
    }
    if (!tipoGestionId) {
      setError('Seleccione tipo de gestión');
      return;
    }
    if (!fechaProximo) {
      setError('Ingrese la fecha de próxima gestión');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/seguimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          personaId,
          deudaIds: selectedDeudas,
          tipoGestionId: parseInt(tipoGestionId, 10),
          observacion: observacion || undefined,
          requiereSeguimiento: true,
          fechaProximoSeguimiento: fechaProximo,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.solicitudPendiente) {
          setSuccess('Seguimiento creado. Autorización pendiente.');
        } else {
          throw new Error(data.message || data.error || 'Error al crear');
        }
      } else {
        setSuccess('Seguimiento creado');
      }

      setSelectedDeudas([]);
      setTipoGestionId('');
      setObservacion('');
      setFechaProximo('');

      const [segRes, deudaRes] = await Promise.all([
        fetch(`/api/personas/${personaId}/seguimientos?limit=100`, { credentials: 'include' }),
        fetch(`/api/personas/${personaId}/deudas`, { credentials: 'include' }),
      ]);
      const segData = await segRes.json();
      const deudaData = await deudaRes.json();
      setSeguimientos(segData.seguimientos || []);
      setDeudas(deudaData.deudas || []);

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al crear');
    } finally {
      setSaving(false);
    }
  };

  const toggleExpand = (segId: number) => {
    setExpandedSeg(prev =>
      prev.includes(segId)
        ? prev.filter(id => id !== segId)
        : [...prev, segId]
    );
  };

  // Funciones para contactos
  const handleAddTelefono = async () => {
    if (!newTelefono.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/telefonos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ personaId, numero: newTelefono, observacion: newTelefonoObs || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        setTelefonos(prev => [...prev, { id: data.id, numero: data.numero, estado: data.estado }]);
        setNewTelefono('');
        setNewTelefonoObs('');
        setShowAddTelefono(false);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddEmail = async () => {
    if (!newEmail.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ personaId, email: newEmail, observacion: newEmailObs || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        setEmails(prev => [...prev, { id: data.id, email: data.email, estado: data.estado }]);
        setNewEmail('');
        setNewEmailObs('');
        setShowAddEmail(false);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddReferenciaPersonal = async () => {
    if (!newRefPersonal.nombre.trim() || !newRefPersonal.telefono.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/referencias-personales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ personaId, ...newRefPersonal, observacion: newRefPersonalObs || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        setReferenciasPersonales(prev => [...prev, { 
          id: data.id, nombre: data.nombre, parentesco: data.parentesco, telefono: data.telefono, estado: data.estado 
        }]);
        setNewRefPersonal({ nombre: '', parentesco: '', telefono: '' });
        setNewRefPersonalObs('');
        setShowAddReferenciaPersonal(false);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddReferenciaLaboral = async () => {
    if (!newRefLaboral.nombre.trim() || !newRefLaboral.telefono.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/referencias-laborales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ personaId, ...newRefLaboral, observacion: newRefLaboralObs || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        setReferenciasLaborales(prev => [...prev, { 
          id: data.id, nombre: data.nombre, empresa: data.empresa, telefono: data.telefono, estado: data.estado 
        }]);
        setNewRefLaboral({ nombre: '', empresa: '', telefono: '' });
        setNewRefLaboralObs('');
        setShowAddReferenciaLaboral(false);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEstado = async (tipo: 'telefono' | 'email' | 'refpersonal' | 'reflaboral', id: number, currentEstado: string) => {
    const estados = ['Pendiente_de_Verificacion', 'Activo', 'Inactivo'];
    const currentIdx = estados.indexOf(currentEstado);
    const nextEstado = estados[(currentIdx + 1) % 3];
    
    const endpoint = tipo === 'telefono' ? '/api/telefonos' 
      : tipo === 'email' ? '/api/emails'
      : tipo === 'refpersonal' ? '/api/referencias-personales'
      : '/api/referencias-laborales';

    try {
      const res = await fetch(`${endpoint}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ estado: nextEstado }),
      });
      if (res.ok) {
        if (tipo === 'telefono') {
          setTelefonos(prev => prev.map(t => t.id === id ? { ...t, estado: nextEstado } : t));
        } else if (tipo === 'email') {
          setEmails(prev => prev.map(e => e.id === id ? { ...e, estado: nextEstado } : e));
        } else if (tipo === 'refpersonal') {
          setReferenciasPersonales(prev => prev.map(r => r.id === id ? { ...r, estado: nextEstado } : r));
        } else {
          setReferenciasLaborales(prev => prev.map(r => r.id === id ? { ...r, estado: nextEstado } : r));
        }
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const getEstadoLabel = (estado: string): string => {
    const labels: Record<string, string> = {
      'Pendiente_de_Verificacion': 'Pendiente',
      'Activo': 'Activo',
      'Inactivo': 'Inactivo'
    };
    return labels[estado] || estado;
  };

  const getEstadoColor = (estado: string): string => {
    const colors: Record<string, string> = {
      'Pendiente_de_Verificacion': 'bg-yellow-100 text-yellow-800',
      'Activo': 'bg-green-100 text-green-800',
      'Inactivo': 'bg-gray-100 text-gray-800'
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  const getEstadoBadgeClass = (nombre: string): string => {
    return ESTADO_COLORS[nombre] || 'bg-gray-100 text-gray-800';
  };

  const getAuthStatusBadgeClass = (nombre: string): string => {
    const colors: Record<string, string> = {
      'Pendiente': 'bg-yellow-100 text-yellow-800',
      'Aprobada': 'bg-green-100 text-green-800',
      'Rechazada': 'bg-red-100 text-red-800',
    };
    return colors[nombre] || 'bg-gray-100 text-gray-800';
  };

  const getTotalDeuda = () => {
    return deudas.reduce((sum, d) => sum + d.deudaTotal, 0);
  };

  const getTotalSaldo = () => {
    return deudas.reduce((sum, d) => sum + d.saldoCapitalTotal, 0);
  };

  const reglaAplicada = reglas.length > 0 ? reglas[0] : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error && !persona) {
    return (
      <div className="p-4 text-red-600">Error: {error}</div>
    );
  }

  return (
    <div className="space-y-3">
      {/* HEADER COMPACTO */}
      <div className="flex items-center justify-between bg-white rounded-lg p-3 border">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{persona?.nombres} {persona?.apellidos}</h1>
            <div className="flex items-center gap-2">
              <code className="bg-gray-100 px-2 py-0.5 rounded text-sm">{persona?.documento}</code>
              {persona?.funcionarioPublico === 'SI' && (
                <Badge className="bg-blue-100 text-blue-800 text-xs">FP</Badge>
              )}
              {persona?.jubilado === 'SI' && (
                <Badge className="bg-green-100 text-green-800 text-xs">JUB</Badge>
              )}
              {persona?.ipsActivo === 'SI' && (
                <Badge className="bg-purple-100 text-purple-800 text-xs">IPS</Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {persona?.telefonos?.[0] && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {persona.telefonos[0].numero}
            </span>
          )}
          {persona?.emails?.[0] && (
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {persona.emails[0].email}
            </span>
          )}
        </div>
      </div>

      {/* SECCIONES DE CONTACTO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        
        {/* TELÉFONOS */}
        <Card>
          <CardHeader className="py-2 px-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Teléfonos ({telefonos.length})
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => setShowAddTelefono(true)}>
              <Plus className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-2 space-y-1">
            {telefonos.slice(0, 5).map(tel => (
              <div key={tel.id} className="flex items-center justify-between text-sm p-1 rounded hover:bg-gray-50">
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{tel.numero}</span>
                  </div>
                  {tel.observacion && (
                    <span className="text-[10px] text-gray-400 ml-5 truncate">{tel.observacion}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleToggleEstado('telefono', tel.id, tel.estado)}
                    className={`px-1.5 py-0.5 rounded text-[10px] ${getEstadoColor(tel.estado)}`}
                  >
                    {getEstadoLabel(tel.estado)}
                  </button>
                </div>
              </div>
            ))}
            {telefonos.length === 0 && (
              <p className="text-xs text-gray-500 text-center py-2">Sin teléfonos</p>
            )}
            {telefonos.length > 5 && (
              <p className="text-xs text-gray-500 text-center">+{telefonos.length - 5} más</p>
            )}
          </CardContent>
        </Card>

        {/* EMAILS */}
        <Card>
          <CardHeader className="py-2 px-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Emails ({emails.length})
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => setShowAddEmail(true)}>
              <Plus className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-2 space-y-1">
            {emails.slice(0, 5).map(email => (
              <div key={email.id} className="flex items-center justify-between text-sm p-1 rounded hover:bg-gray-50">
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{email.email}</span>
                  </div>
                  {email.observacion && (
                    <span className="text-[10px] text-gray-400 ml-5 truncate">{email.observacion}</span>
                  )}
                </div>
                <button 
                  onClick={() => handleToggleEstado('email', email.id, email.estado)}
                  className={`px-1.5 py-0.5 rounded text-[10px] ${getEstadoColor(email.estado)}`}
                >
                  {getEstadoLabel(email.estado)}
                </button>
              </div>
            ))}
            {emails.length === 0 && (
              <p className="text-xs text-gray-500 text-center py-2">Sin emails</p>
            )}
            {emails.length > 5 && (
              <p className="text-xs text-gray-500 text-center">+{emails.length - 5} más</p>
            )}
          </CardContent>
        </Card>

        {/* REFERENCIAS */}
        <Card>
          <CardHeader className="py-2 px-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Referencias ({referenciasPersonales.length + referenciasLaborales.length})
            </CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-6 px-1" onClick={() => setShowAddReferenciaPersonal(true)} title="Agregar referencia personal">
                P+
              </Button>
              <Button variant="ghost" size="sm" className="h-6 px-1" onClick={() => setShowAddReferenciaLaboral(true)} title="Agregar referencia laboral">
                L+
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-2 space-y-1 max-h-40 overflow-y-auto">
            {referenciasPersonales.slice(0, 3).map(ref => (
              <div key={`p-${ref.id}`} className="flex items-center justify-between text-xs p-1 rounded hover:bg-gray-50">
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{ref.nombre} ({ref.parentesco || 'sin parentesco'})</span>
                  </div>
                  {ref.observacion && (
                    <span className="text-[9px] text-gray-400 ml-4 truncate">{ref.observacion}</span>
                  )}
                </div>
                <button 
                  onClick={() => handleToggleEstado('refpersonal', ref.id, ref.estado)}
                  className={`px-1 py-0.5 rounded text-[9px] ${getEstadoColor(ref.estado)}`}
                >
                  {getEstadoLabel(ref.estado)}
                </button>
              </div>
            ))}
            {referenciasLaborales.slice(0, 2).map(ref => (
              <div key={`l-${ref.id}`} className="flex items-center justify-between text-xs p-1 rounded hover:bg-gray-50">
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{ref.nombre} {ref.empresa && `(${ref.empresa})`}</span>
                  </div>
                  {ref.observacion && (
                    <span className="text-[9px] text-gray-400 ml-4 truncate">{ref.observacion}</span>
                  )}
                </div>
                <button 
                  onClick={() => handleToggleEstado('reflaboral', ref.id, ref.estado)}
                  className={`px-1 py-0.5 rounded text-[9px] ${getEstadoColor(ref.estado)}`}
                >
                  {getEstadoLabel(ref.estado)}
                </button>
              </div>
            ))}
            {referenciasPersonales.length === 0 && referenciasLaborales.length === 0 && (
              <p className="text-xs text-gray-500 text-center py-2">Sin referencias</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* MODALS PARA AGREGAR CONTACTOS */}
      
      {/* Modal Teléfono */}
      <Dialog open={showAddTelefono} onOpenChange={setShowAddTelefono}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Teléfono</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input 
              placeholder="Número de teléfono" 
              value={newTelefono}
              onChange={(e) => setNewTelefono(e.target.value)}
            />
            <Input 
              placeholder="Observación (opcional)" 
              value={newTelefonoObs}
              onChange={(e) => setNewTelefonoObs(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTelefono(false)}>Cancelar</Button>
            <Button onClick={handleAddTelefono} disabled={saving || !newTelefono.trim()}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Email */}
      <Dialog open={showAddEmail} onOpenChange={setShowAddEmail}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input 
              placeholder="Correo electrónico" 
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <Input 
              placeholder="Observación (opcional)" 
              value={newEmailObs}
              onChange={(e) => setNewEmailObs(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddEmail(false)}>Cancelar</Button>
            <Button onClick={handleAddEmail} disabled={saving || !newEmail.trim()}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Referencia Personal */}
      <Dialog open={showAddReferenciaPersonal} onOpenChange={setShowAddReferenciaPersonal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Referencia Personal</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input 
              placeholder="Nombre" 
              value={newRefPersonal.nombre}
              onChange={(e) => setNewRefPersonal({...newRefPersonal, nombre: e.target.value})}
            />
            <Input 
              placeholder="Parentesco" 
              value={newRefPersonal.parentesco}
              onChange={(e) => setNewRefPersonal({...newRefPersonal, parentesco: e.target.value})}
            />
            <Input 
              placeholder="Teléfono" 
              value={newRefPersonal.telefono}
              onChange={(e) => setNewRefPersonal({...newRefPersonal, telefono: e.target.value})}
            />
            <Input 
              placeholder="Observación (opcional)" 
              value={newRefPersonalObs}
              onChange={(e) => setNewRefPersonalObs(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddReferenciaPersonal(false)}>Cancelar</Button>
            <Button onClick={handleAddReferenciaPersonal} disabled={saving || !newRefPersonal.nombre.trim() || !newRefPersonal.telefono.trim()}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Referencia Laboral */}
      <Dialog open={showAddReferenciaLaboral} onOpenChange={setShowAddReferenciaLaboral}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Referencia Laboral</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input 
              placeholder="Nombre" 
              value={newRefLaboral.nombre}
              onChange={(e) => setNewRefLaboral({...newRefLaboral, nombre: e.target.value})}
            />
            <Input 
              placeholder="Empresa (opcional)" 
              value={newRefLaboral.empresa}
              onChange={(e) => setNewRefLaboral({...newRefLaboral, empresa: e.target.value})}
            />
            <Input 
              placeholder="Teléfono" 
              value={newRefLaboral.telefono}
              onChange={(e) => setNewRefLaboral({...newRefLaboral, telefono: e.target.value})}
            />
            <Input 
              placeholder="Observación (opcional)" 
              value={newRefLaboralObs}
              onChange={(e) => setNewRefLaboralObs(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddReferenciaLaboral(false)}>Cancelar</Button>
            <Button onClick={handleAddReferenciaLaboral} disabled={saving || !newRefLaboral.nombre.trim() || !newRefLaboral.telefono.trim()}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* GRID 2 COLUMNAS: DEUDAS + SEGUIMIENTO */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        
        {/* DEUDAS - 3 columnas */}
        <Card className="lg:col-span-3">
          <CardHeader className="py-2 px-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Deudas ({deudas.length})
            </CardTitle>
            <div className="text-xs text-gray-500">
              Total: <span className="font-bold text-red-600">{formatCurrency(getTotalDeuda())}</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <Table className="text-sm">
                <TableHeader className="sticky top-0 bg-gray-50">
                  <TableRow className="py-1">
                    <TableHead className="py-1 w-8"></TableHead>
                    <TableHead className="py-1">Acreedor</TableHead>
                    <TableHead className="py-1 w-20">Estado</TableHead>
                    <TableHead className="py-1 text-right">Saldo</TableHead>
                    <TableHead className="py-1 text-right">Deuda</TableHead>
                    <TableHead className="py-1 text-right w-16">Días Mora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deudas.map(deuda => (
                    <TableRow 
                      key={deuda.id} 
                      className={`py-0.5 cursor-pointer ${selectedDeudas.includes(deuda.id) ? 'bg-blue-50' : ''}`}
                      onClick={() => handleDeudaToggle(deuda.id)}
                    >
                      <TableCell className="py-1">
                        <Checkbox
                          checked={selectedDeudas.includes(deuda.id)}
                          onCheckedChange={() => handleDeudaToggle(deuda.id)}
                          className="h-4 w-4"
                        />
                      </TableCell>
                      <TableCell className="py-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{deuda.acreedor}</span>
                          {deuda.esDeudorPrincipal && (
                            <Badge className="bg-blue-100 text-blue-800 text-[10px] py-0">P</Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">{deuda.concepto}</div>
                      </TableCell>
                      <TableCell className="py-1">
                        <Badge className={`${getEstadoBadgeClass(deuda.estadoActual.nombre)} text-xs py-0`}>
                          {deuda.estadoActual.nombre}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-1 text-right text-xs">
                        {formatCurrency(deuda.saldoCapitalTotal)}
                      </TableCell>
                      <TableCell className="py-1 text-right font-medium text-xs">
                        {formatCurrency(deuda.deudaTotal)}
                      </TableCell>
                      <TableCell className="py-1 text-right">
                        <span className={deuda.diasMora > 30 ? 'text-red-600 font-medium text-xs' : 'text-xs'}>
                          {deuda.diasMora}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {deudas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-gray-500 text-sm">
                        Sin deudas
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* NUEVO SEGUIMIENTO - 2 columnas */}
        <Card className="lg:col-span-2">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Nueva Gestión
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            {success && (
              <div className="text-xs text-green-600 bg-green-50 p-2 rounded border border-green-200">
                {success}
              </div>
            )}
            {error && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Indicador de deudas seleccionadas */}
              <div className={`flex items-center gap-2 text-xs px-2.5 py-2 rounded-md border transition-colors ${
                selectedDeudas.length > 0
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-gray-50 border-dashed border-gray-300 text-gray-500'
              }`}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  selectedDeudas.length > 0 ? 'bg-blue-500' : 'bg-gray-300'
                }`} />
                {selectedDeudas.length === 0
                  ? 'Seleccione una o más deudas de la tabla'
                  : `${selectedDeudas.length} deuda${selectedDeudas.length > 1 ? 's' : ''} seleccionada${selectedDeudas.length > 1 ? 's' : ''}`
                }
              </div>

              {/* Tipo gestión */}
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600">
                  Tipo de gestión <span className="text-red-500">*</span>
                </Label>
                <Select value={tipoGestionId} onValueChange={setTipoGestionId}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Seleccionar tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposGestion.map(tipo => (
                      <SelectItem key={tipo.id} value={tipo.id.toString()} className="text-sm">
                        <div className="flex items-center gap-2">
                          {tipo.color && (
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: tipo.color }} />
                          )}
                          {tipo.nombre}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cambio de estado */}
              {reglaAplicada && (
                <div className="flex items-center gap-1.5 text-xs bg-blue-50 px-2.5 py-2 rounded-md border border-blue-200">
                  <span className="text-blue-600">{reglaAplicada.estadoOrigenNombre || 'Cualquiera'}</span>
                  <span className="text-blue-400 font-bold">→</span>
                  <span className="font-semibold text-blue-700">{reglaAplicada.estadoDestinoNombre || 'Mismo'}</span>
                  {reglaAplicada.requiereAutorizacion && (
                    <Badge className="ml-auto bg-amber-100 text-amber-700 text-[10px] py-0 border border-amber-200">
                      ⚠ Requiere auth
                    </Badge>
                  )}
                </div>
              )}

              {/* Observación */}
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600">Observación</Label>
                <Textarea
                  placeholder="Detalle de la gestión realizada..."
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  maxLength={500}
                  rows={3}
                  className="text-sm resize-none"
                />
                <div className="flex justify-end">
                  <span className={`text-[10px] ${observacion.length > 450 ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
                    {observacion.length}/500
                  </span>
                </div>
              </div>

              {/* Próxima gestión */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">
                  Próxima gestión <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-1 flex-wrap">
                  {[
                    { label: 'Mañana', days: 1 },
                    { label: '+3 días', days: 3 },
                    { label: '+1 sem', days: 7 },
                    { label: '+15 días', days: 15 },
                  ].map(({ label, days }) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + days);
                        d.setHours(9, 0, 0, 0);
                        const pad = (n: number) => String(n).padStart(2, '0');
                        setFechaProximo(
                          `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
                        );
                      }}
                      className="text-[10px] px-2 py-0.5 rounded-md border border-gray-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 text-gray-600 transition-colors cursor-pointer"
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <FechaHoraInput
                  id="fechaProximoSeg"
                  value={fechaProximo}
                  onChange={setFechaProximo}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={saving || selectedDeudas.length === 0 || !tipoGestionId}
                className="w-full h-8 text-sm"
              >
                {saving ? (
                  <span className="flex items-center gap-1.5">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                    Guardando...
                  </span>
                ) : (
                  'Guardar Gestión'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* HISTORIAL DE GESTIONES */}
      <Card>
        <CardHeader className="py-2 px-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Historial ({seguimientos.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-64 overflow-y-auto">
            {seguimientos.length > 0 ? (
              <div className="divide-y">
                {seguimientos.map(seg => (
                  <div 
                    key={seg.id} 
                    className="p-2 hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleExpand(seg.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {seg.tipoGestion.color && (
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: seg.tipoGestion.color }}
                          />
                        )}
                        <span className="font-medium text-sm">{seg.tipoGestion.nombre}</span>
                        <span className="text-xs text-gray-400">{formatDateTime(seg.fechaHora)}</span>
                        <span className="text-xs text-gray-500">• {seg.gestor}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {seg.solicitudAutorizacion && (
                          <Badge className={`${getAuthStatusBadgeClass(seg.solicitudAutorizacion.estado)} text-[10px] py-0`}>
                            {seg.solicitudAutorizacion.estado}
                          </Badge>
                        )}
                        {seg.requiereSeguimiento && seg.fechaProximoSeguimiento && (
                          <Badge className="bg-orange-100 text-orange-800 text-[10px] py-0">
                            → {formatDate(seg.fechaProximoSeguimiento)}
                          </Badge>
                        )}
                        {expandedSeg.includes(seg.id) ? (
                          <ChevronUp className="h-3 w-3 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-3 w-3 text-gray-400" />
                        )}
                      </div>
                    </div>
                    
                    {expandedSeg.includes(seg.id) && seg.observacion && (
                      <div className="mt-1 pt-1 border-t text-xs text-gray-600">
                        {seg.observacion}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 text-sm">
                Sin gestions registradas
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
