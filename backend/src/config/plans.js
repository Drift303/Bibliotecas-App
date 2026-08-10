// Un solo plan, un solo precio. Lo único que cambia es el descuento
// según cuántos meses se paguen por adelantado.
const monthlyPrice = 399; // ajusta este número al precio real acordado

// Descuento por pago adelantado: mensual sin descuento,
// semestral 15%, anual 20%.
const CYCLES = {
  MONTHLY: { label: 'Mensual', months: 1, discount: 0 },
  SEMESTER: { label: 'Semestral', months: 6, discount: 0.15 },
  ANNUAL: { label: 'Anual', months: 12, discount: 0.2 },
};

const isValidCycle = (cycle) => Object.prototype.hasOwnProperty.call(CYCLES, cycle);

// Calcula el total a cobrar por el ciclo completo, con el descuento aplicado.
const calculateTotal = (cycle) => {
  const cycleInfo = CYCLES[cycle];
  if (!cycleInfo) return null;
  const subtotal = monthlyPrice * cycleInfo.months;
  const total = subtotal * (1 - cycleInfo.discount);
  return Math.round(total * 100) / 100;
};

module.exports = { monthlyPrice, CYCLES, isValidCycle, calculateTotal };
