'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface FechaHoraInputProps {
  value: string; // ISO: "YYYY-MM-DDTHH:MM"
  onChange: (value: string) => void;
  required?: boolean;
  id?: string;
  className?: string;
}

function pad(n: number | string): string {
  return String(n).padStart(2, '0');
}

function getNowParts() {
  const now = new Date();
  return {
    dia: pad(now.getDate()),
    mes: pad(now.getMonth() + 1),
    anio: String(now.getFullYear()),
    hora: pad(now.getHours()),
    minuto: pad(now.getMinutes()),
  };
}

function parseISO(iso: string) {
  if (!iso) return getNowParts();
  const [date = '', time = ''] = iso.split('T');
  const [anio = '', mes = '', dia = ''] = date.split('-');
  const [hora = '09', minuto = '00'] = time.split(':');
  return { dia, mes, anio, hora, minuto };
}

function buildISO(dia: string, mes: string, anio: string, hora: string, minuto: string): string | null {
  const d = parseInt(dia), m = parseInt(mes), y = parseInt(anio), h = parseInt(hora), min = parseInt(minuto);
  if ([d, m, y, h, min].some(isNaN)) return null;
  if (d < 1 || d > 31 || m < 1 || m > 12 || anio.length !== 4 || y < 2000 || h < 0 || h > 23 || min < 0 || min > 59) return null;
  return `${anio}-${pad(m)}-${pad(d)}T${pad(h)}:${pad(min)}`;
}

export function FechaHoraInput({ value, onChange, required, id, className }: FechaHoraInputProps) {
  const init = parseISO(value);
  const [dia, setDia] = useState(init.dia);
  const [mes, setMes] = useState(init.mes);
  const [anio, setAnio] = useState(init.anio);
  const [hora, setHora] = useState(init.hora);
  const [minuto, setMinuto] = useState(init.minuto);

  const skipSync = useRef(false);
  const mesRef = useRef<HTMLInputElement>(null);
  const anioRef = useRef<HTMLInputElement>(null);
  const horaRef = useRef<HTMLInputElement>(null);
  const minutoRef = useRef<HTMLInputElement>(null);

  // Al montar: si value está vacío, emitir la hora actual al padre
  useEffect(() => {
    if (!value) {
      const p = getNowParts();
      setDia(p.dia);
      setMes(p.mes);
      setAnio(p.anio);
      setHora(p.hora);
      setMinuto(p.minuto);
      const iso = buildISO(p.dia, p.mes, p.anio, p.hora, p.minuto);
      if (iso) {
        skipSync.current = true;
        onChange(iso);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sincronizar cuando el padre cambia el valor (ej: botones de acceso rápido)
  useEffect(() => {
    if (skipSync.current) {
      skipSync.current = false;
      return;
    }
    const p = parseISO(value);
    setDia(p.dia);
    setMes(p.mes);
    setAnio(p.anio);
    setHora(p.hora);
    setMinuto(p.minuto);
    // Si el padre resetea a vacío, notificar con hora actual
    if (!value) {
      const iso = buildISO(p.dia, p.mes, p.anio, p.hora, p.minuto);
      if (iso) {
        skipSync.current = true;
        onChange(iso);
      }
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const emit = (d: string, m: string, y: string, h: string, min: string) => {
    const iso = buildISO(d, m, y, h, min);
    if (iso) {
      skipSync.current = true;
      onChange(iso);
    }
  };

  const handleDia = (v: string) => {
    const clean = v.replace(/\D/g, '').slice(0, 2);
    setDia(clean);
    if (clean.length === 2) mesRef.current?.focus();
    emit(clean, mes, anio, hora, minuto);
  };

  const handleMes = (v: string) => {
    const clean = v.replace(/\D/g, '').slice(0, 2);
    setMes(clean);
    if (clean.length === 2) anioRef.current?.focus();
    emit(dia, clean, anio, hora, minuto);
  };

  const handleAnio = (v: string) => {
    const clean = v.replace(/\D/g, '').slice(0, 4);
    setAnio(clean);
    if (clean.length === 4) horaRef.current?.focus();
    emit(dia, mes, clean, hora, minuto);
  };

  const handleHora = (v: string) => {
    const clean = v.replace(/\D/g, '').slice(0, 2);
    setHora(clean);
    if (clean.length === 2) minutoRef.current?.focus();
    emit(dia, mes, anio, clean, minuto);
  };

  const handleMinuto = (v: string) => {
    const clean = v.replace(/\D/g, '').slice(0, 2);
    setMinuto(clean);
    emit(dia, mes, anio, hora, clean);
  };

  const fieldCls = 'bg-transparent text-sm text-center focus:outline-none placeholder-gray-300 tabular-nums';
  const sepCls = 'text-gray-300 text-xs select-none leading-none';

  return (
    <div
      id={id}
      className={cn(
        'flex items-center gap-0.5 border border-input rounded-md px-2 h-8 bg-background',
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:border-transparent',
        'transition-shadow',
        className,
      )}
    >
      <input
        type="text"
        inputMode="numeric"
        placeholder="DD"
        value={dia}
        onChange={(e) => handleDia(e.target.value)}
        maxLength={2}
        required={required}
        className={cn(fieldCls, 'w-7')}
      />
      <span className={sepCls}>/</span>
      <input
        ref={mesRef}
        type="text"
        inputMode="numeric"
        placeholder="MM"
        value={mes}
        onChange={(e) => handleMes(e.target.value)}
        maxLength={2}
        className={cn(fieldCls, 'w-7')}
      />
      <span className={sepCls}>/</span>
      <input
        ref={anioRef}
        type="text"
        inputMode="numeric"
        placeholder="AAAA"
        value={anio}
        onChange={(e) => handleAnio(e.target.value)}
        maxLength={4}
        className={cn(fieldCls, 'w-14')}
      />
      <span className={cn(sepCls, 'mx-1')}>—</span>
      <input
        ref={horaRef}
        type="text"
        inputMode="numeric"
        placeholder="HH"
        value={hora}
        onChange={(e) => handleHora(e.target.value)}
        maxLength={2}
        className={cn(fieldCls, 'w-7')}
      />
      <span className={sepCls}>:</span>
      <input
        ref={minutoRef}
        type="text"
        inputMode="numeric"
        placeholder="MM"
        value={minuto}
        onChange={(e) => handleMinuto(e.target.value)}
        maxLength={2}
        className={cn(fieldCls, 'w-7')}
      />
    </div>
  );
}
