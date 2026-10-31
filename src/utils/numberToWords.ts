/**
 * Converts a number to Indian Rupee Words (Lakhs, Crores, Thousands, Hundreds)
 */
export function numberToIndianWords(amount: number): string {
  if (isNaN(amount) || amount === 0) return 'Zero Rupees Only';

  const singleDigits = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  function convertBelowThousand(n: number): string {
    let str = '';
    if (n >= 100) {
      str += singleDigits[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += singleDigits[n] + ' ';
    }
    return str.trim();
  }

  const rounded = Math.round(amount * 100) / 100;
  const integerPart = Math.floor(rounded);
  const decimalPart = Math.round((rounded - integerPart) * 100);

  if (integerPart === 0 && decimalPart === 0) return 'Zero Rupees Only';

  let current = integerPart;
  const parts: string[] = [];

  // Crores (1,00,00,000)
  const crores = Math.floor(current / 10000000);
  if (crores > 0) {
    parts.push(convertBelowThousand(crores) + ' Crore');
    current %= 10000000;
  }

  // Lakhs (1,00,000)
  const lakhs = Math.floor(current / 100000);
  if (lakhs > 0) {
    parts.push(convertBelowThousand(lakhs) + ' Lakh');
    current %= 100000;
  }

  // Thousands (1,000)
  const thousands = Math.floor(current / 1000);
  if (thousands > 0) {
    parts.push(convertBelowThousand(thousands) + ' Thousand');
    current %= 1000;
  }

  // Hundreds & Below
  if (current > 0) {
    parts.push(convertBelowThousand(current));
  }

  let result = 'Indian Rupees ' + parts.join(' ').trim();

  if (decimalPart > 0) {
    result += ' and ' + convertBelowThousand(decimalPart) + ' Paise';
  }

  result += ' Only';
  return result;
}
