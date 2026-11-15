export function buildVietQRImageUrl(params: {
  bankBin: string;
  accountNumber: string;
  amount: number;
  addInfo: string;
  accountName?: string;
}): string {
  const { bankBin, accountNumber, amount, addInfo, accountName = 'CHU NHA TRO' } = params;
  return `https://img.vietqr.io/image/${bankBin}-${accountNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
    addInfo
  )}&accountName=${encodeURIComponent(accountName)}`;
}