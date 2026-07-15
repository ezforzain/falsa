export const parsePrice = (priceStr) => parseInt(String(priceStr).replace(/[^0-9]/g, ''), 10) || 0;
