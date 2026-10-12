// Shortcuts that only fill the search box. They are city names, not verified facilities.
export const careAreas: Partial<Record<string, readonly string[]>> = {
  PA: ['Ciudad de Panamá', 'Santiago de Veraguas', 'Chitré', 'Las Tablas', 'David'],
  CR: ['San José', 'Liberia', 'Limón', 'Puntarenas'],
  CO: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla'],
  EC: ['Quito', 'Guayaquil', 'Cuenca', 'Manta'],
  PE: ['Lima', 'Arequipa', 'Cusco', 'Trujillo'],
  CL: ['Santiago', 'Valparaíso', 'Concepción', 'Antofagasta'],
  AR: ['Buenos Aires', 'Mendoza', 'Córdoba', 'San Juan'],
  MX: ['Ciudad de México', 'Guadalajara', 'Oaxaca', 'Acapulco'],
};
