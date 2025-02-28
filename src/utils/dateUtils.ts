export function isFutureDate(dateString?: string): boolean {
  if (!dateString) return false;
  try {
    const date = new Date(dateString);
    return date > new Date();
  } catch {
    return false;
  }
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Recently';
    }
    
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Recently';
  }
}

export function formatOpenDate(dateString: string, language: 'zh-TW' | 'zh-CN'): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(language, {
    month: 'short',
    day: 'numeric',
  });
}