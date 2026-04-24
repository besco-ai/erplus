/**
 * TimePicker — seletor de hora no padrão ERPlus.
 *
 * Props:
 *   value:      string  "HH:MM" (controlado)
 *   onChange:   (value: string) => void
 *   placeholder?: string
 *   className?:  string
 *   disabled?:   boolean
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Clock, X } from 'lucide-react';

function pad(n) { return String(n).padStart(2, '0'); }

const HOURS   = Array.from({ length: 24 }, (_, i) => pad(i));
const MINUTES = Array.from({ length: 12 }, (_, i) => pad(i * 5));

function parseHM(str) {
  if (!str) return { h: null, m: null };
  const [h, m] = str.split(':');
  return { h: h ?? null, m: m ?? null };
}

export default function TimePicker({
  value = '',
  onChange,
  placeholder = '--:--',
  className = '',
  disabled = false,
}) {
  const { h: initH, m: initM } = parseHM(value);

  const [open, setOpen]     = useState(false);
  const [selH, setSelH]     = useState(initH ?? '09');
  const [selM, setSelM]     = useState(initM ?? '00');
  const [pos, setPos]       = useState({ top: 0, left: 0, width: 0 });

  const triggerRef = useRef(null);
  const popupRef   = useRef(null);
  const hourRef    = useRef(null);
  const minRef     = useRef(null);

  // Sync state when value changes externally
  useEffect(() => {
    const { h, m } = parseHM(value);
    if (h) setSelH(h);
    if (m) setSelM(m);
  }, [value]);

  // Scroll selected item into center on open
  useEffect(() => {
    if (!open) return;
    setTimeout(() => {
      scrollToSelected(hourRef.current, selH, HOURS);
      scrollToSelected(minRef.current, selM, MINUTES);
    }, 30);
  }, [open]);

  function scrollToSelected(container, val, list) {
    if (!container) return;
    const idx = list.indexOf(val);
    if (idx === -1) return;
    const itemH = 40;
    container.scrollTop = idx * itemH - itemH * 2;
  }

  // Position popup
  const openPopup = useCallback(() => {
    if (disabled) return;
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const spaceBelow = window.innerHeight - rect.bottom;
    const popupH = 240;
    const top = spaceBelow > popupH + 8
      ? rect.bottom + window.scrollY + 4
      : rect.top + window.scrollY - popupH - 4;
    setPos({ top, left: rect.left + window.scrollX, width: rect.width });
    setOpen(true);
  }, [disabled]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!popupRef.current?.contains(e.target) && !triggerRef.current?.contains(e.target)) {
        commit();
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, selH, selM]);

  const commit = useCallback(() => {
    onChange?.(`${selH}:${selM}`);
  }, [selH, selM, onChange]);

  const selectHour = (h) => {
    setSelH(h);
    onChange?.(`${h}:${selM}`);
  };

  const selectMin = (m) => {
    setSelM(m);
    onChange?.(`${selH}:${m}`);
    // Auto-close after minute is chosen
    setTimeout(() => setOpen(false), 150);
  };

  const clear = (e) => {
    e.stopPropagation();
    onChange?.('');
  };

  // ── Popup ──────────────────────────────────────────────────────────────────
  const popup = open && createPortal(
    <div
      ref={popupRef}
      className="fixed z-[9999] bg-white rounded-2xl shadow-2xl border border-erplus-border overflow-hidden select-none"
      style={{ top: pos.top, left: pos.left, width: Math.max(pos.width, 200), minWidth: 200 }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-erplus-border bg-gray-50/60">
        <span className="text-xs font-bold text-erplus-text-muted uppercase tracking-wide">Horário</span>
        <div className="text-base font-bold text-erplus-accent tabular-nums">
          {selH}:{selM}
        </div>
      </div>

      {/* Colunas */}
      <div className="flex">
        {/* Horas */}
        <div className="flex-1 border-r border-erplus-border">
          <div className="text-[10px] font-bold text-center text-erplus-text-muted uppercase py-1.5 bg-gray-50/40 border-b border-erplus-border">
            Hora
          </div>
          <div
            ref={hourRef}
            className="overflow-y-auto"
            style={{ height: 160 }}
          >
            {HOURS.map((h) => (
              <button
                key={h}
                onClick={() => selectHour(h)}
                className={[
                  'w-full h-10 text-sm font-medium transition flex items-center justify-center',
                  selH === h
                    ? 'bg-erplus-accent text-white font-bold'
                    : 'text-erplus-text hover:bg-erplus-accent/10 hover:text-erplus-accent',
                ].join(' ')}
              >
                {h}
              </button>
            ))}
          </div>
        </div>

        {/* Minutos */}
        <div className="flex-1">
          <div className="text-[10px] font-bold text-center text-erplus-text-muted uppercase py-1.5 bg-gray-50/40 border-b border-erplus-border">
            Min
          </div>
          <div
            ref={minRef}
            className="overflow-y-auto"
            style={{ height: 160 }}
          >
            {MINUTES.map((m) => (
              <button
                key={m}
                onClick={() => selectMin(m)}
                className={[
                  'w-full h-10 text-sm font-medium transition flex items-center justify-center',
                  selM === m
                    ? 'bg-erplus-accent text-white font-bold'
                    : 'text-erplus-text hover:bg-erplus-accent/10 hover:text-erplus-accent',
                ].join(' ')}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-erplus-border bg-gray-50/60">
        <button
          onClick={(e) => { e.stopPropagation(); clear(e); setOpen(false); }}
          className="text-xs font-semibold text-erplus-text-muted hover:text-erplus-text transition"
        >
          Limpar
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); commit(); setOpen(false); }}
          className="text-xs font-bold text-white bg-erplus-accent px-3 py-1 rounded-lg hover:bg-erplus-accent/90 transition"
        >
          OK
        </button>
      </div>
    </div>,
    document.body
  );

  // ── Trigger ────────────────────────────────────────────────────────────────
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
        <Clock
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-erplus-text-light pointer-events-none"
        />
        <input
          readOnly
          tabIndex={0}
          onFocus={openPopup}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openPopup(); if (e.key === 'Escape') setOpen(false); }}
          value={value || ''}
          placeholder={placeholder}
          disabled={disabled}
          className={[
            'w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-erplus-accent/20 focus:border-erplus-accent transition',
            'bg-white placeholder-gray-400 caret-transparent tabular-nums',
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
