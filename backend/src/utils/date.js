/**
 * Utilidades para manejo de fechas y zona horaria local de Honduras (America/Tegucigalpa / UTC-6)
 */

const getLocalDateString = (date = new Date()) => {
  try {
    const targetDate = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Tegucigalpa' }).format(targetDate);
  } catch (e) {
    const d = date instanceof Date ? date : new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
};

module.exports = {
  getLocalDateString
};
