import { useEffect } from 'react';
import { X, Printer } from 'lucide-react';

/**
 * Shell de pré-impressão full-screen.
 * Props:
 *   title   – string exibida na barra superior
 *   onClose – fecha o preview
 *   children – conteúdo do relatório (renderizado dentro do "papel")
 */
export default function PrintPreview({ title, onClose, children }) {
  // Fechar com Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#525659] print:bg-white print:static print:inset-auto">

      {/* ── Toolbar (oculta na impressão) ── */}
      <div className="print:hidden flex-shrink-0 bg-[#323639] text-white flex items-center justify-between px-6 py-3 shadow-md">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition"
        >
          <X size={15} />
          Fechar
        </button>

        <span className="text-sm font-semibold text-gray-200 tracking-wide">{title}</span>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-erplus-accent hover:bg-erplus-accent/90 text-white rounded-lg text-sm font-semibold transition"
        >
          <Printer size={14} />
          Imprimir
        </button>
      </div>

      {/* ── Área de papel rolável ── */}
      <div className="flex-1 overflow-y-auto print:overflow-visible py-8 px-4 print:p-0 flex justify-center">
        {/* Papel A4-like */}
        <div
          className="bg-white w-full shadow-2xl print:shadow-none print:max-w-none"
          style={{ maxWidth: 900, minHeight: 1100 }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
