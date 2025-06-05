import {Role} from './role.model';

export interface UserForm {
  name: string;
  surname: string;
  email: string;
  phone: string;
  census: number;
  nif: string;
  address: string;
  city: string;
  country: string;
  scoutGroupId: number;
  role: Role;
}
