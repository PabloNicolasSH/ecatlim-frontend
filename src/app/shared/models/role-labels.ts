import {Role} from './role.model';

export const ROLE_LABELS: Record<Role, string> = {
  [Role.ADMIN]: 'Administración',
  [Role.MANAGER_DIRECTOR]: 'Dirección ECATLIM',
  [Role.MANAGEMENT]: 'Gestión',
  [Role.EVENT_DIRECTOR]: 'Dirección de Eventos',
  [Role.TRAINER]: 'Persona Formadora',
  [Role.HEAD_OF_EDUCATION]: 'Coord. Formación',
  [Role.STUDENT]: 'Persona en Formación'
};

export const ROLE_CLASSES: Record<Role, string> = {
  [Role.ADMIN]: 'bg-[#3D2E24] text-white',
  [Role.MANAGER_DIRECTOR]: 'bg-[#633F17] text-white',
  [Role.MANAGEMENT]: 'bg-[#9c6a33] text-white',
  [Role.EVENT_DIRECTOR]: 'bg-[#d9a45b] text-[#3D2E24]',
  [Role.TRAINER]: 'bg-[#F3E3C3] text-[#795221]',
  [Role.HEAD_OF_EDUCATION]: 'bg-emerald-100 text-emerald-800',
  [Role.STUDENT]: 'bg-[#EFEAE2] text-[#633F17]'
};
