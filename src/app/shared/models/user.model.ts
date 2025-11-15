import {ScoutGroup} from './scout-group.model';
import {Role} from './role.model';

export interface User {
  id?: number;
  name: string;
  surname: string;
  email: string;
  phone: string;
  census: number;
  role: Role;
  nif: string;
  address: string;
  city: string;
  country: string;
  scoutGroup: ScoutGroup;
  avatarUrl?: string;
}

export interface SimpleUser {
  id: number;
  name: string;
  surname: string;
  email: string;
}
