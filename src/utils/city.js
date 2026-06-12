export const isOtherCity = (city) =>
  String(city || '').trim().toLowerCase() === 'other';
