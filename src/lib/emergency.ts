export type EmergencyNumber = { number: string; label: [string, string] };
export type EmergencyDirectory = { source: string; agency: string; numbers: EmergencyNumber[] };
const directory: Record<string, EmergencyDirectory> = {
  PA: {
    source: 'https://sume911.pa/acerca-de/como-funciona',
    agency: 'SUME',
    numbers: [{ number: '911', label: ['Emergencias · SUME', 'Emergencies · SUME'] }],
  },
  CL: {
    source: 'https://www.consulado.gob.cl/emergencias-en-chile',
    agency: 'Ministerio de Relaciones Exteriores de Chile',
    numbers: [
      { number: '131', label: ['Ambulancia', 'Ambulance'] },
      { number: '132', label: ['Bomberos', 'Fire department'] },
      { number: '133', label: ['Carabineros', 'Police'] },
    ],
  },
  CO: {
    source:
      'https://www.policia.gov.co/index.php/noticia/policia-nacional-sensibiliza-comunidad-sobre-uso-las-lineas-emergencia-123-155',
    agency: 'Policía Nacional de Colombia',
    numbers: [{ number: '123', label: ['Emergencias', 'Emergencies'] }],
  },
  AR: {
    source: 'https://www.argentina.gob.ar/tema/emergencias',
    agency: 'Argentina.gob.ar',
    numbers: [
      { number: '911', label: ['Emergencias', 'Emergencies'] },
      { number: '100', label: ['Bomberos', 'Fire department'] },
      { number: '103', label: ['Defensa Civil', 'Civil defence'] },
    ],
  },
  US: {
    source: 'https://www.911.gov/calling-911/',
    agency: 'National 911 Program',
    numbers: [
      { number: '911', label: ['Policía, bomberos y ambulancia', 'Police, fire and ambulance'] },
    ],
  },
};
export function emergencyFor(country: string): EmergencyDirectory | undefined {
  return Object.hasOwn(directory, country) ? directory[country] : undefined;
}
