import { useEffect, useRef } from 'react';
import { X, Download, FileText, Loader2, ExternalLink, CheckCircle2 } from 'lucide-react';

/**
 * Modal de confirmação de PDF pronto para download.
 *
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - onDownload: () => void
 *  - blobUrl: string | null   (URL.createObjectURL do blob)
 *  - loading: boolean
 *  - error: string | null
 *  - filename: string         (nome sugerido para o download)
 */
export default function PdfPreviewModal({ open, onClose, onDownload, blobUrl, loading, error, filename }) {
  const backdropRef = useRef(null);

  // Fechar com Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Liberar blob URL ao fechar
  useEffect(() => {
    if (!open && blobUrl) {
      const t = setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
      return () => clearTimeout(t);
    }
  }, [open, blobUrl]);

  if (!open) return null;

  const openInNewTab = () => {
    if (blobUrl) window.open(blobUrl, '_blank');
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-erplus-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-erplus-accent" />
            <span className="font-bold text-erplus-text">Relatório PDF</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-erplus-border-light text-erplus-text-muted transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 px-5 py-8 flex flex-col items-center justify-center gap-4">
          {/* Loading */}
          {loading && (
            <>
              <Loader2 size={48} className="text-erplus-accent animate-spin" />
              <p className="text-sm font-medium text-erplus-text-muted">Gerando relatório...</p>
            </>
          )}

          {/* Erro */}
          {!loading && error && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                <FileText size={32} className="text-red-400" />
              </div>
              <p className="text-sm text-red-500 font-medium text-center">{error}</p>
              <button
                onClick={onClose}
                className="text-xs text-erplus-text-muted underline"
              >
                Fechar
              </button>
            </>
          )}

          {/* Pronto */}
          {!loading && !error && blobUrl && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 size={36} className="text-green-500" />
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-erplus-text">Relatório gerado!</p>
                <p className="text-xs text-erplus-text-muted mt-1">{filename}</p>
              </div>

              {/* Ações */}
              <div className="flex flex-col gap-3 w-full mt-2">
                <button
                  onClick={onDownload}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-erplus-accent text-white rounded-xl text-sm font-semibold hover:bg-erplus-accent/90 transition"
                >
                  <Download size={16} />
                  Baixar PDF
                </button>
                <button
                  onClick={openInNewTab}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"
                >
                  <ExternalLink size={16} />
                  Abrir em nova aba
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
