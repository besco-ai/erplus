/**
 * DatePicker — mini calendário no padrão ERPlus.
 *
 * Props:
 *   value:      string  YYYY-MM-DD (controlado)
 *   onChange:   (value: string) => void
 *   placeholder?: string
 *   className?:  string   classes extras para o wrapper do input
 *   disabled?:   boolean
 *   min?:        string  YYYY-MM-DD
 *   max?:        string  YYYY-MM-DD
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DAYS   = ['D','S','T','Q','Q','S','S'];

function pad(n) { return String(n).padStart(2, '0'); }

function toYMD(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseYMD(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return isNaN(date.getTime()) ? null : date;
}

function formatDisplay(str) {
  if (!str) return '';
  const d = parseYMD(str);
  if (!d) return str;
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export default function DatePicker({
  value = '',
  onChange,
  placeholder = 'dd/mm/aaaa',
  className = '',
  disabled = false,
  min,
  max,
}) {
  const today = new Date();
  const initDate = parseYMD(value) || today;

  const [open, setOpen]       = useState(false);
  const [viewYear, setViewYear]  = useState(initDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initDate.getMonth());
  const [pos, setPos]         = useState({ top: 0, left: 0, width: 0 });

  const triggerRef = useRef(null);
  const popupRef   = useRef(null);

  // Sync view when value changes externally
  useEffect(() => {
    const d = parseYMD(value);
    if (d) { setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }
  }, [value]);

  // Position popup under trigger
  const openPopup = useCallback(() => {
    if (disabled) return;
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow > 320 ? rect.bottom + window.scrollY + 4 : rect.top + window.scrollY - 324;
    setPos({ top, left: rect.left + window.scrollX, width: rect.width });
    setOpen(true);
  }, [disabled]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!popupRef.current?.contains(e.target) && !triggerRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Navigation
  const prevMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };
  const prevYear = (e) => { e.stopPropagation(); setViewYear(y => y - 1); };
  const nextYear = (e) => { e.stopPropagation(); setViewYear(y => y + 1); };

  // Day grid
  const firstDay   = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const todayStr    = toYMD(today);
  const selectedStr = value || '';

  const selectDay = (d) => {
    if (!d) return;
    const ymd = `${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`;
    if (min && ymd < min) return;
    if (max && ymd > max) return;
    onChange?.(ymd);
    setOpen(false);
  };

  const clear = (e) => {
    e.stopPropagation();
    onChange?.('');
  };

  const isDisabledDay = (d) => {
    if (!d) return true;
    const ymd = `${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`;
    if (min && ymd < min) return true;
    if (max && ymd > max) return true;
    return false;
  };

  // ── Popup JSX ──────────────────────────────────────────────────────────────
  const popup = open && createPortal(
    <div
      ref={popupRef}
      className="fixed z-[9999] bg-white rounded-2xl shadow-2xl border border-erplus-border overflow-hidden select-none"
      style={{
        top: pos.top,
        left: pos.left,
        width: Math.max(pos.width, 280),
        minWidth: 280,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* ── Header mês/ano ── */}
      <div className="px-4 pt-4 pb-2">
        {/* Ano */}
        <div className="flex items-center justify-between mb-1">
          <button onClick={prevYear}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-erplus-accent/10 text-erplus-text-muted hover:text-erplus-accent transition">
            <ChevronLeft size={14} />
          </button>
          <span className="text-sm font-bold text-erplus-text">{viewYear}</span>
          <button onClick={nextYear}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-erplus-accent/10 text-erplus-text-muted hover:text-erplus-accent transition">
            <ChevronRight size={14} />
          </button>
        </div>
        {/* Mês */}
        <div className="flex items-center justify-between">
          <button onClick={prevMonth}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-erplus-accent/10 text-erplus-text-muted hover:text-erplus-accent transition">
            <ChevronLeft size={14} />
          </button>
          <span className="text-sm font-semibold text-erplus-accent capitalize">{MONTHS[viewMonth]}</span>
          <button onClick={nextMonth}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-erplus-accent/10 text-erplus-text-muted hover:text-erplus-accent transition">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* ── Grade de dias ── */}
      <div className="px-3 pb-3">
        {/* Cabeçalho semana */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map((d, i) => (
            <div key={i} className="text-center text-[11px] font-bold text-erplus-text-muted py-1">{d}</div>
          ))}
        </div>
        {/* Células */}
        <div className="grid grid-cols-7 gap-y-0.5">
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const ymd = `${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`;
            const isSelected = ymd === selectedStr;
            const isToday    = ymd === todayStr;
            const isDisabled = isDisabledDay(d);
            return (
              <button
                key={i}
                onClick={() => selectDay(d)}
                disabled={isDisabled}
                className={[
                  'w-full aspect-square flex items-center justify-center rounded-lg text-[13px] font-medium transition',
                  isSelected
                    ? 'bg-erplus-accent text-white font-bold shadow-sm'
                    : isToday
                    ? 'bg-erplus-accent/10 text-erplus-accent font-bold ring-1 ring-erplus-accent/30'
                    : isDisabled
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-erplus-text hover:bg-erplus-accent/10 hover:text-erplus-accent cursor-pointer',
                ].join(' ')}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Rodapé ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-erplus-border bg-gray-50/60">
        <button
          onClick={(e) => { e.stopPropagation(); clear(e); setOpen(false); }}
          className="text-xs font-semibold text-erplus-text-muted hover:text-erplus-text transition"
        >
          Limpar
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            const ymd = toYMD(today);
            if ((!min || ymd >= min) && (!max || ymd <= max)) {
              onChange?.(ymd);
              setOpen(false);
            }
          }}
          className="text-xs font-semibold text-erplus-accent hover:underline transition"
        >
          Hoje
        </button>
      </div>
    </div>,
    document.body
  );

  // ── Trigger input ──────────────────────────────────────────────────────────
  return (
    <>
      <div
        ref={triggerRef}
        onClick={openPopup}
        className={[
          'relative flex items-center cursor-pointer',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
          className,
        ].join(' ')}
      >
        <Calendar
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-erplus-text-light pointer-events-none"
        />
        <input
          readOnly
          tabIndex={0}
          onFocus={openPopup}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openPopup(); if (e.key === 'Escape') setOpen(false); }}
          value={formatDisplay(value)}
          placeholder={placeholder}
          disabled={disabled}
          className={[
            'w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-erplus-accent/20 focus:border-erplus-accent transition',
            'bg-white placeholder-gray-400 caret-transparent',
            open ? 'border-erplus-accent ring-2 ring-erplus-accent/20' : '',
          ].join(' ')}
        />
        {value && !disabled && (
          <button
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onChange?.(''); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
          >
            <X size={13} />
          </button>
        )}
      </div>
      {popup}
    </>
  );
}
