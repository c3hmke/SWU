const currencyFormatter = new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD' });

const conditionLabels: Record<string, string> = {
  'nm': 'NM',
  'lp': 'LP',
  'mp': 'MP',
  'hp': 'HP',
  'd': 'D'
};

export function formatPrice(price: number): string {
  return currencyFormatter.format(price);
}

export function formatCondition(condition: string | null): string {
  if (!condition) return 'U';
  return conditionLabels[condition.trim().toLowerCase()] ?? condition;
}

export function formatSeenAt(seenAt: string): string {
  const date = new Date(seenAt);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${month}-${day} ${hours}:${minutes}`;
}
