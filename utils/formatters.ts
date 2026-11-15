export function formatCurrency(amount: number): string {
  if (isNaN(amount)) return '0 đ';
  return `${amount.toLocaleString('vi-VN')} đ`;
}