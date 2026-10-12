// Suggestions are inserted only after an explicit choice and remain editable.
export const helpTemplates = [
  {
    id: 'call',
    label: ['Que me llamen', 'Call me'],
    text: ['Por favor, llámame para coordinar la ayuda.', 'Please call me so we can arrange help.'],
  },
  {
    id: 'pickup',
    label: ['Que me recojan', 'Pick me up'],
    text: [
      'Necesito que me recojan. Confirmen conmigo el lugar antes de salir.',
      'I need someone to pick me up. Confirm the location with me before leaving.',
    ],
  },
  {
    id: 'insurance',
    label: ['Contactar al seguro', 'Contact my insurer'],
    text: [
      'Necesito ayuda para contactar a mi seguro de viaje.',
      'I need help contacting my travel insurer.',
    ],
  },
] as const;
