export const formatCurrency = (
  amount: number | undefined | null,
  currencyCode: string = 'INR',
  options: { showFraction?: boolean } = { showFraction: true }
): string => {
  const num = amount ?? 0;
  const code = (currencyCode || 'INR').toUpperCase();

  const fractionDigits = options.showFraction !== false ? 2 : 0;

  try {
    if (code === 'INR') {
      // Indian digit grouping: 1,24,500 (lakhs/crores)
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }).format(num);
    } else if (code === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }).format(num);
    } else if (code === 'EUR') {
      return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }).format(num);
    } else if (code === 'GBP') {
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }).format(num);
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(num);
  } catch {
    return `${code} ${num.toFixed(2)}`;
  }
};
