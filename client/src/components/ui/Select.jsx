/**
 * Select — dropdown customizado no padrão ERPlus.
 *
 * Props:
 *   value:        string | number   (controlado)
 *   onChange:     (value) => void   — recebe o valor direto, não o evento
 *   options:      Array de { value, label } ou Array de strings
 *   placeholder?: string            — texto quando value está vazio
 *   className?:   string            — classes extras para o wrapper
 *   disabled?:    boolean
 *   size?:        'sm' | 'md'       — 'sm' para selects compactos inline
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

function normalizeOptions(options) {
  if (!options) return [];
  return options.map((o) =>
    typeof o === 'string' || typeof o === 'number'
      ? { value: o, label: String(o) }
      : o
  );
}

export default function Select({
  value = '',
  onChange,
  options = [],
  placeholder = '—',
  className = '',
  disabled = false,
  size = 'md',
}) {
  const [open, setOpen]   = useState(false);
  const [pos, setPos]     = useState({ top: 0, left: 0, width: 0 });
  const triggerRef        = useRef(null);
  const popupRef          = useRef(null);

  const normalizedOptions = normalizeOptions(options);
  const selected = normalizedOptions.find((o) => String(o.value) === String(value));
  const displayLabel = selected ? selected.label : placeholder;
  const isEmpty = !selected;

  // Posiciona o dropdown abaixo (ou acima) do trigger
  const openDropdown = useCallback(() => {
    if (disabled) return;
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const itemH = 40;
    const maxVisible = Math.min(normalizedOptions.length, 7);
    const dropdownH = maxVisible * itemH + 8; // 8px de padding vertical
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow > dropdownH + 8
      ? rect.bottom + window.scrollY + 4
      : rect.top + window.scrollY - dropdownH - 4;
    setPos({ top, left: rect.left + window.scrollX, width: rect.width });
    setOpen(true);
  }, [disabled, normalizedOptions.length]);

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        !popupRef.current?.contains(e.target) &&
        !triggerRef.current?.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Scroll para o item selecionado quando abre
  useEffect(() => {
    if (!open || !popupRef.current) return;
    const idx = normalizedOptions.findIndex((o) => String(o.value) === String(value));
    if (idx === -1) return;
    setTimeout(() => {
      const items = popupRef.current?.querySelectorAll('[data-option]');
      items?.[idx]?.scrollIntoView({ block: 'nearest' });
    }, 20);
  }, [open]);

  const handleSelect = (optValue) => {
    onChange?.(optValue);
    setOpen(false);
  };

  // Estilos conforme size
  const triggerPadding = size === 'sm'
    ? 'pl-3 pr-7 py-1 text-xs'
    : 'pl-3 pr-9 py-2.5 text-sm';
  const chevronSize = size === 'sm' ? 12 : 15;
  const chevronRight = size === 'sm' ? 'right-1.5' : 'right-2.5';

  // ── Dropdown popup ──────────────────────────────────────────────────────────
  const popup = open && createPortal(
    <div
      ref={popupRef}
      className="fixed z-[9999] bg-white rounded-xl shadow-2xl border border-erplus-border overflow-hidden select-none"
      style={{
        top: pos.top,
        left: pos.left,
        width: Math.max(pos.width, 160),
        minWidth: 160,
        maxHeight: 288,
        overflowY: 'auto',
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="py-1">
        {normalizedOptions.map((opt) => {
          const isSelected = String(opt.value) === String(value);
          return (
            <button
              key={opt.value}
              data-option
              onClick={() => handleSelect(opt.value)}
              className={[
                'w-full h-10 px-3 text-sm text-left flex items-center justify-between gap-2 transition',
                isSelected
                  ? 'bg-erplus-accent text-white font-semibold'
                  : 'text-erplus-text hover:bg-erplus-accent/8 hover:text-erplus-accent',
              ].join(' ')}
            >
              <span className="truncate">{opt.label}</span>
              {isSelected && <Check size={14} className="flex-shrink-0" />}
            </button>
          );
        })}
        {normalizedOptions.length === 0 && (
          <div className="px-3 py-2 text-sm text-erplus-text-muted">Sem opções</div>
        )}
      </div>
    </div>,
    document.body
  );

  // ── Trigger ────────────────────────────────────────────────────────────────
  return (
    <>
      <div
        ref={triggerRef}
        onClick={openDropdown}
        className={[
          'relative flex items-center cursor-pointer',
          disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
          className,
        ].join(' ')}
      >
        <div
          className={[
            'w-full border rounded-lg bg-white transition',
            triggerPadding,
            open
              ? 'border-erplus-accent ring-2 ring-erplus-accent/20'
              : 'border-gray-200 hover:border-gray-300',
            isEmpty ? 'text-gray-400' : 'text-erplus-text',
          ].join(' ')}
        >
          <span className="block truncate pr-1">{displayLabel}</span>
        </div>
        <ChevronDown
          size={chevronSize}
          className={[
            `absolute ${chevronRight} top-1/2 -translate-y-1/2 pointer-events-none transition-transform text-erplus-text-muted`,
            open ? 'rotate-180 text-erplus-accent' : '',
          ].join(' ')}
        />
      </div>
      {popup}
    </>
  );
}
