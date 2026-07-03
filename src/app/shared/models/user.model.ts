import {ScoutGroup} from './scout-group.model';
import {Role} from './role.model';
import {Profile} from './profile.model';

export interface User {
  id?: number;
  email: string;
  role: Role;
  profile?: UserProfile;
}

export interface SimpleUser {
  id?: number;
  name: string;
  email: string;
}

export interface UserProfile {
  name: string;
  surname: string;
  phone: string;
  census: number;
  nif: string;
  address: string;
  city: string;
  country: string;
  scoutGroup: ScoutGroup;
  avatarUrl?: string;
}
