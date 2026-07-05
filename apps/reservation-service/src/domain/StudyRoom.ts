export interface StudyRoom {
  id: string;
  name: string;
  faculty: string;
  type: 'QUIET_READING' | 'GROUP_MULTIMEDIA';
  capacity: number;
  amenities: string[];
  location: string;
  currentStatus: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
  activeReservationId?: string;
  nextAvailableTime?: string;
}

export const UCE_FACULTIES = [
  'Facultad de Ciencias Administrativas',
  'Facultad de Ingeniería y Ciencias Aplicadas',
  'Facultad de Ciencias Psicológicas',
  'Facultad de Comunicación Social',
  'Facultad de Jurisprudencia y Ciencias Políticas y Sociales',
  'Facultad de Ciencias Médicas',
  'Facultad de Filosofía, Letras y Ciencias de la Educación',
  'Facultad de Arquitectura y Urbanismo',
  'Facultad de Ciencias Económicas',
  'Facultad de Ciencias Agrícolas',
  'Facultad de Ciencias Químicas',
  'Facultad de Odontología',
  'Facultad de Medicina Veterinaria y Zootecnia',
  'Facultad de Ciencias de la Discapacidad',
  'Facultad de Artes',
  'Facultad de Ciencias de la Tierra y Recursos Minerales',
  'Facultad de Cultura Física',
  'Facultad de Ciencias Biológicas',
  'Facultad de Ingeniería Química',
  'Facultad de Sociología y Política',
  'Facultad de Trabajo Social'
];

export const INITIAL_STUDY_ROOMS: StudyRoom[] = UCE_FACULTIES.flatMap((faculty, index) => {
  const code = `F${index + 1}`;
  return [
    {
      id: `room-${code}-1`,
      name: `Sala de Estudio 1 - Silenciosa (${faculty.replace('Facultad de ', '')})`,
      faculty,
      type: 'QUIET_READING',
      capacity: 15,
      amenities: ['Aire Acondicionado', 'Pizarra Blanca', 'Iluminación LED', 'Enchufes USB-C'],
      location: `Edificio ${faculty.replace('Facultad de ', '')} - Piso 1`,
      currentStatus: 'AVAILABLE'
    },
    {
      id: `room-${code}-2`,
      name: `Sala de Estudio 2 - Multimedia (${faculty.replace('Facultad de ', '')})`,
      faculty,
      type: 'GROUP_MULTIMEDIA',
      capacity: 25,
      amenities: ['Proyector 4K', 'Pizarra Digital Interactiva', 'Sistema de Sonido', 'PCs de Alto Rendimiento', 'Aire Acondicionado'],
      location: `Edificio ${faculty.replace('Facultad de ', '')} - Piso 2`,
      currentStatus: 'AVAILABLE'
    }
  ];
});
