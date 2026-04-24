/**
 * Formata uma string de data (ISO ou YYYY-MM-DD) para DD/MM/YYYY
 * sem conversão de timezone, evitando o problema de UTC-3 subtrair 1 dia.
 */
export function fmtDate(d) {
  if (!d) return '—';
  // Pega apenas os primeiros 10 chars (YYYY-MM-DD), ignora horário/timezone
  const s = String(d).slice(0, 10);
  const parts = s.split('-');
  if (parts.length !== 3) return d;
  const [y, m, day] = parts;
  return `${day}/${m}/${y}`;
}
