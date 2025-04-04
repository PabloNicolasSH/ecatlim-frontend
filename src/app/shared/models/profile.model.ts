import {Role} from './role.model';

export interface Profile {
  name: string;
  surname: string;
  email: string;
  role: Role;
}
