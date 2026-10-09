import { daysFromNow } from './logic.js';

// Fictional company, fictional people. Every date is relative to today so the demo never looks stale.
const iso = n => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
};

export const COMPANY = 'Sol del Sur Instalaciones';

export function seed() {
  return {
    contacts: [
      { id: 'c1', name: 'Marta Hernández', company: 'Hotel Rural La Higuera', phone: '600 000 101', email: 'marta@example.com', town: 'Vilaflor' },
      { id: 'c2', name: 'Andrés Cabrera', company: '', phone: '600 000 102', email: 'andres@example.com', town: 'Adeje' },
      { id: 'c3', name: 'Lucía Pérez', company: 'Panadería Los Cristianos', phone: '600 000 103', email: 'lucia@example.com', town: 'Los Cristianos' },
      { id: 'c4', name: 'Tomás Rodríguez', company: 'Finca El Roque', phone: '600 000 104', email: 'tomas@example.com', town: 'Guía de Isora' },
      { id: 'c5', name: 'Elena Díaz', company: '', phone: '600 000 105', email: 'elena@example.com', town: 'Santiago del Teide' },
      { id: 'c6', name: 'Javier Mora', company: 'Taller Mora', phone: '600 000 106', email: 'javier@example.com', town: 'Arona' },
      { id: 'c7', name: 'Carmen Suárez', company: 'Clínica Dental Costa', phone: '600 000 107', email: 'carmen@example.com', town: 'Playa de las Américas' },
      { id: 'c8', name: 'Rubén Alonso', company: '', phone: '600 000 108', email: 'ruben@example.com', town: 'Granadilla' },
      { id: 'c9', name: 'Pilar Gómez', company: 'Casa Rural El Drago', phone: '600 000 109', email: 'pilar@example.com', town: 'Icod de los Vinos' },
    ],
    opps: [
      { id: 'o1', contactId: 'c8', title: { en: '4 kWp rooftop system, detached house', es: 'Instalación de 4 kWp en tejado, vivienda unifamiliar' }, value: 6800, stage: 'new', lostReason: '', wonAt: '', createdAt: iso(-1), log: [
        { id: 'l1', at: iso(-1), type: 'note', text: { en: 'Enquiry through the website. Wants to cut a 160 EUR electricity bill.', es: 'Consulta desde la web. Quiere reducir una factura de luz de 160 EUR.' } } ] },
      { id: 'o2', contactId: 'c5', title: { en: '3 kWp system with battery', es: 'Sistema de 3 kWp con batería' }, value: 8900, stage: 'new', lostReason: '', wonAt: '', createdAt: iso(-2), log: [] },
      { id: 'o3', contactId: 'c1', title: { en: '15 kWp system for a rural hotel', es: 'Instalación de 15 kWp para hotel rural' }, value: 21500, stage: 'visit', lostReason: '', wonAt: '', createdAt: iso(-8), log: [
        { id: 'l2', at: iso(-3), type: 'stage', from: 'new', to: 'visit' },
        { id: 'l3', at: iso(-4), type: 'note', text: { en: 'Call: big roof, south facing, shade from two palms. Site visit booked.', es: 'Llamada: tejado grande orientado al sur, sombra de dos palmeras. Visita técnica acordada.' } } ] },
      { id: 'o4', contactId: 'c3', title: { en: '8 kWp for a bakery with ovens', es: 'Instalación de 8 kWp para panadería con hornos' }, value: 12400, stage: 'visit', lostReason: '', wonAt: '', createdAt: iso(-6), log: [] },
      { id: 'o5', contactId: 'c4', title: { en: 'Solar pumping for a water well', es: 'Bombeo solar para pozo de agua' }, value: 9300, stage: 'quote', lostReason: '', wonAt: '', createdAt: iso(-14), log: [
        { id: 'l4', at: iso(-5), type: 'stage', from: 'visit', to: 'quote' },
        { id: 'l5', at: iso(-5), type: 'note', text: { en: 'Quote sent by email. Owner wants to compare with a second supplier.', es: 'Presupuesto enviado por correo. El propietario quiere compararlo con otro proveedor.' } } ] },
      { id: 'o6', contactId: 'c7', title: { en: '12 kWp for a dental clinic', es: 'Instalación de 12 kWp para clínica dental' }, value: 17800, stage: 'quote', lostReason: '', wonAt: '', createdAt: iso(-12), log: [] },
      { id: 'o7', contactId: 'c9', title: { en: '6 kWp plus car charger', es: '6 kWp más punto de carga para coche' }, value: 11200, stage: 'negotiation', lostReason: '', wonAt: '', createdAt: iso(-21), log: [
        { id: 'l6', at: iso(-2), type: 'note', text: { en: 'Asked for a 5% discount if she pays 50% upfront. Checking margin.', es: 'Pide un 5% de descuento si paga el 50% por adelantado. Reviso el margen.' } } ] },
      { id: 'o8', contactId: 'c6', title: { en: '10 kWp for a mechanic workshop', es: 'Instalación de 10 kWp para taller mecánico' }, value: 14600, stage: 'won', lostReason: '', wonAt: iso(-4), createdAt: iso(-30), log: [
        { id: 'l7', at: iso(-4), type: 'stage', from: 'negotiation', to: 'won' } ] },
      { id: 'o9', contactId: 'c2', title: { en: '5 kWp, apartment block roof share', es: '5 kWp, cubierta compartida en edificio' }, value: 7400, stage: 'lost', lostReason: 'community', wonAt: '', createdAt: iso(-35), log: [
        { id: 'l8', at: iso(-10), type: 'stage', from: 'quote', to: 'lost' } ] },
    ],
    tasks: [
      { id: 't1', oppId: 'o3', text: { en: 'Confirm site visit time with Marta', es: 'Confirmar la hora de la visita técnica con Marta' }, due: daysFromNow(-1), done: false },
      { id: 't2', oppId: 'o5', text: { en: 'Follow up on the quote', es: 'Hacer seguimiento del presupuesto' }, due: daysFromNow(0), done: false },
      { id: 't3', oppId: 'o7', text: { en: 'Reply on the discount and send final price', es: 'Responder sobre el descuento y enviar el precio final' }, due: daysFromNow(0), done: false },
      { id: 't4', oppId: 'o1', text: { en: 'Call back and book a site visit', es: 'Llamar y concertar visita técnica' }, due: daysFromNow(1), done: false },
      { id: 't5', oppId: 'o6', text: { en: 'Send financing options', es: 'Enviar opciones de financiación' }, due: daysFromNow(3), done: false },
      { id: 't6', oppId: 'o8', text: { en: 'Order panels for the installation date', es: 'Pedir los paneles para la fecha de instalación' }, due: daysFromNow(-3), done: true },
    ],
  };
}
