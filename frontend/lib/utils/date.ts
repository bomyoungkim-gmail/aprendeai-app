/**
 * Format a date string to a localized Brazilian Portuguese short format
 * @param dateString - ISO date string
 * @returns Formatted date string (e.g., "26 dez, 14:30")
 */
export function formatTimestamp(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a full date with year
 */
export function formatFullDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `${diffMins} min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;
  
  return formatTimestamp(dateString);
}
