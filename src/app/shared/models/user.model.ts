import {ScoutGroup} from './scout-group.model';

export interface User {
  name: string;
  surname: string;
  email: string;
  phone: string;
  census: number;
  nif: string;
  address: string;
  city: string;
  country: string;
  scoutGroup: ScoutGroup;
}
