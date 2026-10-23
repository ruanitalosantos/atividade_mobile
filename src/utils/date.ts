/** Converte "DD/MM/AAAA" para "AAAA-MM-DD". Retorna null se a data for inválida. */
export function parseBrDate(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;

  const [, dd, mm, yyyy] = match;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  // Rejeita datas como 31/02/2026, que o Date "corrige" para março.
  if (date.getDate() !== Number(dd) || date.getMonth() !== Number(mm) - 1) return null;

  return `${yyyy}-${mm}-${dd}`;
}

/** Converte "AAAA-MM-DD" para "DD/MM/AAAA". */
export function formatBrDate(iso: string | null): string {
  if (!iso) return '';
  const [yyyy, mm, dd] = iso.slice(0, 10).split('-');
  return `${dd}/${mm}/${yyyy}`;
}

/** Aplica a máscara DD/MM/AAAA enquanto o usuário digita. */
export function maskBrDate(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function isOverdue(iso: string | null): boolean {
  if (!iso) return false;
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return iso < todayIso;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}
